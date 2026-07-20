import type { ToolModule } from "../types";
import JsonFormatter from "./JsonFormatter.vue";
import { CodeWorking } from "@vicons/ionicons5";

export const jsonFormatter: ToolModule = {
  id: "json-formatter",
  name: "JSON 格式化",
  description: "JSON 格式化、压缩、校验",
  icon: CodeWorking,
  category: "编码",
  keywords: ["json", "format", "beautify", "minify", "validate", "格式化", "压缩", "校验"],
  component: JsonFormatter,
  toHistory(input, output) {
    return {
      title: (input as string)?.slice(0, 60) || "JSON 记录",
      input: String(input ?? ""),
      output: String(output ?? ""),
    };
  },
  fromHistory(entry) {
    return { input: entry.input, output: entry.output };
  },
};
