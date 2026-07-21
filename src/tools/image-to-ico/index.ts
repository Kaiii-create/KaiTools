import type { ToolModule } from "../types";
import ImageToIco from "./ImageToIco.vue";
import { ImageOutline } from "@vicons/ionicons5";

export const imageToIco: ToolModule = {
  id: "image-to-ico",
  name: "图片转 ICO",
  description: "将图片转换为 ICO 图标格式",
  icon: ImageOutline,
  accent: "#3b82f6",
  category: "转换",
  keywords: ["image", "ico", "icon", "转换", "图标"],
  component: ImageToIco,
  toHistory(input, output) {
    return {
      title: String(input ?? "").slice(0, 60) || "图片转ICO记录",
      input: String(input ?? ""),
      output: String(output ?? ""),
    };
  },
  fromHistory(entry) {
    return { input: entry.input, output: entry.output };
  },
};
