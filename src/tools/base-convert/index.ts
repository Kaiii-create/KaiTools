import type { ToolModule } from "../types";
import BaseConvert from "./BaseConvert.vue";
import { CalculatorOutline } from "@vicons/ionicons5";

export const baseConvert: ToolModule = {
  id: "base-convert",
  name: "进制转换",
  description: "在 2 / 8 / 10 / 16 进制间互转",
  icon: CalculatorOutline,
  accent: "#ef4444",
  category: "转换",
  component: BaseConvert,
  keywords: ["进制", "转换", "base", "hex", "binary", "十进制", "十六进制"],
  toHistory(input, output) {
    return {
      title: String(input ?? "").slice(0, 60) || "进制转换",
      input: String(input ?? ""),
      output: String(output ?? ""),
    };
  },
  fromHistory(entry) {
    return { input: entry.input, output: entry.output };
  },
};
