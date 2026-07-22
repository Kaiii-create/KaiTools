<template>
  <div class="keyboard-stats">
    <ToolToolbar class="keyboard-toolbar" variant="subtle">
      <n-button
        :type="hook.isListening.value ? 'default' : 'primary'"
        size="small"
        @click="toggleListening"
      >
        {{ hook.isListening.value ? "停止统计" : "开始统计" }}
      </n-button>
      <span class="listen-state" :class="{ 'is-on': hook.isListening.value }">
        <span class="listen-dot" />
        {{ hook.isListening.value ? "正在全局统计" : "统计已暂停" }}
      </span>

      <template #side>
        <div class="layout-switch" aria-label="键盘布局">
          <button :class="{ on: layoutMode === 'tkl' }" @click="layoutMode = 'tkl'">87 键</button>
          <button :class="{ on: layoutMode === 'full' }" @click="layoutMode = 'full'">104 键</button>
        </div>
        <n-button size="small" secondary :disabled="widgetOpen" @click="openWidget">
          {{ widgetOpen ? "桌面小窗已打开" : "桌面小窗" }}
        </n-button>
        <n-button v-if="widgetOpen" size="small" quaternary @click="closeWidget">关闭小窗</n-button>
        <n-button size="small" quaternary @click="hook.resetToday()">清空今日</n-button>
        <n-button size="small" quaternary type="error" @click="hook.resetAll()">清空全部</n-button>
      </template>
    </ToolToolbar>

    <div class="metric-grid">
      <div class="metric-card">
        <span class="metric-label">今日按键</span>
        <strong>{{ formatNumber(hook.todayTotal.value) }}</strong>
        <span>{{ todayDate }}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">历史总计</span>
        <strong>{{ formatNumber(hook.allTimeTotal.value) }}</strong>
        <span>自 {{ formatDate(hook.installDate.value) }}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">今日活跃按键</span>
        <strong>{{ hook.activeKeys.value }}</strong>
        <span>不同物理按键</span>
      </div>
    </div>

    <n-tabs v-model:value="tab" type="line" size="small" :animated="false" class="keyboard-tabs">
      <n-tab-pane name="keyboard" tab="键盘热力图">
        <div class="keyboard-panel">
          <div class="keyboard-scroll ktool-scroll">
            <KeyboardVisual
              :blocks="blocks"
              :counts="hook.countsByCode.value"
              :active-code="activeCode"
              :active-seq="activeSeq"
            />
          </div>
          <div class="keyboard-legend">
            <span><i class="legend-key" />按键次数显示在键帽右下角</span>
            <span>按下按键时会使用当前全局强调色高亮</span>
          </div>
        </div>
      </n-tab-pane>

      <n-tab-pane name="stats" tab="每日统计">
        <div class="stats-scroll ktool-scroll">
          <section class="stats-card daily-card">
            <header>
              <div>
                <h3>最近 14 天</h3>
                <p>每日按键数量</p>
              </div>
            </header>
            <div v-if="recentDays.length" class="daily-chart">
              <div v-for="day in recentDays" :key="day.date" class="daily-column">
                <span class="daily-value">{{ compactNumber(day.total) }}</span>
                <div class="daily-track">
                  <span :style="{ height: `${dailyBarHeight(day.total)}%` }" />
                </div>
                <span class="daily-date">{{ formatDayLabel(day.date) }}</span>
              </div>
            </div>
            <div v-else class="empty-state">开始统计后，这里会按天保留数据</div>
          </section>

          <div class="stats-columns">
            <section class="stats-card">
              <header><h3>今日高频按键</h3></header>
              <div v-if="topTodayKeys.length" class="ranking-list">
                <div v-for="(item, index) in topTodayKeys" :key="item.key" class="ranking-row">
                  <span class="ranking-index">{{ index + 1 }}</span>
                  <kbd>{{ formatKey(item.key) }}</kbd>
                  <div class="ranking-track">
                    <span :style="{ width: `${(item.count / maxTodayCount) * 100}%` }" />
                  </div>
                  <strong>{{ formatNumber(item.count) }}</strong>
                </div>
              </div>
              <div v-else class="empty-state">今日暂无数据</div>
            </section>

            <section class="stats-card">
              <header><h3>历史高频按键</h3></header>
              <div v-if="topAllKeys.length" class="ranking-list">
                <div v-for="(item, index) in topAllKeys" :key="item.key" class="ranking-row">
                  <span class="ranking-index">{{ index + 1 }}</span>
                  <kbd>{{ formatKey(item.key) }}</kbd>
                  <div class="ranking-track">
                    <span :style="{ width: `${(item.count / maxAllCount) * 100}%` }" />
                  </div>
                  <strong>{{ formatNumber(item.count) }}</strong>
                </div>
              </div>
              <div v-else class="empty-state">暂无历史数据</div>
            </section>
          </div>

          <section class="stats-card hotkey-card">
            <header><h3>常用快捷键组合</h3></header>
            <div v-if="topHotkeys.length" class="hotkey-grid">
              <div v-for="item in topHotkeys" :key="item.combo" class="hotkey-item">
                <kbd>{{ item.combo }}</kbd>
                <span>{{ formatNumber(item.count) }} 次</span>
              </div>
            </div>
            <div v-else class="empty-state">暂无快捷键组合记录</div>
          </section>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { NButton, NTabPane, NTabs, useMessage } from "naive-ui";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import KeyboardVisual from "./KeyboardVisual.vue";
import { useKeyboardHook } from "./useKeyboardHook";
import { FULL_LAYOUT_BLOCKS, TKL_LAYOUT_BLOCKS } from "./keyLayout";

const hook = useKeyboardHook();
const message = useMessage();
const tab = ref("keyboard");
const activeCode = ref<string | null>(null);
const activeSeq = ref(0);
const widgetOpen = ref(false);

const LAYOUT_KEY = "ktool_kbd_layout";
type LayoutMode = "tkl" | "full";
const storedLayout = localStorage.getItem(LAYOUT_KEY);
const layoutMode = ref<LayoutMode>(storedLayout === "tkl" ? "tkl" : "full");
watch(layoutMode, (value) => localStorage.setItem(LAYOUT_KEY, value));
const blocks = computed(() => layoutMode.value === "full" ? FULL_LAYOUT_BLOCKS : TKL_LAYOUT_BLOCKS);

const recentDays = computed(() => hook.dailySummaries.value.slice(0, 14).reverse());
const maxDailyTotal = computed(() => Math.max(1, ...recentDays.value.map((day) => day.total)));
const topTodayKeys = computed(() => rankedEntries(hook.todayCounts, 10));
const topAllKeys = computed(() => rankedEntries(hook.allTimeCounts, 10));
const maxTodayCount = computed(() => topTodayKeys.value[0]?.count || 1);
const maxAllCount = computed(() => topAllKeys.value[0]?.count || 1);
const topHotkeys = computed(() =>
  Object.entries(hook.hotkeys)
    .map(([combo, count]) => ({ combo, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
);
const todayDate = computed(() => new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric" }));

function rankedEntries(counts: Record<string, number>, limit: number) {
  return Object.entries(counts)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("zh-CN", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

function dailyBarHeight(total: number) {
  if (!total) return 0;
  return Math.max(5, (total / maxDailyTotal.value) * 100);
}

function formatDayLabel(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("zh-CN");
}

function formatKey(key: string) {
  const names: Record<string, string> = {
    escape: "Esc", backspace: "Backspace", capslock: "Caps Lock", space: "Space",
    enter: "Enter", numpadenter: "Num Enter", tab: "Tab", shift: "Shift", ctrl: "Ctrl",
    alt: "Alt", win: "Win", menu: "Menu", arrowup: "↑", arrowdown: "↓",
    arrowleft: "←", arrowright: "→", pageup: "PgUp", pagedown: "PgDn",
    printscreen: "PrtSc", scrolllock: "Scroll Lock", numlock: "Num Lock",
    numpadadd: "Num +", numpadsub: "Num −", numpadmul: "Num *", numpaddiv: "Num /",
    numpaddot: "Num .",
  };
  if (names[key]) return names[key];
  if (/^numpad\d$/.test(key)) return `Num ${key.slice(-1)}`;
  if (/^f\d{1,2}$/.test(key)) return key.toUpperCase();
  if (/^vk\d+$/.test(key)) return `VK ${key.slice(2)}`;
  return key.length === 1 ? key.toUpperCase() : key;
}

async function toggleListening() {
  try {
    if (hook.isListening.value) {
      await hook.stop();
      message.info("键盘统计已暂停");
    } else {
      await hook.start();
      message.success("键盘统计已开启");
    }
  } catch (error) {
    message.error(`操作失败：${String(error)}`);
  }
}

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
    const window = new WebviewWindow("kbd-widget", {
      url: "index.html#/kbd-widget",
      title: "键盘统计",
      width: 620,
      height: 300,
      resizable: true,
      decorations: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      shadow: false,
    });
    window.once("tauri://created", () => { widgetOpen.value = true; });
    window.once("tauri://destroyed", () => { widgetOpen.value = false; });
    window.once("tauri://error", () => message.error("桌面小窗打开失败"));
  } catch (error) {
    message.error(`桌面小窗打开失败：${String(error)}`);
  }
}

async function closeWidget() {
  try {
    const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
    const window = await WebviewWindow.getByLabel("kbd-widget");
    if (window) await window.close();
    widgetOpen.value = false;
  } catch {}
}

let offKey: (() => void) | null = null;
onMounted(async () => {
  hook.loadFromStorage();
  offKey = hook.onKey((_combo, code) => {
    activeCode.value = code;
    activeSeq.value += 1;
  });
  try {
    const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
    widgetOpen.value = !!(await WebviewWindow.getByLabel("kbd-widget"));
  } catch {}
});
onUnmounted(() => offKey?.());
</script>

<style scoped>
.keyboard-stats {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px 16px;
  background: var(--ktool-surface);
  color: var(--ktool-text);
}
.keyboard-toolbar { flex: 0 0 auto; }
.listen-state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ktool-text-mute);
  font-size: 12px;
}
.listen-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ktool-text-mute);
}
.listen-state.is-on { color: var(--ktool-text-soft); }
.listen-state.is-on .listen-dot {
  background: var(--ktool-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ktool-success) 16%, transparent);
}
.layout-switch {
  display: inline-flex;
  padding: 2px;
  border: 1px solid var(--ktool-border);
  border-radius: 7px;
  background: var(--ktool-surface-2);
}
.layout-switch button {
  height: 26px;
  padding: 0 10px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--ktool-text-mute);
  font-size: 12px;
  cursor: pointer;
}
.layout-switch button.on {
  background: var(--ktool-surface);
  color: var(--ktool-brand);
  box-shadow: var(--ktool-shadow-sm);
}
.metric-grid {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.metric-card {
  min-width: 0;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 3px 12px;
  padding: 12px 14px;
  border: 1px solid var(--ktool-border);
  border-radius: var(--ktool-radius-md);
  background: var(--ktool-surface);
}
.metric-card strong {
  grid-row: 1 / span 2;
  grid-column: 2;
  color: var(--ktool-brand);
  font-size: 24px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.metric-card > span:last-child { color: var(--ktool-text-mute); font-size: 11px; }
.metric-label { color: var(--ktool-text-soft); font-size: 13px; font-weight: 600; }
.keyboard-tabs {
  flex: 1 1 auto;
  min-height: 0;
}
.keyboard-tabs :deep(.n-tabs-pane-wrapper),
.keyboard-tabs :deep(.n-tab-pane) { height: 100%; min-height: 0; }
.keyboard-panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ktool-border);
  border-radius: var(--ktool-radius-md);
  background: var(--ktool-surface-inset);
  overflow: hidden;
}
.keyboard-scroll {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: center;
  overflow: auto;
  padding: 20px;
}
.keyboard-legend {
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 12px;
  border-top: 1px solid var(--ktool-border);
  background: var(--ktool-surface);
  color: var(--ktool-text-mute);
  font-size: 11px;
}
.keyboard-legend span { display: inline-flex; align-items: center; gap: 6px; }
.legend-key { width: 14px; height: 10px; border: 1px solid var(--ktool-border-strong); border-radius: 3px; background: var(--ktool-surface-2); }
.stats-scroll {
  height: 100%;
  overflow: auto;
  padding: 2px 2px 12px;
}
.stats-card {
  border: 1px solid var(--ktool-border);
  border-radius: var(--ktool-radius-md);
  background: var(--ktool-surface);
  padding: 14px;
}
.stats-card header { margin-bottom: 12px; }
.stats-card h3 { margin: 0; color: var(--ktool-text); font-size: 13px; font-weight: 600; }
.stats-card p { margin: 2px 0 0; color: var(--ktool-text-mute); font-size: 11px; }
.daily-chart {
  height: 150px;
  display: flex;
  align-items: stretch;
  gap: 8px;
}
.daily-column {
  flex: 1 1 0;
  min-width: 28px;
  display: grid;
  grid-template-rows: 18px 1fr 18px;
  gap: 4px;
  text-align: center;
}
.daily-value, .daily-date { color: var(--ktool-text-mute); font-size: 10px; font-variant-numeric: tabular-nums; }
.daily-track {
  position: relative;
  display: flex;
  align-items: end;
  border-radius: 4px;
  background: var(--ktool-surface-2);
  overflow: hidden;
}
.daily-track span { width: 100%; border-radius: 4px 4px 0 0; background: var(--ktool-brand); opacity: 0.82; }
.stats-columns { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
.ranking-list { display: flex; flex-direction: column; gap: 8px; }
.ranking-row { display: grid; grid-template-columns: 20px 84px minmax(40px, 1fr) 58px; align-items: center; gap: 8px; }
.ranking-index { color: var(--ktool-text-mute); font-size: 11px; text-align: center; }
.ranking-row kbd, .hotkey-item kbd {
  overflow: hidden;
  padding: 3px 7px;
  border: 1px solid var(--ktool-border);
  border-radius: 5px;
  background: var(--ktool-surface-2);
  color: var(--ktool-text-soft);
  font-family: inherit;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ranking-track { height: 6px; border-radius: 3px; background: var(--ktool-surface-2); overflow: hidden; }
.ranking-track span { display: block; height: 100%; border-radius: inherit; background: var(--ktool-brand); }
.ranking-row strong { color: var(--ktool-text-soft); font-size: 11px; font-weight: 600; text-align: right; }
.hotkey-card { margin-top: 12px; }
.hotkey-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.hotkey-item { min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.hotkey-item kbd { flex: 1; }
.hotkey-item span { color: var(--ktool-text-mute); font-size: 11px; white-space: nowrap; }
.empty-state { display: flex; min-height: 80px; align-items: center; justify-content: center; color: var(--ktool-text-mute); font-size: 12px; }
@media (max-width: 900px) {
  .hotkey-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
