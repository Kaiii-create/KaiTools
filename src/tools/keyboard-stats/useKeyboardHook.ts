// 键盘钩子 composable：封装启动/停止全局钩子 + 事件订阅
// 统计数据持久化到 localStorage，主窗口与小插件窗口共享同一份 key

import { ref, reactive, computed } from "vue";

const KEY_TODAY = "ktool_keyboard_today";
const KEY_ALL = "ktool_keyboard_all";
const KEY_HOTKEYS = "ktool_keyboard_hotkeys";

export function useKeyboardHook() {
  const isListening = ref(false);
  const todayCounts = reactive<Record<string, number>>({});
  const allTimeCounts = reactive<Record<string, number>>({});
  const hotkeys = reactive<Record<string, number>>({});
  const todayStart = ref(Date.now());
  const installDate = ref(Date.now());

  const todayTotal = computed(() =>
    Object.values(todayCounts).reduce((a, b) => a + b, 0)
  );
  const allTimeTotal = computed(() =>
    Object.values(allTimeCounts).reduce((a, b) => a + b, 0)
  );
  const activeKeys = computed(() => Object.keys(todayCounts).length);

  // 供可视化用：按 code 的今日次数（小写归一）
  const countsByCode = computed<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(todayCounts)) {
      const code = codeFromKey(k);
      out[code] = (out[code] || 0) + v;
    }
    return out;
  });

  function codeFromKey(key: string): string {
    if (key === "Space" || key === " ") return "space";
    if (key === "\n") return "enter";
    if (key === "\t") return "tab";
    if (key === "\u0008") return "backspace";
    if (key.length === 1) return key.toLowerCase();
    return key.toLowerCase();
  }

  // 回调：外部（可视化组件）监听每一次按键触发特效
  const listeners = new Set<(combo: string, code: string) => void>();
  function onKey(cb: (combo: string, code: string) => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  function handleKeyboardEvent(combo: string) {
    const parts = combo.split("+");
    const key = parts[parts.length - 1];
    const normalizedKey = key === " " ? "Space" : key;

    todayCounts[normalizedKey] = (todayCounts[normalizedKey] || 0) + 1;
    allTimeCounts[normalizedKey] = (allTimeCounts[normalizedKey] || 0) + 1;

    if (parts.length > 1) {
      hotkeys[combo] = (hotkeys[combo] || 0) + 1;
      const keys = Object.keys(hotkeys);
      if (keys.length > 30) delete hotkeys[keys[0]];
    }

    const code = codeFromKey(normalizedKey);
    listeners.forEach((cb) => cb(combo, code));

    saveToStorage();
  }

  function saveToStorage() {
    try {
      localStorage.setItem(
        KEY_TODAY,
        JSON.stringify({ counts: todayCounts, start: todayStart.value })
      );
      localStorage.setItem(
        KEY_ALL,
        JSON.stringify({ counts: allTimeCounts, installDate: installDate.value })
      );
      localStorage.setItem(KEY_HOTKEYS, JSON.stringify(hotkeys));
    } catch {}
  }

  function loadFromStorage() {
    try {
      const today = JSON.parse(localStorage.getItem(KEY_TODAY) || "{}");
      if (today.counts) {
        Object.assign(todayCounts, today.counts);
        todayStart.value = today.start || Date.now();
      }
      const all = JSON.parse(localStorage.getItem(KEY_ALL) || "{}");
      if (all.counts) {
        Object.assign(allTimeCounts, all.counts);
        installDate.value = all.installDate || Date.now();
      }
      const hot = JSON.parse(localStorage.getItem(KEY_HOTKEYS) || "{}");
      Object.assign(hotkeys, hot);
    } catch {}
  }

  let unlisten: (() => void) | null = null;

  async function start() {
    if (isListening.value) return;
    const { invoke } = await import("@tauri-apps/api/core");
    const { listen } = await import("@tauri-apps/api/event");
    unlisten = await listen<string>("keyboard-event", (event) => {
      handleKeyboardEvent(event.payload);
    });
    await invoke("start_keyboard_hook");
    isListening.value = true;
  }

  async function stop() {
    if (!isListening.value) return;
    isListening.value = false;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("stop_keyboard_hook");
    } catch {}
    if (unlisten) {
      unlisten();
      unlisten = null;
    }
  }

  // 仅订阅事件（小插件窗口用：钩子由主窗口启动，这里只收事件）
  async function subscribeOnly() {
    const { listen } = await import("@tauri-apps/api/event");
    unlisten = await listen<string>("keyboard-event", (event) => {
      handleKeyboardEvent(event.payload);
    });
    isListening.value = true;
  }

  function resetToday() {
    for (const k of Object.keys(todayCounts)) delete todayCounts[k];
    todayStart.value = Date.now();
    saveToStorage();
  }

  function resetAll() {
    for (const k of Object.keys(todayCounts)) delete todayCounts[k];
    for (const k of Object.keys(allTimeCounts)) delete allTimeCounts[k];
    for (const k of Object.keys(hotkeys)) delete hotkeys[k];
    todayStart.value = Date.now();
    installDate.value = Date.now();
    saveToStorage();
  }

  return {
    isListening,
    todayCounts,
    allTimeCounts,
    hotkeys,
    todayStart,
    installDate,
    todayTotal,
    allTimeTotal,
    activeKeys,
    countsByCode,
    onKey,
    start,
    stop,
    subscribeOnly,
    loadFromStorage,
    resetToday,
    resetAll,
  };
}
