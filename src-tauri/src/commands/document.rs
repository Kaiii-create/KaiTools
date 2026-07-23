use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

const CONVERSION_TIMEOUT: Duration = Duration::from_secs(180);

const WORD_CONVERSION_SCRIPT: &str = r#"
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$word = $null
$document = $null
try {
  $inputPath = [System.IO.Path]::GetFullPath($env:KTOOL_DOC_INPUT)
  $outputPath = [System.IO.Path]::GetFullPath($env:KTOOL_DOC_OUTPUT)
  try {
    $word = New-Object -ComObject Word.Application
  } catch {
    throw '未检测到可用的 Microsoft Word。请先安装并激活桌面版 Word。'
  }
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $document = $word.Documents.Open($inputPath, $false, $true)
  if ($env:KTOOL_DOC_MODE -eq 'word-to-pdf') {
    $document.ExportAsFixedFormat($outputPath, 17)
  } elseif ($env:KTOOL_DOC_MODE -eq 'pdf-to-word') {
    $document.SaveAs2($outputPath, 16)
  } else {
    throw '不支持的文档转换类型。'
  }
} catch {
  [Console]::Error.WriteLine($_.Exception.Message)
  exit 1
} finally {
  if ($null -ne $document) {
    try { $document.Close(0) } catch {}
    try { [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($document) } catch {}
  }
  if ($null -ne $word) {
    try { $word.Quit() } catch {}
    try { [void][System.Runtime.InteropServices.Marshal]::FinalReleaseComObject($word) } catch {}
  }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
"#;

fn extension(path: &Path) -> String {
    path.extension()
        .and_then(|value| value.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase()
}

fn validate_paths(input: &Path, output: &Path, conversion: &str) -> Result<(), String> {
    if !input.is_file() {
        return Err("源文件不存在或不是有效文件".to_string());
    }

    let parent = output
        .parent()
        .filter(|value| !value.as_os_str().is_empty())
        .ok_or_else(|| "输出路径无效".to_string())?;
    if !parent.is_dir() {
        return Err("输出目录不存在".to_string());
    }

    let input_ext = extension(input);
    let output_ext = extension(output);
    match conversion {
        "word-to-pdf" if ["doc", "docx"].contains(&input_ext.as_str()) && output_ext == "pdf" => {}
        "pdf-to-word" if input_ext == "pdf" && output_ext == "docx" => {}
        "word-to-pdf" => return Err("Word 转 PDF 仅支持 .doc/.docx 输入和 .pdf 输出".to_string()),
        "pdf-to-word" => return Err("PDF 转 Word 仅支持 .pdf 输入和 .docx 输出".to_string()),
        _ => return Err("不支持的文档转换类型".to_string()),
    }

    let input_key = input.to_string_lossy().replace('/', "\\").to_lowercase();
    let output_key = output.to_string_lossy().replace('/', "\\").to_lowercase();
    if input_key == output_key {
        return Err("源文件和输出文件不能相同".to_string());
    }
    Ok(())
}

#[cfg(target_os = "windows")]
fn run_word_conversion(input: &Path, output: &Path, conversion: &str) -> Result<(), String> {
    use std::os::windows::process::CommandExt;

    let mut command = Command::new("powershell.exe");
    command
        .args([
            "-NoLogo",
            "-NoProfile",
            "-NonInteractive",
            "-STA",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            WORD_CONVERSION_SCRIPT,
        ])
        .env("KTOOL_DOC_INPUT", input)
        .env("KTOOL_DOC_OUTPUT", output)
        .env("KTOOL_DOC_MODE", conversion)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .creation_flags(0x0800_0000);

    let mut child = command
        .spawn()
        .map_err(|error| format!("无法启动文档转换服务：{error}"))?;
    let started = Instant::now();
    let status = loop {
        if let Some(status) = child
            .try_wait()
            .map_err(|error| format!("文档转换进程异常：{error}"))?
        {
            break status;
        }
        if started.elapsed() >= CONVERSION_TIMEOUT {
            let _ = child.kill();
            let _ = child.wait();
            return Err("转换超时。请关闭 Word 中的弹窗或受保护视图后重试".to_string());
        }
        thread::sleep(Duration::from_millis(100));
    };

    let mut stderr = String::new();
    if let Some(mut pipe) = child.stderr.take() {
        let _ = pipe.read_to_string(&mut stderr);
    }
    if !status.success() {
        let detail = stderr.trim();
        return Err(if detail.is_empty() {
            "文档转换失败，请确认文件未损坏、未加密且没有被其他程序占用".to_string()
        } else {
            detail.to_string()
        });
    }
    Ok(())
}

#[cfg(not(target_os = "windows"))]
fn run_word_conversion(_input: &Path, _output: &Path, _conversion: &str) -> Result<(), String> {
    Err("当前文档转换功能仅支持 Windows".to_string())
}

fn convert_document_sync(
    input_path: String,
    output_path: String,
    conversion: String,
) -> Result<String, String> {
    let input = PathBuf::from(input_path);
    let output = PathBuf::from(output_path);
    validate_paths(&input, &output, &conversion)?;
    run_word_conversion(&input, &output, &conversion)?;

    let metadata = fs::metadata(&output).map_err(|_| "转换完成，但未找到输出文件".to_string())?;
    if !metadata.is_file() || metadata.len() == 0 {
        return Err("转换完成，但输出文件为空".to_string());
    }
    Ok(output.to_string_lossy().into_owned())
}

#[tauri::command]
pub async fn convert_document(
    input_path: String,
    output_path: String,
    conversion: String,
) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || {
        convert_document_sync(input_path, output_path, conversion)
    })
    .await
    .map_err(|error| format!("文档转换任务异常：{error}"))?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn recognizes_extensions_case_insensitively() {
        assert_eq!(extension(Path::new("demo.DOCX")), "docx");
        assert_eq!(extension(Path::new("demo.PDF")), "pdf");
    }
}
