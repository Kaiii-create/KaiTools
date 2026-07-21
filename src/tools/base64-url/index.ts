import type { ToolModule } from "../types";
import Base64Url from "./Base64Url.vue";
import { TextOutline } from "@vicons/ionicons5";

export const base64Url: ToolModule = {
  id: "base64-url",
  name: "Base64 / URL 编解码",
  description: "Base64 与 URL 编解码",
  icon: TextOutline,
  accent: "#8b5cf6",
  category: "编码",
  keywords: ["base64", "url", "encode", "decode", "编码", "解码"],
  component: Base64Url,
  toHistory(input, output) {
    return {
      title: String(input ?? "").slice(0, 60) || "编解码记录",
      input: String(input ?? ""),
      output: String(output ?? ""),
    };
  },
  fromHistory(entry) {
    return { input: entry.input, output: entry.output };
  },
};
