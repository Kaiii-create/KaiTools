import type { ToolModule } from "../types";
import CodeDiff from "./CodeDiff.vue";
import { GitCompareOutline } from "@vicons/ionicons5";

export const codeDiff: ToolModule = {
  id: "code-diff",
  name: "代码对比",
  description: "对比两段文本/代码的差异",
  icon: GitCompareOutline,
  category: "编码",
  keywords: ["diff", "compare", "对比", "差异", "比较"],
  component: CodeDiff,
  toHistory(input, output) {
    return {
      title: "代码对比",
      input: String(input ?? ""),
      output: String(output ?? ""),
    };
  },
  fromHistory(entry) {
    return { input: entry.input, output: entry.output };
  },
};
