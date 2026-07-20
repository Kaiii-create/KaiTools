import type { ToolModule } from "../types";
import ColorTool from "./ColorTool.vue";
import { ColorPaletteOutline } from "@vicons/ionicons5";

export const colorTool: ToolModule = {
  id: "color",
  name: "颜色工具",
  description: "颜色拾取、调色、格式转换",
  icon: ColorPaletteOutline,
  category: "转换",
  keywords: ["color", "rgb", "hex", "rgba", "hsl", "拾色器", "调色"],
  component: ColorTool,
  toHistory(input, output) {
    return {
      title: String(input ?? "").slice(0, 60) || "颜色记录",
      input: String(input ?? ""),
      output: String(output ?? ""),
    };
  },
  fromHistory(entry) {
    return { input: entry.input, output: entry.output };
  },
};
