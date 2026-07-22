use serde::Serialize;

#[derive(Serialize)]
pub struct JsonResult {
    pub success: bool,
    pub data: String,
    pub error: String,
}

fn validate(input: &str) -> Result<(), serde_json::Error> {
    serde_json::from_str::<serde_json::Value>(input).map(|_| ())
}

/// 只调整字符串外部的空白，不反序列化数据。
/// 这样可以保留对象键顺序、重复键、数字原文以及字符串转义形式。
fn rewrite_whitespace(input: &str, indent: Option<&[u8]>) -> String {
    let bytes = input.as_bytes();
    let mut out = Vec::with_capacity(bytes.len() + bytes.len() / 4);
    let mut depth = 0usize;
    let mut in_string = false;
    let mut escaped = false;
    let mut i = 0usize;

    let write_indent = |out: &mut Vec<u8>, depth: usize, unit: &[u8]| {
        for _ in 0..depth {
            out.extend_from_slice(unit);
        }
    };

    while i < bytes.len() {
        let b = bytes[i];
        if in_string {
            out.push(b);
            if escaped {
                escaped = false;
            } else if b == b'\\' {
                escaped = true;
            } else if b == b'"' {
                in_string = false;
            }
            i += 1;
            continue;
        }

        match b {
            b'"' => {
                in_string = true;
                out.push(b);
            }
            b' ' | b'\t' | b'\r' | b'\n' => {}
            b'{' | b'[' => {
                out.push(b);
                depth += 1;
                if let Some(unit) = indent {
                    let next = bytes[i + 1..]
                        .iter()
                        .copied()
                        .find(|c| !matches!(c, b' ' | b'\t' | b'\r' | b'\n'));
                    if !matches!((b, next), (b'{', Some(b'}')) | (b'[', Some(b']'))) {
                        out.push(b'\n');
                        write_indent(&mut out, depth, unit);
                    }
                }
            }
            b'}' | b']' => {
                depth = depth.saturating_sub(1);
                if let Some(unit) = indent {
                    let previous = out.last().copied();
                    if !matches!((b, previous), (b'}', Some(b'{')) | (b']', Some(b'['))) {
                        out.push(b'\n');
                        write_indent(&mut out, depth, unit);
                    }
                }
                out.push(b);
            }
            b',' => {
                out.push(b);
                if let Some(unit) = indent {
                    out.push(b'\n');
                    write_indent(&mut out, depth, unit);
                }
            }
            b':' => {
                out.push(b);
                if indent.is_some() {
                    out.push(b' ');
                }
            }
            _ => out.push(b),
        }
        i += 1;
    }

    String::from_utf8(out).expect("validated JSON input must be valid UTF-8")
}

/// 格式化 JSON（美化输出）
#[tauri::command]
pub fn format_json(input: String, indent: u32) -> JsonResult {
    match validate(&input) {
        Ok(()) => {
            let unit: &[u8] = match indent {
                4 => b"    ",
                8 => b"\t",
                _ => b"  ",
            };
            JsonResult {
                success: true,
                data: rewrite_whitespace(&input, Some(unit)),
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
    match validate(&input) {
        Ok(()) => JsonResult {
            success: true,
            data: rewrite_whitespace(&input, None),
            error: String::new(),
        },
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
    match validate(&input) {
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

#[cfg(test)]
mod tests {
    use super::{format_json, minify_json};

    #[test]
    fn preserves_order_large_numbers_duplicate_keys_and_escapes() {
        let input = r#"{"z":1,"a":18446744073709551616,"z":2,"s":"\u0000"}"#;
        let result = format_json(input.to_string(), 2);
        assert!(result.success, "{}", result.error);
        assert!(result.data.starts_with("{\n  \"z\": 1,\n  \"a\":"));
        assert!(result.data.contains("18446744073709551616"));
        assert_eq!(result.data.matches("\"z\"").count(), 2);
        assert!(result.data.contains(r#""s": "\u0000""#));
    }

    #[test]
    fn minifies_only_whitespace_outside_strings() {
        let input = "{ \"text\": \"a b\", \"items\": [1, 2] }";
        let result = minify_json(input.to_string());
        assert!(result.success, "{}", result.error);
        assert_eq!(result.data, r#"{"text":"a b","items":[1,2]}"#);
    }
}
