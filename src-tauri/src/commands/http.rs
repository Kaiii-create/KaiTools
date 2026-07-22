use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::{Duration, Instant};

const MAX_RESPONSE_BYTES: usize = 10 * 1024 * 1024;
const MAX_IMAGE_BYTES: usize = 20 * 1024 * 1024;

fn build_client() -> Result<Client, String> {
    Client::builder()
        .connect_timeout(Duration::from_secs(10))
        .timeout(Duration::from_secs(30))
        .redirect(reqwest::redirect::Policy::limited(10))
        .user_agent("KTool/0.1")
        .build()
        .map_err(|e| format!("客户端构建失败：{e}"))
}

async fn read_limited(mut response: reqwest::Response, limit: usize) -> Result<Vec<u8>, String> {
    if response.content_length().is_some_and(|size| size > limit as u64) {
        return Err(format!("响应过大，最大允许 {} MB", limit / 1024 / 1024));
    }
    let mut body = Vec::new();
    while let Some(chunk) = response
        .chunk()
        .await
        .map_err(|e| format!("读取响应失败：{e}"))?
    {
        if body.len().saturating_add(chunk.len()) > limit {
            return Err(format!("响应过大，最大允许 {} MB", limit / 1024 / 1024));
        }
        body.extend_from_slice(&chunk);
    }
    Ok(body)
}

#[derive(Deserialize)]
pub struct HttpRequestArgs {
    pub method: String,
    pub url: String,
    #[serde(default)]
    pub headers: HashMap<String, String>,
    #[serde(default)]
    pub body: Option<String>,
}

#[derive(Serialize)]
pub struct HttpResponse {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub time_ms: u64,
    pub error: Option<String>,
}

/// 按 URL 抓取图片原始字节，供前端解码二维码（绕过 WebView CSP 限制）
#[tauri::command]
pub async fn fetch_image_bytes(url: String) -> Result<Vec<u8>, String> {
    let parsed = reqwest::Url::parse(&url).map_err(|e| format!("无效地址：{e}"))?;
    if !matches!(parsed.scheme(), "http" | "https") {
        return Err("仅支持 http/https 图片地址".to_string());
    }
    let client = build_client()?;
    let resp = client
        .get(parsed)
        .send()
        .await
        .map_err(|e| format!("请求失败：{e}"))?;
    if !resp.status().is_success() {
        return Err(format!("HTTP {}", resp.status()));
    }
    read_limited(resp, MAX_IMAGE_BYTES).await
}

#[tauri::command]
pub async fn http_request(args: HttpRequestArgs) -> HttpResponse {
    let start = Instant::now();

    let client = match build_client() {
        Ok(c) => c,
        Err(e) => {
            return HttpResponse {
                status: 0,
                headers: HashMap::new(),
                body: String::new(),
                time_ms: 0,
                error: Some(e),
            }
        }
    };

    let method = match args.method.to_uppercase().as_str() {
        "GET" => reqwest::Method::GET,
        "POST" => reqwest::Method::POST,
        "PUT" => reqwest::Method::PUT,
        "DELETE" => reqwest::Method::DELETE,
        "PATCH" => reqwest::Method::PATCH,
        "HEAD" => reqwest::Method::HEAD,
        "OPTIONS" => reqwest::Method::OPTIONS,
        _ => reqwest::Method::GET,
    };

    let mut req = client.request(method, &args.url);
    for (k, v) in &args.headers {
        req = req.header(k, v);
    }
    if let Some(body) = args.body {
        if !body.is_empty() {
            req = req.body(body);
        }
    }

    match req.send().await {
        Ok(res) => {
            let status = res.status().as_u16();
            let mut resp_headers: HashMap<String, String> = HashMap::new();
            for (k, v) in res.headers().iter() {
                if let Ok(val) = v.to_str() {
                    resp_headers
                        .entry(k.as_str().to_string())
                        .and_modify(|old| {
                            old.push_str(if k.as_str().eq_ignore_ascii_case("set-cookie") {
                                "\n"
                            } else {
                                ", "
                            });
                            old.push_str(val);
                        })
                        .or_insert_with(|| val.to_string());
                }
            }
            let body_result = read_limited(res, MAX_RESPONSE_BYTES).await;
            let time_ms = start.elapsed().as_millis() as u64;
            match body_result {
                Ok(bytes) => HttpResponse {
                    status,
                    headers: resp_headers,
                    body: String::from_utf8_lossy(&bytes).into_owned(),
                    time_ms,
                    error: None,
                },
                Err(error) => HttpResponse {
                    status,
                    headers: resp_headers,
                    body: String::new(),
                    time_ms,
                    error: Some(error),
                },
            }
        }
        Err(e) => HttpResponse {
            status: 0,
            headers: HashMap::new(),
            body: String::new(),
            time_ms: start.elapsed().as_millis() as u64,
            error: Some(e.to_string()),
        },
    }
}
