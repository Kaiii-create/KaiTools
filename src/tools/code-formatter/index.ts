import type { ToolModule } from "../types";
import CodeFormatter from "./CodeFormatter.vue";
import { CodeSlashOutline } from "@vicons/ionicons5";

export const codeFormatter: ToolModule = {
  id: "code-formatter",
  name: "代码格式化",
  description: "HTML/CSS/JS/SQL 代码格式化与压缩",
  icon: CodeSlashOutline,
  accent: "#8b5cf6",
  category: "编码",
  keywords: ["code", "format", "html", "css", "js", "sql", "格式化"],
  component: CodeFormatter,
  toHistory(input, output) {
    return {
      title: String(input ?? "").slice(0, 60) || "代码格式化记录",
      input: String(input ?? ""),
      output: String(output ?? ""),
    };
  },
  fromHistory(entry) {
    return { input: entry.input, output: entry.output };
  },
};
