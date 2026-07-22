import { onMounted, onUnmounted, watch } from "vue";
import { useHistoryStore, type HistoryItem } from "@/stores/history";

export interface ToolHistoryPayload {
  title: string;
  input: string;
  output: string;
}

/**
 * 工具历史统一入口：负责去重、延迟记录和从历史抽屉恢复。
 * 各工具只需要描述自己的输入结构与恢复方式。
 */
export function useToolHistory(
  toolId: string,
  toolName: string,
  restore: (item: HistoryItem) => void
) {
  const store = useHistoryStore();
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingPayload: ToolHistoryPayload | null = null;
  let lastSignature = "";

  function record(payload: ToolHistoryPayload) {
    if (!payload.input && !payload.output) return;
    const signature = `${payload.input}\u0000${payload.output}`;
    if (signature === lastSignature) return;
    lastSignature = signature;
    store.add({ toolId, toolName, ...payload });
  }

  function recordDebounced(payload: ToolHistoryPayload, delay = 1000) {
    pendingPayload = payload;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (pendingPayload) record(pendingPayload);
      pendingPayload = null;
      timer = null;
    }, delay);
  }

  function tryRestore(item: HistoryItem | null) {
    if (!item || item.toolId !== toolId) return;
    restore(item);
    lastSignature = `${item.input}\u0000${item.output}`;
    store.clearRestore();
  }

  onMounted(() => tryRestore(store.pendingRestore));
  watch(() => store.pendingRestore, tryRestore);
  onUnmounted(() => {
    if (timer) clearTimeout(timer);
  });

  return { record, recordDebounced };
}

export function parseHistoryInput<T>(input: string): T | null {
  try {
    return JSON.parse(input) as T;
  } catch {
    return null;
  }
}
