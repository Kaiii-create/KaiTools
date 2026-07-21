import type { ToolModule } from "../types";
import QrDecode from "./QrDecode.vue";
import { ScanOutline } from "@vicons/ionicons5";

export const qrDecode: ToolModule = {
  id: "qr-decode",
  name: "二维码解码",
  description: "从图片中识别并解码二维码内容",
  icon: ScanOutline,
  accent: "#f59e0b",
  category: "二维码",
  component: QrDecode,
  keywords: ["qrcode", "二维码", "解码", "识别", "decode", "扫描"],
  toHistory(input, output) {
    return {
      title: String(input ?? "").slice(0, 60) || "二维码解码",
      input: String(input ?? ""),
      output: String(output ?? ""),
    };
  },
  fromHistory(entry) {
    return { input: entry.input, output: entry.output };
  },
};
