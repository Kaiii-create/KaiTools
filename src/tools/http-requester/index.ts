import type { ToolModule } from "../types";
import HttpRequester from "./HttpRequester.vue";
import { PaperPlaneOutline } from "@vicons/ionicons5";

export const httpRequester: ToolModule = {
  id: "http-requester",
  name: "HTTP 请求",
  description: "模拟发送 HTTP 请求，调试接口",
  icon: PaperPlaneOutline,
  accent: "#3b82f6",
  category: "其他",
  keywords: ["http", "request", "api", "post", "get", "接口", "调试"],
  component: HttpRequester,
  toHistory(input, output) {
    return {
      title: String(input ?? "").slice(0, 60) || "HTTP 请求记录",
      input: String(input ?? ""),
      output: String(output ?? ""),
    };
  },
  fromHistory(entry) {
    return { input: entry.input, output: entry.output };
  },
};
