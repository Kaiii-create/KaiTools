<template>
  <n-drawer
    :show="show"
    placement="right"
    :width="360"
    @update:show="(v: boolean) => emit('update:show', v)"
  >
    <n-drawer-content :native-scrollbar="false" class="history-drawer">
      <template #header>
        <div class="flex items-center justify-between w-full pr-2">
          <div class="flex items-center gap-2">
            <n-icon :size="17" class="text-[var(--ktool-text-soft)]">
              <TimeOutline />
            </n-icon>
            <span>历史记录</span>
          </div>
          <n-button
            v-if="history.length"
            text
            size="small"
            type="error"
            @click="emit('clear')"
          >
            清空
          </n-button>
        </div>
      </template>

      <div v-if="history.length === 0" class="history-empty">
        <n-icon :size="30"><ArchiveOutline /></n-icon>
        <p>还没有使用记录</p>
        <span>切换并使用工具后会自动保存到这里</span>
      </div>

      <ul v-else class="history-list">
        <li v-for="(item, idx) in grouped" :key="idx" class="history-item">
          <button class="history-card" @click="onSelect(item.toolId)">
            <div class="flex items-center gap-2.5">
              <span class="history-icon">
                <n-icon :component="toolIcon(item.toolId)" :size="16" />
              </span>
              <div class="min-w-0 flex-1">
                <div class="history-name truncate">{{ toolName(item.toolId) }}</div>
                <div class="history-preview truncate">{{ preview(item) }}</div>
              </div>
            </div>
            <div class="history-time">{{ formatTime(item.createdAt) }}</div>
          </button>
        </li>
      </ul>
    </n-drawer-content>
  </n-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  NDrawer,
  NDrawerContent,
  NButton,
  NIcon,
} from "naive-ui";
import { TimeOutline, ArchiveOutline } from "@vicons/ionicons5";
import type { HistoryItem } from "@/stores/history";
import { tools } from "@/tools/registry";

const props = defineProps<{
  show: boolean;
  history: HistoryItem[];
}>();
const emit = defineEmits<{
  (e: "update:show", v: boolean): void;
  (e: "select", toolId: string): void;
  (e: "clear"): void;
}>();

const grouped = computed(() => props.history.slice(0, 200));

function toolById(id: string) {
  return tools.find((t) => t.id === id);
}
function toolName(id: string) {
  return toolById(id)?.name ?? id;
}
function toolIcon(id: string) {
  return toolById(id)?.icon;
}
function preview(item: HistoryItem): string {
  return item.title || item.input.slice(0, 48) || "(空)";
}
function onSelect(id: string) {
  emit("select", id);
  emit("update:show", false);
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
  if (sameDay) return hm;
  return `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
}
</script>

<style scoped>
.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 24px;
  text-align: center;
  color: var(--ktool-text-mute);
}
.history-empty p {
  margin: 0;
  font-size: 13px;
  color: var(--ktool-text-soft);
}
.history-empty span {
  font-size: 12px;
}
.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.history-card {
  width: 100%;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--ktool-radius);
  background: var(--ktool-surface-2);
  border: 1px solid var(--ktool-border);
  cursor: pointer;
  transition: background var(--ktool-duration) var(--ktool-ease),
    border-color var(--ktool-duration) var(--ktool-ease);
}
.history-card:hover {
  background: var(--ktool-surface-3);
  border-color: var(--ktool-border-strong);
}
.history-icon {
  width: 28px;
  height: 28px;
  border-radius: var(--ktool-radius-sm);
  background: var(--ktool-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ktool-text-soft);
  flex-shrink: 0;
}
.history-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ktool-text);
}
.history-preview {
  font-size: 12px;
  color: var(--ktool-text-mute);
  max-width: 230px;
}
.history-time {
  font-size: 11px;
  color: var(--ktool-text-mute);
  flex-shrink: 0;
  align-self: flex-start;
  padding-top: 2px;
}
</style>
