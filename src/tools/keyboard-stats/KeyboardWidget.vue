<template>
  <div class="kbd-widget" :class="{ 'is-mini': mini }" :style="rootStyle">
    <!-- 拖动条 + 工具按钮 -->
    <div class="kw-bar" data-tauri-drag-region>
      <span class="kw-title" data-tauri-drag-region>⌨ 键盘</span>
      <span class="kw-count" data-tauri-drag-region>{{ hook.todayTotal.value }}</span>
      <div class="kw-actions">
        <button v-if="!mini" class="kw-btn" title="设置" @click="showSettings = !showSettings">
          <n-icon :component="SettingsOutline" :size="14" />
        </button>
        <button class="kw-btn" :title="mini ? '展开键盘' : '迷你模式'" @click="toggleMini">
          <n-icon :component="mini ? ExpandOutline : ContractOutline" :size="14" />
        </button>
        <button class="kw-btn" title="始终置顶" :class="{ on: alwaysOnTop }" @click="toggleTop">
          <n-icon :component="PinOutline" :size="14" />
        </button>
        <button
          class="kw-btn"
          :class="{ on: locked }"
          :title="locked ? '已锁定，点击解锁' : '锁定，防止误关'"
          @click="locked = !locked"
        >
          <n-icon :component="locked ? LockClosedOutline : LockOpenOutline" :size="14" />
        </button>
        <button
          class="kw-btn kw-close"
          :disabled="locked"
          :title="locked ? '请先解锁' : '关闭'"
          @click="closeSelf"
        >
          <n-icon :component="CloseOutline" :size="15" />
        </button>
      </div>
    </div>

    <!-- 迷你模式：只保留关键状态和最近按键 -->
    <div v-if="mini" class="kw-mini" data-tauri-drag-region>
      <span class="kw-live" :class="{ on: hook.isListening.value }">
        <i />{{ hook.isListening.value ? "统计中" : "已暂停" }}
      </span>
      <span class="kw-last">
        最近
        <kbd>{{ lastKey }}</kbd>
      </span>
      <span class="kw-mini-total">今日 {{ hook.todayTotal.value }}</span>
    </div>

    <!-- 键盘可视化（缩放以适配尺寸） -->
    <div v-else class="kw-board" :style="boardStyle">
      <div class="kw-scale" :style="{ transform: `scale(${scale})` }">
        <KeyboardVisual :counts="hook.countsByCode.value" :show-count="showCount" compact :active-code="activeCode" :active-seq="activeSeq" />
      </div>
    </div>

    <!-- 设置面板 -->
    <div v-if="showSettings" class="kw-settings">
      <div class="kw-row">
        <label>宽度</label>
        <input type="range" min="360" max="900" step="10" v-model.number="width" />
        <span class="kw-val">{{ width }}</span>
      </div>
      <div class="kw-row">
        <label>高度</label>
        <input type="range" min="150" max="420" step="10" v-model.number="height" />
        <span class="kw-val">{{ height }}</span>
      </div>
      <div class="kw-row">
        <label>透明度</label>
        <input type="range" min="0.3" max="1" step="0.05" v-model.number="opacity" />
        <span class="kw-val">{{ Math.round(opacity * 100) }}%</span>
      </div>
      <div class="kw-row">
        <label class="kw-check">
          <input type="checkbox" v-model="showCount" /> 显示次数
        </label>
      </div>
      <div class="kw-row">
        <label class="kw-check">
          <input type="checkbox" v-model="alwaysOnTop" @change="applyAlwaysOnTop" /> 始终置顶
        </label>
        <label class="kw-check">
          <input type="checkbox" v-model="locked" /> 锁定防误关
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import { NIcon } from "naive-ui";
import {
  CloseOutline,
  ContractOutline,
  ExpandOutline,
  LockClosedOutline,
  LockOpenOutline,
  PinOutline,
  SettingsOutline,
} from "@vicons/ionicons5";
import KeyboardVisual from "./KeyboardVisual.vue";
import { useKeyboardHook } from "./useKeyboardHook";

const hook = useKeyboardHook();
const activeCode = ref<string | null>(null);
const activeSeq = ref(0);
const lastKey = ref("—");

const SETTINGS_KEY = "ktool_kbd_widget_settings";
const showSettings = ref(false);

const state = reactive({
  width: 520,
  height: 210,
  opacity: 0.95,
  showCount: true,
  alwaysOnTop: true,
  locked: false,
  mini: false,
});

const width = computed({
  get: () => state.width,
  set: (v) => { state.width = v; },
});
const height = computed({
  get: () => state.height,
  set: (v) => { state.height = v; },
});
const opacity = computed({
  get: () => state.opacity,
  set: (v) => { state.opacity = v; },
});
const showCount = computed({
  get: () => state.showCount,
  set: (v) => { state.showCount = v; },
});
const alwaysOnTop = computed({
  get: () => state.alwaysOnTop,
  set: (v) => { state.alwaysOnTop = v; },
});
const locked = computed({
  get: () => state.locked,
  set: (v) => { state.locked = v; },
});
const mini = computed({
  get: () => state.mini,
  set: (v) => { state.mini = v; },
});

const rootStyle = computed(() => ({
  opacity: String(state.opacity),
}));

// 键盘固定设计宽度（KeyboardVisual 内部约 14 键 * 约 60px ≈ 一致比例），用 scale 适配
const DESIGN_WIDTH = 780;
const boardStyle = computed(() => ({}));
const scale = computed(() => {
  const avail = state.width - 24;
  return Math.min(1, avail / DESIGN_WIDTH);
});

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state));
  } catch {}
}
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    Object.assign(state, s);
  } catch {}
}

async function applyWindowSize() {
  try {
    const { getCurrentWebviewWindow } = await import("@tauri-apps/api/webviewWindow");
    const { LogicalSize } = await import("@tauri-apps/api/dpi");
    const w = getCurrentWebviewWindow();
    await w.setSize(
      state.mini
        ? new LogicalSize(300, 82)
        : new LogicalSize(state.width, state.height)
    );
  } catch {}
}

async function applyAlwaysOnTop() {
  try {
    const { getCurrentWebviewWindow } = await import("@tauri-apps/api/webviewWindow");
    const w = getCurrentWebviewWindow();
    await w.setAlwaysOnTop(state.alwaysOnTop);
  } catch {}
}

async function toggleTop() {
  state.alwaysOnTop = !state.alwaysOnTop;
  await applyAlwaysOnTop();
}

async function toggleMini() {
  state.mini = !state.mini;
  showSettings.value = false;
  await applyWindowSize();
  saveSettings();
}

async function closeSelf() {
  if (state.locked) return;
  try {
    const { getCurrentWebviewWindow } = await import("@tauri-apps/api/webviewWindow");
    await getCurrentWebviewWindow().close();
  } catch {}
}

// 尺寸变更时同步窗口 + 持久化
watch(
  () => [state.width, state.height, state.mini],
  () => {
    applyWindowSize();
    saveSettings();
  }
);
watch(
  () => [state.opacity, state.showCount, state.alwaysOnTop, state.locked, state.mini],
  () => saveSettings()
);

onMounted(async () => {
  loadSettings();
  hook.loadFromStorage();
  // 小插件只订阅事件（钩子由主窗口启动），触发特效
  hook.onKey((_combo, code) => {
    activeCode.value = code;
    activeSeq.value++;
    lastKey.value = formatKey(code);
  });
  await hook.subscribeOnly();
  await applyWindowSize();
  await applyAlwaysOnTop();
});

function formatKey(code: string) {
  const names: Record<string, string> = {
    space: "Space",
    enter: "Enter",
    numpadenter: "Num Enter",
    backspace: "Backspace",
    escape: "Esc",
    arrowup: "↑",
    arrowdown: "↓",
    arrowleft: "←",
    arrowright: "→",
  };
  return names[code] || (code.length === 1 ? code.toUpperCase() : code);
}
</script>

<style scoped>
.kbd-widget {
  width: 100vw;
  height: 100vh;
  border-radius: 14px;
  overflow: hidden;
  background: color-mix(in srgb, var(--ktool-surface) 94%, transparent);
  backdrop-filter: blur(12px);
  border: 1px solid var(--ktool-border-strong);
  display: flex;
  flex-direction: column;
  color: var(--ktool-text);
  box-shadow: var(--ktool-shadow-lg);
}
.kw-bar {
  height: 30px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  cursor: grab;
  background: var(--ktool-surface-2);
  border-bottom: 1px solid var(--ktool-border);
}
.kw-bar:active {
  cursor: grabbing;
}
.kw-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--ktool-text-soft);
}
.kw-count {
  font-size: 12px;
  font-weight: 800;
  color: var(--ktool-brand);
}
.kw-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}
.kw-btn {
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 6px;
  background: var(--ktool-surface-3);
  color: var(--ktool-text-soft);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
}
.kw-btn:hover {
  background: var(--ktool-brand-soft);
}
.kw-btn.on {
  background: var(--ktool-brand);
  color: var(--ktool-brand-contrast);
}
.kw-close:hover {
  background: #ef4444;
  color: #fff;
}
.kw-btn:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}
.kw-btn:disabled:hover {
  background: var(--ktool-surface-3);
  color: var(--ktool-text-soft);
}
.kw-mini {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0 12px;
  color: var(--ktool-text-mute);
  font-size: 11px;
  cursor: grab;
}
.kw-live,
.kw-last {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.kw-live i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ktool-text-mute);
}
.kw-live.on i {
  background: var(--ktool-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ktool-success) 14%, transparent);
}
.kw-last kbd {
  max-width: 70px;
  overflow: hidden;
  padding: 2px 5px;
  border: 1px solid var(--ktool-border);
  border-radius: 4px;
  background: var(--ktool-surface-2);
  color: var(--ktool-text-soft);
  font-family: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.kw-mini-total {
  margin-left: auto;
  color: var(--ktool-brand);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.kw-board {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  overflow: hidden;
}
.kw-scale {
  width: 780px;
  transform-origin: center center;
}
.kw-settings {
  flex: 0 0 auto;
  padding: 8px 12px 10px;
  background: var(--ktool-surface-2);
  border-top: 1px solid var(--ktool-border);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.kw-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--ktool-text-soft);
}
.kw-row > label {
  width: 42px;
  flex: 0 0 auto;
}
.kw-row input[type="range"] {
  flex: 1;
  accent-color: var(--ktool-brand);
}
.kw-val {
  width: 40px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.kw-check {
  display: flex;
  align-items: center;
  gap: 4px;
  width: auto !important;
  cursor: pointer;
}
.kw-check input {
  accent-color: var(--ktool-brand);
}
</style>
