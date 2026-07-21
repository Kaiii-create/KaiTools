import type { ToolModule } from "../types";
import RegexTester from "./RegexTester.vue";
import { SearchOutline } from "@vicons/ionicons5";

export const regexTester: ToolModule = {
  id: "regex-tester",
  name: "正则测试器",
  description: "实时测试正则表达式，高亮匹配并提取捕获组",
  icon: SearchOutline,
  accent: "#a855f7",
  category: "其他",
  component: RegexTester,
  keywords: ["regex", "正则", "测试", "匹配", "表达式"],
  toHistory(input, output) {
    return {
      title: String(input ?? "").slice(0, 60) || "正则测试",
      input: String(input ?? ""),
      output: String(output ?? ""),
    };
  },
  fromHistory(entry) {
    return { input: entry.input, output: entry.output };
  },
};
