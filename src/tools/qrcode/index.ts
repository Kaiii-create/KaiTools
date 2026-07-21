import type { ToolModule } from "../types";
import Qrcode from "./Qrcode.vue";
import { QrCodeOutline } from "@vicons/ionicons5";

export const qrcode: ToolModule = {
  id: "qrcode",
  name: "二维码生成",
  description: "输入文本生成二维码，可下载",
  icon: QrCodeOutline,
  accent: "#10b981",
  category: "二维码",
  keywords: ["qrcode", "qr", "二维码", "条码"],
  component: Qrcode,
  toHistory(input, output) {
    return {
      title: String(input ?? "").slice(0, 60) || "二维码记录",
      input: String(input ?? ""),
      output: String(output ?? ""),
    };
  },
  fromHistory(entry) {
    return { input: entry.input, output: entry.output };
  },
};
