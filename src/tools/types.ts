import type { Component } from "vue";

/** 工具分类 */
export type ToolCategory = "编码" | "时间" | "加密" | "转换" | "二维码" | "其他";

/** 历史记录条目 */
export interface HistoryEntry {
  id: string;
  toolId: string;
  title: string;
  input: string;
  output: string;
  meta?: Record<string, unknown>;
  createdAt: number;
  pinned?: boolean;
}

/** 工具模块统一接口（插件化核心） */
export interface ToolModule {
  /** 唯一标识，如 'json-formatter' */
  id: string;
  /** 显示名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 图标组件（vicons） */
  icon: Component;
  /** 工具专属结果高亮色；禁止用于侧栏/标题栏框架着色 */
  accent?: string;
  /** 分类 */
  category: ToolCategory;
  /** 搜索关键词 */
  keywords: string[];
  /** 工作区组件 */
  component: Component;
  /** 序列化为历史记录 */
  toHistory?(input: unknown, output: unknown): Omit<HistoryEntry, "id" | "toolId" | "createdAt">;
  /** 从历史记录反序列化回填 */
  fromHistory?(entry: HistoryEntry): { input: unknown; output: unknown };
}
