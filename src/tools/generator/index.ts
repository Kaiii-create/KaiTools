import type { ToolModule } from "../types";
import Generator from "./Generator.vue";
import { KeyOutline } from "@vicons/ionicons5";

export const generator: ToolModule = {
  id: "generator",
  name: "生成器",
  description: "生成 UUID 与随机密码",
  icon: KeyOutline,
  accent: "#22c55e",
  category: "其他",
  component: Generator,
  keywords: ["uuid", "密码", "生成", "随机", "random", "password"],
  toHistory(input, output) {
    return {
      title: String(input ?? "").slice(0, 60) || "生成器",
      input: String(input ?? ""),
      output: String(output ?? ""),
    };
  },
  fromHistory(entry) {
    return { input: entry.input, output: entry.output };
  },
};
