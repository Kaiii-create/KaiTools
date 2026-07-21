import { defineStore } from "pinia";
import { ref, computed } from "vue";

/**
 * 导航辅助状态：最近使用。
 * 仅用于左侧导航栏展示，不参与工具业务逻辑。
 */
const RECENT_KEY = "ktool_recent_tools";
const MAX_RECENT = 8;

function loadArray(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    // 忽略
  }
  return [];
}

function saveArray(key: string, arr: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {
    // 忽略
  }
}

export const useNavStore = defineStore("nav", () => {
  const recent = ref<string[]>(loadArray(RECENT_KEY));

  function touchRecent(id: string) {
    recent.value = [id, ...recent.value.filter((x) => x !== id)].slice(
      0,
      MAX_RECENT
    );
    saveArray(RECENT_KEY, recent.value);
  }

  return { recent, touchRecent };
});
