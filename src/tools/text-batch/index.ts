import type { ToolModule } from "../types";
import TextBatch from "./TextBatch.vue";
import { DocumentTextOutline } from "@vicons/ionicons5";

export const textBatch: ToolModule = {
  id: "text-batch",
  name: "文本批量处理",
  description: "去空行、去重、排序、大小写转换、查找替换等批量操作",
  icon: DocumentTextOutline,
  accent: "#0ea5e9",
  category: "其他",
  component: TextBatch,
  keywords: ["文本", "批量", "去重", "排序", "text", "batch", "处理"],
  toHistory(input, output) {
    return {
      title: String(input ?? "").slice(0, 60) || "文本批量处理",
      input: String(input ?? ""),
      output: String(output ?? ""),
    };
  },
  fromHistory(entry) {
    return { input: entry.input, output: entry.output };
  },
};
