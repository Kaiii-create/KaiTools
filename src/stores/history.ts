import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface HistoryItem {
  id: string;
  toolId: string;
  toolName: string;
  title: string;
  input: string;
  output: string;
  createdAt: number;
}

const STORAGE_KEY = "ktool_history";
const MAX_ITEMS = 500;

function loadFromStorage(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveToStorage(items: HistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // 忽略写入错误
  }
}

export const useHistoryStore = defineStore("history", () => {
  const items = ref<HistoryItem[]>(loadFromStorage());
  // 点击历史记录后要恢复到目标工具的待处理项
  const pendingRestore = ref<HistoryItem | null>(null);

  const total = computed(() => items.value.length);

  function add(item: Omit<HistoryItem, "id" | "createdAt">) {
    const entry: HistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };
    items.value.unshift(entry);
    if (items.value.length > MAX_ITEMS) {
      items.value = items.value.slice(0, MAX_ITEMS);
    }
    saveToStorage(items.value);
  }

  function remove(id: string) {
    items.value = items.value.filter((i) => i.id !== id);
    saveToStorage(items.value);
  }

  function clear() {
    items.value = [];
    saveToStorage(items.value);
  }

  function clearByTool(toolId: string) {
    items.value = items.value.filter((i) => i.toolId !== toolId);
    saveToStorage(items.value);
  }

  function getByTool(toolId: string): HistoryItem[] {
    return items.value.filter((i) => i.toolId === toolId);
  }

  function requestRestore(item: HistoryItem) {
    pendingRestore.value = item;
  }

  function clearRestore() {
    pendingRestore.value = null;
  }

  return {
    items,
    total,
    add,
    remove,
    clear,
    clearByTool,
    getByTool,
    pendingRestore,
    requestRestore,
    clearRestore,
  };
});
