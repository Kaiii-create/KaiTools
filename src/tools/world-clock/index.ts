import type { ToolModule } from "../types";
import WorldClock from "./WorldClock.vue";
import { Globe } from "@vicons/ionicons5";

export const worldClock: ToolModule = {
  id: "world-clock",
  name: "世界时钟",
  description: "查看全球各地时间",
  icon: Globe,
  category: "时间",
  keywords: ["world", "clock", "time", "时区", "全球", "各地时间"],
  component: WorldClock,
  toHistory(input, output) {
    return {
      title: String(input ?? "").slice(0, 60) || "世界时钟记录",
      input: String(input ?? ""),
      output: String(output ?? ""),
    };
  },
  fromHistory(entry) {
    return { input: entry.input, output: entry.output };
  },
};
