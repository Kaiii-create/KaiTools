<template>
  <ToolPage>
    <!-- 工具栏 -->
    <ToolToolbar>
      <n-button :type="hook.isListening.value ? 'error' : 'primary'" size="small" @click="toggleListening">
        {{ hook.isListening.value ? '停止监听' : '开始监听' }}
      </n-button>
      <n-tag :type="hook.isListening.value ? 'success' : 'default'" size="small" round>
        {{ hook.isListening.value ? '监听中（全局）' : '已停止' }}
      </n-tag>
      <div class="flex-1" />
      <n-button quaternary size="small" @click="openWidget" :disabled="widgetOpen">
        {{ widgetOpen ? '小插件已开启' : '桌面小插件' }}
      </n-button>
      <n-button v-if="widgetOpen" quaternary size="small" @click="closeWidget">关闭小插件</n-button>
      <n-button quaternary size="small" @click="hook.resetToday()">重置今日</n-button>
      <n-button quaternary size="small" @click="hook.resetAll()">重置全部</n-button>
    </ToolToolbar>

    <n-tabs v-model:value="tab" type="line" size="large" class="flex-1 kb-tabs" pane-class="kb-pane">
      <!-- Tab 1：键盘画面 -->
      <n-tab-pane name="keyboard" tab="键盘">
        <div class="kb-stage">
          <div class="kb-stage-header">
            <div class="kb-metric">
              <span class="kb-metric-num">{{ hook.todayTotal.value }}</span>
              <span class="kb-metric-label">今日按键</span>
            </div>
            <div class="kb-metric">
              <span class="kb-metric-num">{{ hook.activeKeys.value }}</span>
              <span class="kb-metric-label">活跃按键</span>
            </div>
            <div class="kb-metric">
              <span class="kb-metric-num">{{ hook.allTimeTotal.value }}</span>
              <span class="kb-metric-label">历史总计</span>
            </div>
          </div>
          <div class="kb-board-wrap">
            <KeyboardVisual ref="visualRef" :counts="hook.countsByCode.value" accent="#6366f1" />
          </div>
          <p class="kb-tip">敲击键盘任意键，键帽会实时亮起并显示累计次数。切到「统计」查看详细数据。</p>
        </div>
      </n-tab-pane>

      <!-- Tab 2：统计 -->
      <n-tab-pane name="stats" tab="统计">
        <div class="flex-1 overflow-auto p-4">
          <n-space vertical :size="16">
            <div class="grid grid-cols-3 gap-4">
              <n-card hoverable>
                <template #header><div class="text-sm font-medium">今日按键</div></template>
                <div class="text-3xl font-bold text-blue-500">{{ hook.todayTotal.value }}</div>
                <div class="text-xs text-gray-500">{{ formatTime(hook.todayStart.value) }} 至今</div>
              </n-card>
              <n-card hoverable>
                <template #header><div class="text-sm font-medium">历史总计</div></template>
                <div class="text-3xl font-bold text-green-500">{{ hook.allTimeTotal.value }}</div>
                <div class="text-xs text-gray-500">自 {{ formatDate(hook.installDate.value) }}</div>
              </n-card>
              <n-card hoverable>
                <template #header><div class="text-sm font-medium">活跃按键</div></template>
                <div class="text-3xl font-bold text-orange-500">{{ hook.activeKeys.value }}</div>
                <div class="text-xs text-gray-500">不同按键数量</div>
              </n-card>
            </div>

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

            <n-card title="历史高频按键" size="small">
              <div class="space-y-2">
                <div v-for="(item, index) in topAllKeys" :key="item.key" class="flex items-center gap-3">
                  <span class="w-6 text-center text-xs font-medium" :class="getRankClass(index)">{{ index + 1 }}</span>
                  <span class="w-16 text-center text-sm font-mono bg-gray-100 dark:bg-gray-800 rounded px-2 py-0.5">{{ formatKey(item.key) }}</span>
                  <span class="flex-1 text-sm text-gray-600">{{ item.count }}</span>
                </div>
                <div v-if="topAllKeys.length === 0" class="text-center text-gray-400 py-2">暂无数据</div>
              </div>
            </n-card>

            <n-card title="快捷键组合（最近记录）" size="small">
              <n-space vertical>
                <div v-for="(count, combo) in hook.hotkeys" :key="combo" class="flex justify-between items-center">
                  <span class="text-sm font-mono">{{ combo }}</span>
                  <span class="text-sm text-gray-500">{{ count }} 次</span>
                </div>
                <div v-if="Object.keys(hook.hotkeys).length === 0" class="text-center text-gray-400 py-2">暂无快捷键记录</div>
              </n-space>
            </n-card>
          </n-space>
        </div>
      </n-tab-pane>
    </n-tabs>
  </ToolPage>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { NButton, NCard, NSpace, NTag, NTabs, NTabPane, useMessage } from "naive-ui";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import KeyboardVisual from "./KeyboardVisual.vue";
import { useKeyboardHook } from "./useKeyboardHook";

const message = useMessage();
const hook = useKeyboardHook();

const tab = ref("keyboard");
const visualRef = ref<InstanceType<typeof KeyboardVisual> | null>(null);
const widgetOpen = ref(false);

const topTodayKeys = computed(() =>
  Object.entries(hook.todayCounts)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
);
const maxTodayCount = computed(() => topTodayKeys.value[0]?.count || 1);
const topAllKeys = computed(() =>
  Object.entries(hook.allTimeCounts)
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

async function toggleListening() {
  try {
    if (hook.isListening.value) {
      await hook.stop();
      message.info("已停止监听");
    } else {
      await hook.start();
      message.success("开始监听全局键盘事件");
    }
  } catch (e) {
    message.error(`操作失败：${(e as Error).message}`);
  }
}

// 桌面小插件窗口
async function openWidget() {
  try {
    const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
    const existing = await WebviewWindow.getByLabel("kbd-widget");
    if (existing) {
      await existing.show();
      await existing.setFocus();
      widgetOpen.value = true;
      return;
    }
    const w = new WebviewWindow("kbd-widget", {
      url: "index.html#/kbd-widget",
      title: "键盘小插件",
      width: 520,
      height: 210,
      resizable: true,
      decorations: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      shadow: false,
    });
    w.once("tauri://created", () => {
      widgetOpen.value = true;
      message.success("桌面小插件已开启");
    });
    w.once("tauri://error", (e) => {
      message.error(`小插件打开失败：${JSON.stringify(e.payload)}`);
    });
    w.once("tauri://destroyed", () => {
      widgetOpen.value = false;
    });
  } catch (e) {
    message.error(`小插件打开失败：${(e as Error).message}`);
  }
}

async function closeWidget() {
  try {
    const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
    const w = await WebviewWindow.getByLabel("kbd-widget");
    if (w) await w.close();
    widgetOpen.value = false;
  } catch {}
}

// 把每次按键转发给可视化组件触发特效
let offKey: (() => void) | null = null;

onMounted(async () => {
  hook.loadFromStorage();
  offKey = hook.onKey((_combo, code) => {
    visualRef.value?.trigger(code);
  });
  // 进入即自动开启监听
  try {
    await hook.start();
  } catch {
    // 忽略（可能非 Tauri 环境）
  }
  // 检测小插件窗口是否已存在
  try {
    const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
    const w = await WebviewWindow.getByLabel("kbd-widget");
    widgetOpen.value = !!w;
  } catch {}
});

onUnmounted(async () => {
  if (offKey) offKey();
  // 若小插件仍开着，则保持钩子运行；否则停止
  if (!widgetOpen.value) {
    await hook.stop();
  }
});
</script>

<style scoped>
.kb-tabs :deep(.kb-pane) {
  height: 100%;
  padding: 0;
}
.kb-tabs :deep(.n-tabs-pane-wrapper) {
  height: 100%;
}
.kb-stage {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 24px;
  background:
    radial-gradient(1200px 400px at 50% -10%, rgba(99, 102, 241, 0.18), transparent 60%),
    linear-gradient(180deg, #0f1117, #161923);
}
.kb-stage-header {
  display: flex;
  gap: 40px;
}
.kb-metric {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.kb-metric-num {
  font-size: 30px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
  text-shadow: 0 0 18px rgba(99, 102, 241, 0.55);
}
.kb-metric-label {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}
.kb-board-wrap {
  width: 100%;
  max-width: 900px;
}
.kb-tip {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
}
</style>
