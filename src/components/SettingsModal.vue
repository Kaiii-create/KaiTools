<template>
  <n-modal
    :show="show"
    preset="card"
    title="设置"
    style="width: 560px; max-width: calc(100vw - 32px)"
    :bordered="false"
    @update:show="(v: boolean) => emit('update:show', v)"
  >
    <div class="settings-body ktool-scroll overflow-auto" style="max-height: 64vh">
      <!-- 关于 -->
      <section class="settings-section">
        <h3 class="settings-h">关于</h3>
        <div class="settings-about">
          <img class="about-mark" :src="appIcon" alt="KTool" />
          <div>
            <div class="about-name">{{ about.appName || "KTool" }}</div>
            <div class="about-meta">
              <span>版本 {{ about.appVersion || "—" }}</span>
              <span class="dot" />
              <span>Tauri {{ about.tauriVersion || "—" }}</span>
              <span class="dot" />
              <span>{{ about.os || "—" }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 外观 -->
      <section class="settings-section">
        <h3 class="settings-h">外观</h3>
        <div class="settings-row">
          <span class="settings-label">主题</span>
          <n-radio-group
            :value="themeStore.mode"
            @update:value="(v: ThemeMode) => themeStore.setMode(v)"
          >
            <n-space>
              <n-radio value="light" label="浅色" />
              <n-radio value="dark" label="深色" />
              <n-radio value="auto" label="跟随系统" />
            </n-space>
          </n-radio-group>
        </div>
        <div class="settings-row mt-3">
          <span class="settings-label">强调色</span>
          <n-color-picker
            :value="themeStore.accentColor"
            :show-alpha="false"
            :modes="['hex']"
            :swatches="accentSwatches"
            size="small"
            class="accent-picker"
            @update:value="onAccentColorChange"
          />
          <n-button size="small" quaternary @click="themeStore.resetAccentColor()">
            恢复默认
          </n-button>
        </div>
      </section>

      <!-- 窗口与启动 -->
      <section class="settings-section">
        <h3 class="settings-h">窗口与启动</h3>
        <div class="settings-row">
          <span class="settings-label">关闭时</span>
          <n-radio-group
            :value="settings.data.closeBehavior"
            @update:value="(v: CloseBehavior) => settings.setCloseBehavior(v)"
          >
            <n-space>
              <n-radio value="ask" label="询问我" />
              <n-radio value="minimize" label="最小化到托盘" />
              <n-radio value="quit" label="直接退出" />
            </n-space>
          </n-radio-group>
        </div>
        <div class="settings-row mt-3">
          <span class="settings-label">开机自启</span>
          <n-switch :value="autoStartOn" @update:value="onAutoStartChange" />
        </div>
      </section>

      <!-- 快捷键 -->
      <section class="settings-section">
        <h3 class="settings-h">快捷键</h3>
        <div class="settings-row">
          <span class="settings-label">命令面板</span>
          <kbd class="settings-kbd">Ctrl</kbd> + <kbd class="settings-kbd">K</kbd>
        </div>
      </section>

      <!-- 屏幕取色 -->
      <section class="settings-section">
        <h3 class="settings-h">屏幕取色</h3>
        <div class="settings-row">
          <span class="settings-label">快捷键</span>
          <n-input
            :value="recording ? '请按下组合键…' : settings.data.pickerShortcut"
            readonly
            size="small"
            class="shortcut-input"
          />
          <n-button size="small" :type="recording ? 'error' : 'default'" @click="toggleRecord">
            {{ recording ? "停止录制" : "录制" }}
          </n-button>
        </div>
        <p v-if="shortcutError" class="shortcut-error">{{ shortcutError }}</p>
      </section>

      <!-- 工具显示 -->
      <section class="settings-section">
        <h3 class="settings-h">工具显示</h3>
        <div class="tool-toggle-grid">
          <div v-for="t in allTools" :key="t.id" class="tool-toggle-item">
            <span class="tool-name">{{ t.name }}</span>
            <n-switch
              :value="!settings.isToolHidden(t.id)"
              @update:value="(v: boolean) => settings.setToolHidden(t.id, !v)"
            />
          </div>
        </div>
        <n-button size="small" tertiary class="mt-3" @click="settings.showAllTools()">
          全部显示
        </n-button>
      </section>

      <!-- 数据 -->
      <section class="settings-section">
        <h3 class="settings-h">数据</h3>
        <div class="settings-row">
          <span class="settings-label">历史记录</span>
          <n-button size="small" tertiary type="error" @click="historyStore.clear()">
            清空历史记录
          </n-button>
          <span class="settings-hint-inline">{{ historyStore.items.length }} 条记录</span>
        </div>
      </section>
    </div>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onUnmounted } from "vue";
import {
  NModal,
  NRadioGroup,
  NRadio,
  NSpace,
  NButton,
  NColorPicker,
  NInput,
  NSwitch,
} from "naive-ui";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { useThemeStore, type ThemeMode } from "@/stores/theme";
import { useHistoryStore } from "@/stores/history";
import { useSettingsStore, type CloseBehavior } from "@/stores/settings";
import { tools } from "@/tools/registry";
import appIcon from "@/assets/brand/ktool-app-icon-ui.png";
import { invoke } from "@tauri-apps/api/core";

const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{ (e: "update:show", v: boolean): void }>();

const themeStore = useThemeStore();
const historyStore = useHistoryStore();
const settings = useSettingsStore();
const allTools = tools;
const accentSwatches = ["#4f46e5", "#2563eb", "#0891b2", "#059669", "#d97706", "#e11d48"];

function onAccentColorChange(value: string | null) {
  if (value) themeStore.setAccentColor(value);
}

// 开机自启：以系统实际状态为准
const autoStartOn = ref(settings.data.autoStart);
async function syncAutoStart() {
  try {
    autoStartOn.value = await isEnabled();
    settings.setAutoStart(autoStartOn.value);
  } catch {
    // 浏览器预览环境忽略
  }
}
async function onAutoStartChange(v: boolean) {
  try {
    if (v) await enable();
    else await disable();
    autoStartOn.value = v;
    settings.setAutoStart(v);
  } catch {
    // 忽略失败
  }
}

const recording = ref(false);
const shortcutError = ref("");

function toggleRecord() {
  // 再次点击则停止录制
  if (recording.value) {
    recording.value = false;
    return;
  }
  recording.value = true;
  shortcutError.value = "";
}

async function onRecordKey(e: KeyboardEvent) {
  if (!recording.value) return;
  e.preventDefault();
  e.stopPropagation();
  const key = e.key;
  // 仅修饰键时继续等待真正的按键
  if (["Control", "Alt", "Shift", "Meta"].includes(key)) return;
  const parts: string[] = [];
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.altKey) parts.push("Alt");
  if (e.shiftKey) parts.push("Shift");
  if (e.metaKey) parts.push("Meta");
  let k = key;
  if (key === " ") k = "Space";
  else if (key.length === 1) k = key.toUpperCase();
  parts.push(k);
  const combo = parts.join("+");
  // 必须有非修饰键；纯修饰键组合无效，提示后放弃本次录入
  if (parts.length === 0) {
    recording.value = false;
    return;
  }
  const hasNonModifier = !["Ctrl", "Alt", "Shift", "Meta"].includes(k);
  if (!hasNonModifier) {
    shortcutError.value = "快捷键必须包含至少一个普通按键（不能只有修饰键）";
    recording.value = false;
    return;
  }
  shortcutError.value = "";
  recording.value = false;
  try {
    await invoke("set_picker_shortcut", { shortcut: combo });
    settings.setPickerShortcut(combo);
  } catch (error) {
    shortcutError.value = String(error);
  }
}

onMounted(() => {
  window.addEventListener("keydown", onRecordKey, true);
  window.addEventListener("ktool-app-info", syncAbout);
  syncAutoStart();
  syncAbout();
});
onUnmounted(() => {
  window.removeEventListener("keydown", onRecordKey, true);
  window.removeEventListener("ktool-app-info", syncAbout);
});

const about = reactive({ appName: "KTool", appVersion: "", tauriVersion: "", os: "Windows" });
function syncAbout() {
  const info = (window as any).__KTOOL_APP_INFO__;
  if (info) Object.assign(about, info);
}
watch(() => props.show, (show) => {
  if (show) syncAbout();
});
</script>

<style scoped>
.settings-body {
  padding-right: 4px;
}
.settings-section {
  padding: 4px 0 16px;
}
.settings-section + .settings-section {
  border-top: 1px solid var(--ktool-border);
  padding-top: 16px;
}
.settings-h {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ktool-text-mute);
  margin: 0 0 12px;
}
.settings-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.settings-label {
  font-size: 13px;
  color: var(--ktool-text);
  min-width: 64px;
}
.settings-hint-inline {
  font-size: 12px;
  color: var(--ktool-text-mute);
}
.settings-kbd {
  font-size: 11px;
  font-family: inherit;
  color: var(--ktool-text-soft);
  background: var(--ktool-surface-2);
  border: 1px solid var(--ktool-border);
  border-radius: 4px;
  padding: 2px 6px;
}
.settings-about {
  display: flex;
  align-items: center;
  gap: 12px;
}
.about-mark {
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
}
.about-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--ktool-text);
}
.about-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--ktool-text-mute);
  margin-top: 2px;
}
.about-meta .dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--ktool-text-mute);
}
.shortcut-input {
  flex: 1;
  max-width: 240px;
}
.accent-picker {
  width: 220px;
}
.shortcut-error {
  font-size: 12px;
  color: var(--ktool-danger);
  margin: 8px 0 0;
}
.tool-toggle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 16px;
  margin-top: 12px;
}
.tool-toggle-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--ktool-border);
  border-radius: var(--ktool-radius);
  background: var(--ktool-surface-2);
}
.tool-name {
  font-size: 13px;
  color: var(--ktool-text);
}
</style>
