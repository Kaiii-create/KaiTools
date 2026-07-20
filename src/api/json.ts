import { invoke } from "@tauri-apps/api/core";

export interface JsonResult {
  success: boolean;
  data: string;
  error: string;
}

/** 格式化 JSON */
export async function formatJson(input: string, indent: 2 | 4 | 8): Promise<JsonResult> {
  // indent: 8 表示 tab
  return invoke<JsonResult>("format_json", { input, indent });
}

/** 压缩 JSON */
export async function minifyJson(input: string): Promise<JsonResult> {
  return invoke<JsonResult>("minify_json", { input });
}

/** 校验 JSON */
export async function validateJson(input: string): Promise<JsonResult> {
  return invoke<JsonResult>("validate_json", { input });
}
