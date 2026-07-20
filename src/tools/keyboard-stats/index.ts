import type { ToolModule } from "../types";
import KeyboardStats from "./KeyboardStats.vue";
import { Keypad } from "@vicons/ionicons5";

export const keyboardStats: ToolModule = {
  id: "keyboard-stats",
  name: "键盘统计",
  description: "记录键盘按键次数，分析高频按键",
  icon: Keypad,
  category: "其他",
  keywords: ["keyboard", "stats", "统计", "按键", "热键"],
  component: KeyboardStats,
  toHistory(input, output) {
    return {
      title: String(input ?? "").slice(0, 60) || "键盘统计记录",
      input: String(input ?? ""),
      output: String(output ?? ""),
    };
  },
  fromHistory(entry) {
    return { input: entry.input, output: entry.output };
  },
};
