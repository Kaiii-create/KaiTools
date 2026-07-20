<template>
  <div
    class="kbd-widget"
    :style="rootStyle"
  >
    <!-- 拖动条 + 工具按钮 -->
    <div class="kw-bar" data-tauri-drag-region>
      <span class="kw-title" data-tauri-drag-region>⌨ 键盘</span>
      <span class="kw-count" data-tauri-drag-region>{{ hook.todayTotal.value }}</span>
      <div class="kw-actions">
        <button class="kw-btn" title="设置" @click="showSettings = !showSettings">⚙</button>
        <button class="kw-btn" title="置顶" :class="{ on: alwaysOnTop }" @click="toggleTop">📌</button>
        <button class="kw-btn kw-close" title="关闭" @click="closeSelf">✕</button>
      </div>
    </div>

    <!-- 键盘可视化（缩放以适配尺寸） -->
    <div class="kw-board" :style="boardStyle">
      <div class="kw-scale" :style="{ transform: `scale(${scale})` }">
        <KeyboardVisual ref="visualRef" :counts="hook.countsByCode.value" :accent="accent" :show-count="showCount" compact />
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
        <label>主题色</label>
        <input type="color" v-model="accent" />
        <label class="kw-check">
          <input type="checkbox" v-model="showCount" /> 显示次数
        </label>
      </div>
      <div class="kw-row">
        <label class="kw-check">
          <input type="checkbox" v-model="alwaysOnTop" @change="applyAlwaysOnTop" /> 始终置顶
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from "vue";
import KeyboardVisual from "./KeyboardVisual.vue";
import { useKeyboardHook } from "./useKeyboardHook";

const hook = useKeyboardHook();
const visualRef = ref<InstanceType<typeof KeyboardVisual> | null>(null);

const SETTINGS_KEY = "ktool_kbd_widget_settings";
const showSettings = ref(false);

const state = reactive({
  width: 520,
  height: 210,
  opacity: 0.95,
  accent: "#6366f1",
  showCount: true,
  alwaysOnTop: true,
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
const accent = computed({
  get: () => state.accent,
  set: (v) => { state.accent = v; },
});
const showCount = computed({
  get: () => state.showCount,
  set: (v) => { state.showCount = v; },
});
const alwaysOnTop = computed({
  get: () => state.alwaysOnTop,
  set: (v) => { state.alwaysOnTop = v; },
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
    await w.setSize(new LogicalSize(state.width, state.height));
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

async function closeSelf() {
  try {
    const { getCurrentWebviewWindow } = await import("@tauri-apps/api/webviewWindow");
    await getCurrentWebviewWindow().close();
  } catch {}
}

// 尺寸变更时同步窗口 + 持久化
watch(
  () => [state.width, state.height],
  () => {
    applyWindowSize();
    saveSettings();
  }
);
watch(
  () => [state.opacity, state.accent, state.showCount, state.alwaysOnTop],
  () => saveSettings()
);

onMounted(async () => {
  loadSettings();
  hook.loadFromStorage();
  // 小插件只订阅事件（钩子由主窗口启动），触发特效
  hook.onKey((_combo, code) => {
    visualRef.value?.trigger(code);
  });
  await hook.subscribeOnly();
  await applyWindowSize();
  await applyAlwaysOnTop();
});
</script>

<style scoped>
.kbd-widget {
  width: 100vw;
  height: 100vh;
  border-radius: 14px;
  overflow: hidden;
  background: rgba(15, 17, 23, 0.82);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  color: #fff;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
}
.kw-bar {
  height: 30px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  cursor: grab;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.kw-bar:active {
  cursor: grabbing;
}
.kw-title {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
}
.kw-count {
  font-size: 12px;
  font-weight: 800;
  color: v-bind(accent);
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
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.75);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease;
}
.kw-btn:hover {
  background: rgba(255, 255, 255, 0.14);
}
.kw-btn.on {
  background: v-bind(accent);
  color: #fff;
}
.kw-close:hover {
  background: #ef4444;
  color: #fff;
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
  background: rgba(0, 0, 0, 0.35);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.kw-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}
.kw-row > label {
  width: 42px;
  flex: 0 0 auto;
}
.kw-row input[type="range"] {
  flex: 1;
  accent-color: v-bind(accent);
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
  accent-color: v-bind(accent);
}
</style>
