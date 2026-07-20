use serde::Serialize;

#[derive(Serialize)]
pub struct JsonResult {
    pub success: bool,
    pub data: String,
    pub error: String,
}

/// 格式化 JSON（美化输出）
#[tauri::command]
pub fn format_json(input: String, indent: u32) -> JsonResult {
    match serde_json::from_str::<serde_json::Value>(&input) {
        Ok(value) => {
            let pretty = if indent == 2 {
                serde_json::to_string_pretty(&value).unwrap_or_default()
            } else {
                // 4 空格或 tab
                let formatter = serde_json::ser::PrettyFormatter::with_indent(
                    if indent == 4 { b"    " } else { b"\t" },
                );
                let mut buf = Vec::new();
                let mut ser = serde_json::Serializer::with_formatter(&mut buf, formatter);
                value.serialize(&mut ser).ok();
                String::from_utf8_lossy(&buf).to_string()
            };
            JsonResult {
                success: true,
                data: pretty,
                error: String::new(),
            }
        }
        Err(e) => JsonResult {
            success: false,
            data: String::new(),
            error: format!("JSON 解析失败：{}", e),
        },
    }
}

/// 压缩 JSON（去除空白）
#[tauri::command]
pub fn minify_json(input: String) -> JsonResult {
    match serde_json::from_str::<serde_json::Value>(&input) {
        Ok(value) => {
            let compact = serde_json::to_string(&value).unwrap_or_default();
            JsonResult {
                success: true,
                data: compact,
                error: String::new(),
            }
        }
        Err(e) => JsonResult {
            success: false,
            data: String::new(),
            error: format!("JSON 解析失败：{}", e),
        },
    }
}

/// 校验 JSON 是否合法
#[tauri::command]
pub fn validate_json(input: String) -> JsonResult {
    match serde_json::from_str::<serde_json::Value>(&input) {
        Ok(_) => JsonResult {
            success: true,
            data: "JSON 格式合法".to_string(),
            error: String::new(),
        },
        Err(e) => JsonResult {
            success: false,
            data: String::new(),
            error: format!("JSON 格式错误：{}", e),
        },
    }
}
