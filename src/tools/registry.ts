import type { ToolModule } from "./types";
import { jsonFormatter } from "./json-formatter";
import { timestamp } from "./timestamp";
import { base64Url } from "./base64-url";
import { qrcode } from "./qrcode";
import { httpRequester } from "./http-requester";
import { codeFormatter } from "./code-formatter";
import { cryptoTool } from "./crypto";
import { colorTool } from "./color";
import { worldClock } from "./world-clock";
import { imageToIco } from "./image-to-ico";
import { codeDiff } from "./code-diff";
import { markdownEditor } from "./markdown-editor";
import { qrDecode } from "./qr-decode";
import { textBatch } from "./text-batch";
import { regexTester } from "./regex-tester";
import { generator } from "./generator";
import { baseConvert } from "./base-convert";
import { documentConverter } from "./document-converter";

/** 工具注册表（中央目录）
 *
 * 新增工具只需：
 * 1. 在 ./<tool-id>/ 下实现 ToolModule
 * 2. 在下方 register(...) 一行
 */
const registry = new Map<string, ToolModule>();

function register(tool: ToolModule) {
  if (registry.has(tool.id)) {
    console.warn(`[registry] 工具 ${tool.id} 已注册，跳过`);
    return;
  }
  registry.set(tool.id, tool);
}

// 注册工具
register(jsonFormatter);
register(timestamp);
register(base64Url);
register(qrcode);
register(httpRequester);
register(codeFormatter);
register(cryptoTool);
register(colorTool);
register(worldClock);
register(imageToIco);
register(codeDiff);
register(markdownEditor);
register(qrDecode);
register(textBatch);
register(regexTester);
register(generator);
register(baseConvert);
register(documentConverter);

export const tools = Array.from(registry.values());

export function getTool(id: string): ToolModule | undefined {
  return registry.get(id);
}

export function searchTools(query: string): ToolModule[] {
  const q = query.trim().toLowerCase();
  if (!q) return tools;
  return tools.filter((t) => {
    const haystack = [t.name, t.description ?? "", ...t.keywords]
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
