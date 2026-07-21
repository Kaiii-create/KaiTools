import type { ToolModule } from "../types";
import MarkdownEditor from "./MarkdownEditor.vue";
import { LogoMarkdown } from "@vicons/ionicons5";

export const markdownEditor: ToolModule = {
  id: "markdown-editor",
  name: "Markdown 编辑器",
  description: "Markdown 实时编辑预览",
  icon: LogoMarkdown,
  accent: "#8b5cf6",
  category: "编码",
  keywords: ["markdown", "md", "编辑器", "markdown editor"],
  component: MarkdownEditor,
  toHistory(input, output) {
    return {
      title: (String(input ?? "").split("\n")[0] || "Markdown 记录").slice(0, 60),
      input: String(input ?? ""),
      output: String(output ?? ""),
    };
  },
  fromHistory(entry) {
    return { input: entry.input, output: entry.output };
  },
};
