// 键盘统计单例：主窗口负责记录并持久化，小插件只同步展示，避免多窗口重复计数。

import { computed, reactive, ref } from "vue";

const KEY_TODAY = "ktool_keyboard_today";
const KEY_ALL = "ktool_keyboard_all";
const KEY_DAILY = "ktool_keyboard_daily";
const KEY_HOTKEYS = "ktool_keyboard_hotkeys";
const KEY_ENABLED = "ktool_keyboard_enabled";

export interface DailyKeyboardSummary {
  date: string;
  total: number;
  counts: Record<string, number>;
}

function createKeyboardHook() {
  const isListening = ref(false);
  const todayCounts = reactive<Record<string, number>>({});
  const allTimeCounts = reactive<Record<string, number>>({});
  const dailyCounts = reactive<Record<string, Record<string, number>>>({});
  const hotkeys = reactive<Record<string, number>>({});
  const todayStart = ref(Date.now());
  const todayDay = ref(dayKey(Date.now()));
  const installDate = ref(Date.now());
  let loaded = false;

  const todayTotal = computed(() => sumCounts(todayCounts));
  const allTimeTotal = computed(() => sumCounts(allTimeCounts));
  const activeKeys = computed(() => Object.keys(todayCounts).filter((key) => todayCounts[key] > 0).length);
  const dailySummaries = computed<DailyKeyboardSummary[]>(() =>
    Object.entries(dailyCounts)
      .map(([date, counts]) => ({ date, counts, total: sumCounts(counts) }))
      .sort((a, b) => b.date.localeCompare(a.date))
  );

  const countsByCode = computed<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    for (const [key, value] of Object.entries(todayCounts)) {
      const code = codeFromKey(key);
      out[code] = (out[code] || 0) + value;
    }
    return out;
  });

  function codeFromKey(key: string): string {
    if (key === "Space" || key === " ") return "space";
    if (key === "\n") return "enter";
    if (key === "\t") return "tab";
    if (key === "\u0008") return "backspace";
    return key.toLowerCase();
  }

  const listeners = new Set<(combo: string, code: string) => void>();
  function onKey(cb: (combo: string, code: string) => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  function beginCurrentDay() {
    clearRecord(todayCounts);
    todayStart.value = Date.now();
    todayDay.value = dayKey(todayStart.value);
    const stored = dailyCounts[todayDay.value];
    if (stored) Object.assign(todayCounts, stored);
  }

  function ensureCurrentDay() {
    if (todayDay.value !== dayKey(Date.now())) beginCurrentDay();
  }

  function handleKeyboardEvent(combo: string, persist = true) {
    ensureCurrentDay();
    const parts = combo.split("+");
    const rawKey = parts[parts.length - 1] || combo;
    const key = rawKey === " " ? "space" : rawKey.toLowerCase();

    todayCounts[key] = (todayCounts[key] || 0) + 1;
    allTimeCounts[key] = (allTimeCounts[key] || 0) + 1;
    if (!dailyCounts[todayDay.value]) dailyCounts[todayDay.value] = {};
    dailyCounts[todayDay.value][key] = (dailyCounts[todayDay.value][key] || 0) + 1;

    if (parts.length > 1) {
      hotkeys[combo] = (hotkeys[combo] || 0) + 1;
      const combos = Object.keys(hotkeys);
      if (combos.length > 50) delete hotkeys[combos[0]];
    }

    listeners.forEach((cb) => cb(combo, codeFromKey(key)));
    if (persist) saveToStorage();
  }

  function saveToStorage() {
    try {
      localStorage.setItem(
        KEY_TODAY,
        JSON.stringify({ counts: todayCounts, start: todayStart.value, day: todayDay.value })
      );
      localStorage.setItem(
        KEY_ALL,
        JSON.stringify({ counts: allTimeCounts, installDate: installDate.value })
      );
      localStorage.setItem(KEY_DAILY, JSON.stringify(dailyCounts));
      localStorage.setItem(KEY_HOTKEYS, JSON.stringify(hotkeys));
    } catch {
      // 存储不可用时仍允许当前会话继续统计。
    }
  }

  function loadFromStorage() {
    if (loaded) return;
    loaded = true;
    try {
      const storedDaily = JSON.parse(localStorage.getItem(KEY_DAILY) || "{}");
      if (storedDaily && typeof storedDaily === "object") Object.assign(dailyCounts, storedDaily);

      const today = JSON.parse(localStorage.getItem(KEY_TODAY) || "{}");
      const storedDay = today.day || (today.start ? dayKey(today.start) : "");
      const currentDay = dayKey(Date.now());
      if (today.counts && storedDay) {
        if (!dailyCounts[storedDay]) dailyCounts[storedDay] = { ...today.counts };
        if (storedDay === currentDay) {
          Object.assign(todayCounts, today.counts);
          todayStart.value = today.start || Date.now();
          todayDay.value = storedDay;
        }
      }

      const all = JSON.parse(localStorage.getItem(KEY_ALL) || "{}");
      if (all.counts) Object.assign(allTimeCounts, all.counts);
      installDate.value = all.installDate || Date.now();

      const storedHotkeys = JSON.parse(localStorage.getItem(KEY_HOTKEYS) || "{}");
      if (storedHotkeys && typeof storedHotkeys === "object") Object.assign(hotkeys, storedHotkeys);

      if (todayDay.value !== currentDay) beginCurrentDay();
      if (!dailyCounts[currentDay]) dailyCounts[currentDay] = { ...todayCounts };
    } catch {
      beginCurrentDay();
    }
  }

  let unlisten: (() => void) | null = null;

  function shouldAutoStart() {
    try {
      return localStorage.getItem(KEY_ENABLED) !== "false";
    } catch {
      return true;
    }
  }

  async function start() {
    if (isListening.value) return;
    loadFromStorage();
    const { invoke } = await import("@tauri-apps/api/core");
    const { listen } = await import("@tauri-apps/api/event");
    unlisten = await listen<string>("keyboard-event", (event) => handleKeyboardEvent(event.payload));
    try {
      await invoke("start_keyboard_hook");
      isListening.value = true;
      localStorage.setItem(KEY_ENABLED, "true");
    } catch (error) {
      unlisten?.();
      unlisten = null;
      throw error;
    }
  }

  async function stop(savePreference = true) {
    if (!isListening.value && !unlisten) return;
    isListening.value = false;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("stop_keyboard_hook");
    } catch {
      // 非 Tauri 预览环境忽略。
    }
    unlisten?.();
    unlisten = null;
    if (savePreference) {
      try {
        localStorage.setItem(KEY_ENABLED, "false");
      } catch {}
    }
  }

  async function shutdown() {
    await stop(false);
  }

  // 小插件接收相同事件用于动画和即时数字，但不写存储，避免和主窗口重复累计。
  async function subscribeOnly() {
    if (unlisten) return;
    loadFromStorage();
    const { listen } = await import("@tauri-apps/api/event");
    unlisten = await listen<string>("keyboard-event", (event) => handleKeyboardEvent(event.payload, false));
    isListening.value = true;
  }

  function resetToday() {
    ensureCurrentDay();
    clearRecord(todayCounts);
    dailyCounts[todayDay.value] = {};
    todayStart.value = Date.now();
    saveToStorage();
  }

  function resetAll() {
    clearRecord(todayCounts);
    clearRecord(allTimeCounts);
    clearRecord(dailyCounts);
    clearRecord(hotkeys);
    todayStart.value = Date.now();
    todayDay.value = dayKey(todayStart.value);
    dailyCounts[todayDay.value] = {};
    installDate.value = Date.now();
    saveToStorage();
  }

  return {
    isListening,
    todayCounts,
    allTimeCounts,
    dailyCounts,
    dailySummaries,
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
    shutdown,
    shouldAutoStart,
    subscribeOnly,
    loadFromStorage,
    resetToday,
    resetAll,
  };
}

function sumCounts(counts: Record<string, number>): number {
  return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

function clearRecord(record: Record<string, unknown>) {
  for (const key of Object.keys(record)) delete record[key];
}

function dayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const keyboardHook = createKeyboardHook();

export function useKeyboardHook() {
  return keyboardHook;
}
