import { defineStore } from "pinia";
import { ref } from "vue";

export type ThemeMode = "light" | "dark" | "auto";

export const useThemeStore = defineStore("theme", () => {
  const mode = ref<ThemeMode>("auto");
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
    // TODO: 后期从 Rust 端读取持久化设置
    mode.value = "auto";
    apply();

    // 监听系统主题变化
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", () => {
        if (mode.value === "auto") apply();
      });
  }

  function setMode(m: ThemeMode) {
    mode.value = m;
    apply();
  }

  return { mode, isDark, init, setMode };
});
