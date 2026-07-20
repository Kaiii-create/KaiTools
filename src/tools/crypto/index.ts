import type { ToolModule } from "../types";
import CryptoTool from "./CryptoTool.vue";
import { Shield } from "@vicons/ionicons5";

export const cryptoTool: ToolModule = {
  id: "crypto",
  name: "加密工具",
  description: "MD5/SHA/UUID 生成等加密相关工具",
  icon: Shield,
  category: "加密",
  keywords: ["md5", "sha", "uuid", "hash", "加密", "解密"],
  component: CryptoTool,
  toHistory(input, output) {
    return {
      title: String(input ?? "").slice(0, 60) || "加密记录",
      input: String(input ?? ""),
      output: String(output ?? ""),
    };
  },
  fromHistory(entry) {
    return { input: entry.input, output: entry.output };
  },
};
