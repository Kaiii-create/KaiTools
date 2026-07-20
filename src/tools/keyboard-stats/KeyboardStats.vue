<template>
  <div class="keyboard-stats flex flex-col h-full">
    <!-- 工具栏 -->
    <div class="toolbar flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
      <n-button :type="isListening ? 'error' : 'primary'" size="small" @click="toggleListening">
        {{ isListening ? '停止监听' : '开始监听' }}
      </n-button>
      <n-button quaternary size="small" @click="resetToday">重置今日</n-button>
      <n-button quaternary size="small" @click="resetAll">重置全部</n-button>
      <div class="flex-1" />
      <n-tag :type="isListening ? 'success' : 'default'" size="small" round>
        {{ isListening ? '监听中（全局）' : '已停止' }}
      </n-tag>
    </div>

    <!-- 统计面板 -->
    <div class="flex-1 overflow-auto p-4">
      <n-space vertical :size="16">
        <!-- 概览卡片 -->
        <div class="grid grid-cols-3 gap-4">
          <n-card hoverable>
            <template #header><div class="text-sm font-medium">今日按键</div></template>
            <div class="text-3xl font-bold text-blue-500">{{ todayTotal }}</div>
            <div class="text-xs text-gray-500">{{ formatTime(todayStart) }} 至今</div>
          </n-card>
          <n-card hoverable>
            <template #header><div class="text-sm font-medium">历史总计</div></template>
            <div class="text-3xl font-bold text-green-500">{{ allTimeTotal }}</div>
            <div class="text-xs text-gray-500">自 {{ formatDate(installDate) }}</div>
          </n-card>
          <n-card hoverable>
            <template #header><div class="text-sm font-medium">活跃按键</div></template>
            <div class="text-3xl font-bold text-orange-500">{{ activeKeys }}</div>
            <div class="text-xs text-gray-500">不同按键数量</div>
          </n-card>
        </div>

        <!-- 提示 -->
        <n-alert v-if="!isListening" type="info" :show-icon="true">
          点击「开始监听」后，将记录全局键盘按键（即使应用不在前台）。监听通过 Windows 低级键盘钩子实现。
        </n-alert>

        <!-- 高频按键 Top 10 -->
        <n-card title="今日高频按键 Top 10" size="small">
          <div class="space-y-2">
            <div v-for="(item, index) in topTodayKeys" :key="item.key" class="flex items-center gap-3">
              <span class="w-6 text-center text-xs font-medium" :class="getRankClass(index)">{{ index + 1 }}</span>
              <span class="w-16 text-center text-sm font-mono bg-gray-100 dark:bg-gray-800 rounded px-2 py-0.5">{{ formatKey(item.key) }}</span>
              <div class="flex-1">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div class="h-full rounded-full transition-all" :class="getBarClass(index)" :style="{ width: `${(item.count / maxTodayCount) * 100}%` }" />
                </div>
              </div>
              <span class="text-sm text-gray-600 w-16 text-right">{{ item.count }}</span>
            </div>
            <div v-if="topTodayKeys.length === 0" class="text-center text-gray-400 py-4">暂无数据</div>
          </div>
        </n-card>

        <!-- 历史高频按键 -->
        <n-card title="历史高频按键" size="small">
          <div class="space-y-2">
            <div v-for="(item, index) in topAllKeys" :key="item.key" class="flex items-center gap-3">
              <span class="w-6 text-center text-xs font-medium" :class="getRankClass(index)">{{ index + 1 }}</span>
              <span class="w-16 text-center text-sm font-mono bg-gray-100 dark:bg-gray-800 rounded px-2 py-0.5">{{ formatKey(item.key) }}</span>
              <span class="flex-1 text-sm text-gray-600">{{ item.count }}</span>
            </div>
          </div>
        </n-card>

        <!-- 快捷键组合 -->
        <n-card title="快捷键组合（最近记录）" size="small">
          <n-space vertical>
            <div v-for="(count, combo) in hotkeys" :key="combo" class="flex justify-between items-center">
              <span class="text-sm font-mono">{{ combo }}</span>
              <span class="text-sm text-gray-500">{{ count }} 次</span>
            </div>
            <div v-if="Object.keys(hotkeys).length === 0" class="text-center text-gray-400 py-2">暂无快捷键记录</div>
          </n-space>
        </n-card>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from "vue";
import { NButton, NCard, NSpace, NTag, NAlert, useMessage } from "naive-ui";

const message = useMessage();

const isListening = ref(false);
const todayCounts = reactive<Record<string, number>>({});
const allTimeCounts = reactive<Record<string, number>>({});
const hotkeys = reactive<Record<string, number>>({});
const todayStart = ref(Date.now());
const installDate = ref(Date.now());

const todayTotal = computed(() => Object.values(todayCounts).reduce((a, b) => a + b, 0));
const allTimeTotal = computed(() => Object.values(allTimeCounts).reduce((a, b) => a + b, 0));
const activeKeys = computed(() => Object.keys(todayCounts).length);

const topTodayKeys = computed(() =>
  Object.entries(todayCounts)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
);

const maxTodayCount = computed(() => topTodayKeys.value[0]?.count || 1);

const topAllKeys = computed(() =>
  Object.entries(allTimeCounts)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
);

function formatKey(key: string): string {
  if (key === " ") return "Space";
  if (key.length === 1) return key.toUpperCase();
  return key;
}

function getRankClass(index: number): string {
  switch (index) {
    case 0: return "text-yellow-500";
    case 1: return "text-gray-400";
    case 2: return "text-amber-600";
    default: return "text-gray-500";
  }
}

function getBarClass(index: number): string {
  switch (index) {
    case 0: return "bg-yellow-400";
    case 1: return "bg-gray-400";
    case 2: return "bg-amber-500";
    default: return "bg-blue-400";
  }
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("zh-CN");
}

// 处理键盘事件
function handleKeyboardEvent(combo: string) {
  // combo 形如 "Ctrl+a" 或 "a"
  const parts = combo.split("+");
  const key = parts[parts.length - 1];
  const normalizedKey = key === " " ? "Space" : key;

  // 单键统计
  todayCounts[normalizedKey] = (todayCounts[normalizedKey] || 0) + 1;
  allTimeCounts[normalizedKey] = (allTimeCounts[normalizedKey] || 0) + 1;

  // 组合键统计
  if (parts.length > 1) {
    hotkeys[combo] = (hotkeys[combo] || 0) + 1;
    // 保留最近 20 个组合键
    const keys = Object.keys(hotkeys);
    if (keys.length > 20) {
      delete hotkeys[keys[0]];
    }
  }

  // 持久化到 localStorage
  saveToStorage();
}

function saveToStorage() {
  try {
    localStorage.setItem("ktool_keyboard_today", JSON.stringify({ counts: todayCounts, start: todayStart.value }));
    localStorage.setItem("ktool_keyboard_all", JSON.stringify({ counts: allTimeCounts, installDate: installDate.value }));
    localStorage.setItem("ktool_keyboard_hotkeys", JSON.stringify(hotkeys));
  } catch {}
}

function loadFromStorage() {
  try {
    const today = JSON.parse(localStorage.getItem("ktool_keyboard_today") || "{}");
    if (today.counts) {
      Object.assign(todayCounts, today.counts);
      todayStart.value = today.start || Date.now();
    }
    const all = JSON.parse(localStorage.getItem("ktool_keyboard_all") || "{}");
    if (all.counts) {
      Object.assign(allTimeCounts, all.counts);
      installDate.value = all.installDate || Date.now();
    }
    const hot = JSON.parse(localStorage.getItem("ktool_keyboard_hotkeys") || "{}");
    Object.assign(hotkeys, hot);
  } catch {}
}

// Tauri 事件监听
let unlisten: (() => void) | null = null;

async function toggleListening() {
  if (isListening.value) {
    // 停止
    isListening.value = false;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("stop_keyboard_hook");
    } catch (e) {
      message.error(`停止失败：${(e as Error).message}`);
    }
    if (unlisten) { unlisten(); unlisten = null; }
    message.info("已停止监听");
  } else {
    // 开始
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const { listen } = await import("@tauri-apps/api/event");
      // 先订阅事件
      unlisten = await listen<string>("keyboard-event", (event) => {
        handleKeyboardEvent(event.payload);
      });
      // 再启动钩子
      await invoke("start_keyboard_hook");
      isListening.value = true;
      message.success("开始监听全局键盘事件");
    } catch (e) {
      message.error(`启动失败：${(e as Error).message}`);
      if (unlisten) { unlisten(); unlisten = null; }
    }
  }
}

function resetToday() {
  for (const k of Object.keys(todayCounts)) delete todayCounts[k];
  todayStart.value = Date.now();
  saveToStorage();
  message.success("已重置今日数据");
}

function resetAll() {
  for (const k of Object.keys(todayCounts)) delete todayCounts[k];
  for (const k of Object.keys(allTimeCounts)) delete allTimeCounts[k];
  for (const k of Object.keys(hotkeys)) delete hotkeys[k];
  todayStart.value = Date.now();
  installDate.value = Date.now();
  saveToStorage();
  message.success("已重置全部数据");
}

onMounted(() => {
  loadFromStorage();
});

onUnmounted(async () => {
  if (isListening.value) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("stop_keyboard_hook");
    } catch {}
  }
  if (unlisten) unlisten();
});
</script>
