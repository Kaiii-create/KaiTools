use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Instant;

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

#[tauri::command]
pub async fn http_request(args: HttpRequestArgs) -> HttpResponse {
    let start = Instant::now();

    let client = match Client::builder()
        .danger_accept_invalid_certs(true)
        .user_agent("KTool/0.1")
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            return HttpResponse {
                status: 0,
                headers: HashMap::new(),
                body: String::new(),
                time_ms: 0,
                error: Some(format!("客户端构建失败：{e}")),
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
            let mut resp_headers = HashMap::new();
            for (k, v) in res.headers().iter() {
                if let Ok(val) = v.to_str() {
                    resp_headers.insert(k.as_str().to_string(), val.to_string());
                }
            }
            let body = res.text().await.unwrap_or_default();
            let time_ms = start.elapsed().as_millis() as u64;
            HttpResponse {
                status,
                headers: resp_headers,
                body,
                time_ms,
                error: None,
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
