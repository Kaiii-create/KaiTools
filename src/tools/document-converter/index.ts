import type { ToolModule } from "../types";
import DocumentConverter from "./DocumentConverter.vue";
import { DocumentTextOutline } from "@vicons/ionicons5";

export const documentConverter: ToolModule = {
  id: "document-converter",
  name: "文档转换",
  description: "Word/PDF 转换、PDF 转图片、多图生成 PDF",
  icon: DocumentTextOutline,
  accent: "#2563eb",
  category: "转换",
  keywords: ["word", "pdf", "doc", "docx", "png", "jpg", "图片", "文档", "转换"],
  component: DocumentConverter,
};
