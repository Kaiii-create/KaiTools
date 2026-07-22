import { defineStore } from "pinia";
import { ref } from "vue";
import { createAccentPalette } from "@/lib/theme";

export type ThemeMode = "light" | "dark" | "auto";

const STORAGE_KEY = "ktool_theme_mode";
const ACCENT_STORAGE_KEY = "ktool_accent_color";
export const DEFAULT_ACCENT_COLOR = "#4f46e5";

function loadMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "auto") return raw;
  } catch {
    // 忽略
  }
  return "auto";
}

function loadAccentColor(): string {
  try {
    const raw = localStorage.getItem(ACCENT_STORAGE_KEY);
    if (raw && /^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
  } catch {
    // 忽略
  }
  return DEFAULT_ACCENT_COLOR;
}

export const useThemeStore = defineStore("theme", () => {
  const mode = ref<ThemeMode>(loadMode());
  const isDark = ref(false);
  const accentColor = ref(loadAccentColor());

  function applyAccent() {
    const palette = createAccentPalette(accentColor.value, isDark.value);
    const style = document.documentElement.style;
    style.setProperty("--ktool-brand", palette.brand);
    style.setProperty("--ktool-brand-hover", palette.brandHover);
    style.setProperty("--ktool-brand-active", palette.brandActive);
    style.setProperty("--ktool-brand-contrast", palette.brandContrast);
    style.setProperty("--ktool-brand-soft", palette.brandSoft);
    style.setProperty("--ktool-brand-soft-2", palette.brandSoft2);
  }

  function applyDark(dark: boolean) {
    isDark.value = dark;
    document.documentElement.classList.toggle("dark", dark);
    applyAccent();
  }

  function apply() {
    if (mode.value === "auto") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      applyDark(prefersDark);
    } else {
      applyDark(mode.value === "dark");
    }
  }

  function init() {
    apply();
    // 监听系统主题变化
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", () => {
      if (mode.value === "auto") apply();
    });
  }

  function setMode(m: ThemeMode) {
    mode.value = m;
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      // 忽略
    }
    apply();
  }

  function setAccentColor(color: string) {
    if (!/^#[0-9a-f]{6}$/i.test(color)) return;
    accentColor.value = color.toLowerCase();
    try {
      localStorage.setItem(ACCENT_STORAGE_KEY, accentColor.value);
    } catch {
      // 忽略
    }
    applyAccent();
  }

  function resetAccentColor() {
    setAccentColor(DEFAULT_ACCENT_COLOR);
  }

  /** 在浅色 / 深色 / 跟随系统 之间循环切换（标题栏快速切换用） */
  function cycleMode() {
    const next: ThemeMode =
      mode.value === "light" ? "dark" : mode.value === "dark" ? "auto" : "light";
    setMode(next);
  }

  return {
    mode,
    isDark,
    accentColor,
    init,
    setMode,
    cycleMode,
    setAccentColor,
    resetAccentColor,
  };
});
