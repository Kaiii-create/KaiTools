import type { GlobalThemeOverrides } from "naive-ui";

/**
 * KTool 统一的 Naive UI 主题覆盖。
 *
 * 重要：Naive UI（底层 seemly）会对颜色 token 调用 rgba() 解析，
 * 因此覆盖值必须是「具体颜色字面量」（hex / rgb / rgba），不能是 var()。
 * 为保证浅色 / 深色都取到正确值，这里用一份具体的令牌表，
 * 为浅色与深色各构建一份独立的覆盖对象，深色不再 spread 浅色
 * （避免深色继承到浅色值，例如 Select 触发器在深色下近白的问题）。
 */

interface Tokens {
  surface: string;
  surface2: string;
  surface3: string;
  surfaceInset: string;
  border: string;
  borderStrong: string;
  text: string;
  textSoft: string;
  textMute: string;
  brand: string;
  brandHover: string;
  brandActive: string;
  brandContrast: string;
  brandSoft: string;
  danger: string;
  dangerHover: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  bg: string;
}

const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif';

const LIGHT: Tokens = {
  surface: "#ffffff",
  surface2: "#f1f2f5",
  surface3: "#e9ebef",
  surfaceInset: "#f3f4f6",
  border: "#e4e6ea",
  borderStrong: "#d4d7dd",
  text: "#1f232b",
  textSoft: "#5b626e",
  textMute: "#9298a3",
  brand: "#4f46e5",
  brandHover: "#4338ca",
  brandActive: "#3730a3",
  brandContrast: "#ffffff",
  brandSoft: "rgba(79, 70, 229, 0.1)",
  danger: "#e5484d",
  dangerHover: "#d23b40",
  shadowSm: "0 1px 2px rgba(16, 18, 23, 0.06)",
  shadowMd: "0 4px 16px rgba(16, 18, 23, 0.08)",
  shadowLg: "0 12px 32px rgba(16, 18, 23, 0.12)",
  bg: "#f6f7f9",
};

const DARK: Tokens = {
  surface: "#16181d",
  surface2: "#1b1e24",
  surface3: "#23272f",
  surfaceInset: "#121419",
  border: "#262a32",
  borderStrong: "#333943",
  text: "#e7e9ed",
  textSoft: "#a7aeb9",
  textMute: "#6b7280",
  brand: "#6366f1",
  brandHover: "#818cf8",
  brandActive: "#4f46e5",
  brandContrast: "#ffffff",
  brandSoft: "rgba(99, 102, 241, 0.16)",
  danger: "#f2555a",
  dangerHover: "#ff6b70",
  shadowSm: "0 1px 2px rgba(0, 0, 0, 0.4)",
  shadowMd: "0 6px 18px rgba(0, 0, 0, 0.45)",
  shadowLg: "0 16px 40px rgba(0, 0, 0, 0.55)",
  bg: "#0e1014",
};

export interface AccentPalette {
  brand: string;
  brandHover: string;
  brandActive: string;
  brandContrast: string;
  brandSoft: string;
  brandSoft2: string;
}

function normalizeHex(color: string): string {
  const value = color.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(value) ? value : "#4f46e5";
}

function hexToRgb(color: string): [number, number, number] {
  const hex = normalizeHex(color).slice(1);
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

function mixHex(color: string, target: "#000000" | "#ffffff", amount: number): string {
  const [r, g, b] = hexToRgb(color);
  const targetValue = target === "#ffffff" ? 255 : 0;
  const channel = (value: number) => Math.round(value + (targetValue - value) * amount);
  return `#${[channel(r), channel(g), channel(b)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
}

function getContrastColor(color: string): "#ffffff" | "#111827" {
  const [r, g, b] = hexToRgb(color).map((value) => value / 255);
  const linear = (value: number) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  return luminance > 0.52 ? "#111827" : "#ffffff";
}

export function createAccentPalette(color: string, isDark: boolean): AccentPalette {
  const source = normalizeHex(color);
  const brand = isDark ? mixHex(source, "#ffffff", 0.12) : source;
  const [r, g, b] = hexToRgb(brand);
  return {
    brand,
    brandHover: mixHex(brand, isDark ? "#ffffff" : "#000000", isDark ? 0.18 : 0.12),
    brandActive: mixHex(brand, "#000000", isDark ? 0.12 : 0.26),
    brandContrast: getContrastColor(brand),
    brandSoft: `rgba(${r}, ${g}, ${b}, ${isDark ? 0.18 : 0.1})`,
    brandSoft2: `rgba(${r}, ${g}, ${b}, ${isDark ? 0.28 : 0.16})`,
  };
}

function buildOverrides(t: Tokens): GlobalThemeOverrides {
  return {
    common: {
      primaryColor: t.brand,
      primaryColorHover: t.brandHover,
      primaryColorPressed: t.brandActive,
      primaryColorSuppl: t.brandHover,

      errorColor: t.danger,
      errorColorHover: t.dangerHover,
      errorColorPressed: t.dangerHover,

      borderRadius: "6px",
      borderRadiusSmall: "4px",

      bodyColor: t.bg,
      cardColor: t.surface,
      modalColor: t.surface,
      popoverColor: t.surface,
      tableColor: t.surface,
      inputColor: t.surface,
      actionColor: t.surface2,
      borderColor: t.border,

      textColorBase: t.text,
      textColor1: t.text,
      textColor2: t.textSoft,
      textColor3: t.textMute,

      hoverColor: t.surface2,
      pressedColor: t.surface3,
      boxShadow1: t.shadowSm,
      boxShadow2: t.shadowMd,
      boxShadow3: t.shadowLg,

      fontFamily: FONT_FAMILY,
    },
    Button: {
      borderRadiusSmall: "6px",
      borderRadiusMedium: "6px",
      borderRadiusLarge: "6px",
      colorSecondary: t.surface2,
      colorSecondaryHover: t.surface2,
      colorSecondaryPressed: t.surface2,
      textColorPrimary: t.brandContrast,
      textColorHoverPrimary: t.brandContrast,
      textColorPressedPrimary: t.brandContrast,
    },
    Input: {
      borderRadius: "8px",
      color: t.surface,
      colorHover: t.surface2,
      colorFocus: t.surface2,
      colorDisabled: t.surfaceInset,
      border: `1px solid ${t.borderStrong}`,
      borderHover: `1px solid ${t.brand}`,
      borderFocus: `1px solid ${t.brand}`,
      boxShadowFocus: `0 0 0 2px ${t.brandSoft}`,
      textColor: t.text,
      placeholderColor: t.textMute,
    },
    InputNumber: {
      borderRadius: "8px",
      color: t.surface,
      colorHover: t.surface2,
      colorFocus: t.surface2,
      border: `1px solid ${t.borderStrong}`,
      borderHover: `1px solid ${t.brand}`,
      borderFocus: `1px solid ${t.brand}`,
      boxShadowFocus: `0 0 0 2px ${t.brandSoft}`,
      textColor: t.text,
    },
    Card: {
      borderColor: t.border,
      color: t.surface,
    },
    Drawer: {
      color: t.surface,
    },
    Modal: {
      color: t.surface,
    },
    Tag: {
      borderRadius: "4px",
    },
    Tabs: {
      /* 行型（KeyboardStats、HttpRequester）：激活文字 + 指示条用品牌色 */
      tabTextColorLine: t.textSoft,
      tabTextColorActiveLine: t.brand,
      tabTextColorHoverLine: t.textSoft,
      barColor: t.brand,
      /* 去除默认过重的底部分隔线：改用轻量 border token */
      tabBorderColor: t.border,
      /* 段型（Base64Url）：激活文字品牌色，激活态为中性抬升面，而非粗底色 */
      tabTextColorSegment: t.textSoft,
      tabTextColorActiveSegment: t.brand,
      tabTextColorHoverSegment: t.textSoft,
      colorSegment: t.surface2,
      tabColorSegment: t.surface3,
      /* 共用：bar 型保持兼容，字号/圆角/字重遵守 DESIGN */
      tabTextColorActiveBar: t.brand,
      tabBorderRadius: "6px",
      tabFontWeightActive: "600",
      tabFontSizeSmall: "13px",
      tabFontSizeMedium: "14px",
      tabFontSizeLarge: "14px",
    },
    Select: {
      peers: {
        /* 触发器（与 Toolbar 对齐：small 高度 32px、圆角 6px） */
        InternalSelection: {
          color: t.surface,
          colorActive: t.surface3,
          borderRadius: "8px",
          heightSmall: "32px",
          border: `1px solid ${t.borderStrong}`,
          borderHover: `1px solid ${t.brand}`,
          borderActive: `1px solid ${t.brand}`,
          boxShadowFocus: `0 0 0 2px ${t.brandSoft}`,
          textColor: t.text,
          placeholderColor: t.textMute,
          arrowColor: t.textSoft,
        },
        /* 下拉面板 */
        InternalSelectMenu: {
          color: t.surface,
          borderRadius: "8px",
          optionTextColor: t.text,
          optionTextColorActive: t.brand,
          optionColorPending: t.surface2,
          optionColorActive: t.surface3,
        },
      },
      menuColor: t.surface,
      menuBoxShadow: t.shadowMd,
    },
    Switch: {
      railColor: t.surface3,
      railColorActive: t.brand,
      railWidthSmall: "36px",
      railWidthMedium: "40px",
      railHeightSmall: "20px",
      railHeightMedium: "22px",
      buttonWidthSmall: "16px",
      buttonHeightSmall: "16px",
      buttonWidthMedium: "18px",
      buttonHeightMedium: "18px",
      opacityDisabled: "0.5",
      boxShadowFocus: `0 0 0 2px ${t.brandSoft}`,
    },
  };
}

/** 浅色主题覆盖 */
export const lightThemeOverrides: GlobalThemeOverrides = buildOverrides(LIGHT);

/** 深色主题覆盖（独立构建，取值来自深色令牌，不再继承浅色） */
export const darkThemeOverrides: GlobalThemeOverrides = buildOverrides(DARK);

/** 根据当前是否深色，返回对应的主题覆盖 */
export function getThemeOverrides(isDark: boolean, accentColor = "#4f46e5"): GlobalThemeOverrides {
  const base = isDark ? DARK : LIGHT;
  const accent = createAccentPalette(accentColor, isDark);
  return buildOverrides({ ...base, ...accent });
}
