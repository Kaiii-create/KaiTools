import type { GlobalThemeOverrides } from "naive-ui";

/**
 * KTool 统一的 Naive UI 主题覆盖。
 * 通过 CSS 变量读取品牌色与层级，保证浅色 / 深色与全局设计令牌一致。
 */

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
}

/** 浅色主题覆盖 */
export const lightThemeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: cssVar("--ktool-brand", "#4f46e5"),
    primaryColorHover: cssVar("--ktool-brand-hover", "#4338ca"),
    primaryColorPressed: cssVar("--ktool-brand-active", "#3730a3"),
    primaryColorSuppl: cssVar("--ktool-brand-hover", "#4338ca"),

    errorColor: cssVar("--ktool-danger", "#e5484d"),
    errorColorHover: cssVar("--ktool-danger-hover", "#d23b40"),
    errorColorPressed: cssVar("--ktool-danger-hover", "#d23b40"),

    borderRadius: "8px",
    borderRadiusSmall: "6px",

    bodyColor: cssVar("--ktool-bg", "#f6f7f9"),
    cardColor: cssVar("--ktool-surface", "#ffffff"),
    modalColor: cssVar("--ktool-surface", "#ffffff"),
    popoverColor: cssVar("--ktool-surface", "#ffffff"),
    tableColor: cssVar("--ktool-surface", "#ffffff"),
    inputColor: cssVar("--ktool-surface", "#ffffff"),
    actionColor: cssVar("--ktool-surface-2", "#f1f2f5"),
    borderColor: cssVar("--ktool-border", "#e4e6ea"),

    textColorBase: cssVar("--ktool-text", "#1f232b"),
    textColor1: cssVar("--ktool-text", "#1f232b"),
    textColor2: cssVar("--ktool-text-soft", "#5b626e"),
    textColor3: cssVar("--ktool-text-mute", "#9298a3"),

    hoverColor: cssVar("--ktool-surface-2", "#f1f2f5"),
    pressedColor: cssVar("--ktool-surface-3", "#e9ebef"),
    boxShadow1: cssVar("--ktool-shadow-sm", "0 1px 2px rgba(16,18,23,0.06)"),
    boxShadow2: cssVar("--ktool-shadow-md", "0 4px 16px rgba(16,18,23,0.08)"),
    boxShadow3: cssVar("--ktool-shadow-lg", "0 12px 32px rgba(16,18,23,0.12)"),

    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',
  },
  Button: {
    borderRadiusSmall: "6px",
    borderRadiusMedium: "8px",
    borderRadiusLarge: "8px",
    textColorPrimary: cssVar("--ktool-brand-contrast", "#ffffff"),
    textColorHoverPrimary: cssVar("--ktool-brand-contrast", "#ffffff"),
    textColorPressedPrimary: cssVar("--ktool-brand-contrast", "#ffffff"),
  },
  Input: {
    colorFocus: cssVar("--ktool-surface", "#ffffff"),
    borderHover: cssVar("--ktool-brand", "#4f46e5"),
    borderFocus: cssVar("--ktool-brand", "#4f46e5"),
    boxShadowFocus: "0 0 0 2px var(--ktool-brand-soft)",
  },
  Card: {
    borderColor: cssVar("--ktool-border", "#e4e6ea"),
    color: cssVar("--ktool-surface", "#ffffff"),
  },
  Drawer: {
    color: cssVar("--ktool-surface", "#ffffff"),
  },
  Modal: {
    color: cssVar("--ktool-surface", "#ffffff"),
  },
  Tag: {
    borderRadius: "6px",
  },
  Tabs: {
    tabTextColorActiveBar: cssVar("--ktool-brand", "#4f46e5"),
    barColor: cssVar("--ktool-brand", "#4f46e5"),
  },
};

/** 深色主题覆盖（与浅色结构一致，仅取值来自 .dark 变量） */
export const darkThemeOverrides: GlobalThemeOverrides = {
  ...lightThemeOverrides,
  common: {
    ...lightThemeOverrides.common,
    bodyColor: cssVar("--ktool-bg", "#0e1014"),
    cardColor: cssVar("--ktool-surface", "#16181d"),
    modalColor: cssVar("--ktool-surface", "#16181d"),
    popoverColor: cssVar("--ktool-surface", "#16181d"),
    tableColor: cssVar("--ktool-surface", "#16181d"),
    inputColor: cssVar("--ktool-surface", "#16181d"),
    actionColor: cssVar("--ktool-surface-2", "#1b1e24"),
    borderColor: cssVar("--ktool-border", "#262a32"),

    textColorBase: cssVar("--ktool-text", "#e7e9ed"),
    textColor1: cssVar("--ktool-text", "#e7e9ed"),
    textColor2: cssVar("--ktool-text-soft", "#a7aeb9"),
    textColor3: cssVar("--ktool-text-mute", "#6b7280"),

    hoverColor: cssVar("--ktool-surface-2", "#1b1e24"),
    pressedColor: cssVar("--ktool-surface-3", "#23272f"),
    boxShadow1: cssVar("--ktool-shadow-sm", "0 1px 2px rgba(0,0,0,0.4)"),
    boxShadow2: cssVar("--ktool-shadow-md", "0 6px 18px rgba(0,0,0,0.45)"),
    boxShadow3: cssVar("--ktool-shadow-lg", "0 16px 40px rgba(0,0,0,0.55)"),
  },
  Drawer: { color: cssVar("--ktool-surface", "#16181d") },
  Modal: { color: cssVar("--ktool-surface", "#16181d") },
  Card: { color: cssVar("--ktool-surface", "#16181d") },
  /* 深色下输入框：背景用深色 surface，聚焦时略提亮，避免聚焦变白 */
  Input: {
    color: cssVar("--ktool-surface", "#16181d"),
    colorHover: cssVar("--ktool-surface-2", "#1b1e24"),
    colorFocus: cssVar("--ktool-surface-2", "#1b1e24"),
    colorDisabled: cssVar("--ktool-surface-inset", "#121419"),
    border: cssVar("--ktool-border", "#262a32"),
    borderHover: cssVar("--ktool-brand", "#6366f1"),
    borderFocus: cssVar("--ktool-brand", "#6366f1"),
    boxShadowFocus: "0 0 0 2px var(--ktool-brand-soft)",
    textColor: cssVar("--ktool-text", "#e7e9ed"),
    placeholderColor: cssVar("--ktool-text-mute", "#6b7280"),
  },
  /* 数字输入框同样处理 */
  InputNumber: {
    color: cssVar("--ktool-surface", "#16181d"),
    colorHover: cssVar("--ktool-surface-2", "#1b1e24"),
    colorFocus: cssVar("--ktool-surface-2", "#1b1e24"),
    border: cssVar("--ktool-border", "#262a32"),
    borderHover: cssVar("--ktool-brand", "#6366f1"),
    borderFocus: cssVar("--ktool-brand", "#6366f1"),
    boxShadowFocus: "0 0 0 2px var(--ktool-brand-soft)",
    textColor: cssVar("--ktool-text", "#e7e9ed"),
  },
};

/** 根据当前是否深色，返回对应的主题覆盖 */
export function getThemeOverrides(isDark: boolean): GlobalThemeOverrides {
  return isDark ? darkThemeOverrides : lightThemeOverrides;
}
