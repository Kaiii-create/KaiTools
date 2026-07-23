import type { ToolModule } from "../types";
import ImageToIco from "./ImageToIco.vue";
import { ImageOutline } from "@vicons/ionicons5";

export const imageToIco: ToolModule = {
  id: "image-to-ico",
  name: "图片格式转换",
  description: "PNG、JPG、WebP、BMP、GIF、SVG、ICO 常用格式互转",
  icon: ImageOutline,
  accent: "#3b82f6",
  category: "转换",
  keywords: ["image", "png", "jpg", "jpeg", "webp", "bmp", "gif", "svg", "ico", "转换", "图标"],
  component: ImageToIco,
  toHistory(input, output) {
    return {
      title: String(input ?? "").slice(0, 60) || "图片格式转换记录",
      input: String(input ?? ""),
      output: String(output ?? ""),
    };
  },
  fromHistory(entry) {
    return { input: entry.input, output: entry.output };
  },
};
