import { defineStore } from "pinia";
import { ref } from "vue";

export type ThemeMode = "light" | "dark" | "auto";

const STORAGE_KEY = "ktool_theme_mode";

function loadMode(): ThemeMode {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "auto") return raw;
  } catch {
    // 忽略
  }
  return "auto";
}

export const useThemeStore = defineStore("theme", () => {
  const mode = ref<ThemeMode>(loadMode());
  const isDark = ref(false);

  function applyDark(dark: boolean) {
    isDark.value = dark;
    document.documentElement.classList.toggle("dark", dark);
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

  /** 在浅色 / 深色 / 跟随系统 之间循环切换（标题栏快速切换用） */
  function cycleMode() {
    const next: ThemeMode =
      mode.value === "light" ? "dark" : mode.value === "dark" ? "auto" : "light";
    setMode(next);
  }

  return { mode, isDark, init, setMode, cycleMode };
});
