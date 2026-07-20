import type { ToolModule } from "../types";
import Timestamp from "./Timestamp.vue";
import { TimeOutline } from "@vicons/ionicons5";

export const timestamp: ToolModule = {
  id: "timestamp",
  name: "时间戳转换",
  description: "时间戳 ↔ 日期 双向转换",
  icon: TimeOutline,
  category: "时间",
  keywords: ["timestamp", "time", "date", "unix", "时间戳", "时间", "日期"],
  component: Timestamp,
  toHistory(input, output) {
    return {
      title: String(input ?? "").slice(0, 60) || "时间戳记录",
      input: String(input ?? ""),
      output: String(output ?? ""),
    };
  },
  fromHistory(entry) {
    return { input: entry.input, output: entry.output };
  },
};
