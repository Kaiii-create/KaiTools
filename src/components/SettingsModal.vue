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
          <div class="about-mark">K</div>
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
        <p class="settings-hint">深色主题自动跟随 Windows 系统设置（当选择“跟随系统”时）。</p>
      </section>

      <!-- 快捷键 -->
      <section class="settings-section">
        <h3 class="settings-h">快捷键</h3>
        <div class="settings-row">
          <span class="settings-label">命令面板</span>
          <kbd class="settings-kbd">Ctrl</kbd> + <kbd class="settings-kbd">K</kbd>
          <span class="settings-hint-inline">打开命令面板，搜索并切换工具</span>
        </div>
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
import {
  NModal,
  NRadioGroup,
  NRadio,
  NSpace,
  NButton,
} from "naive-ui";
import { useThemeStore, type ThemeMode } from "@/stores/theme";
import { useHistoryStore } from "@/stores/history";

defineProps<{ show: boolean }>();
const emit = defineEmits<{ (e: "update:show", v: boolean): void }>();

const themeStore = useThemeStore();
const historyStore = useHistoryStore();

const about = {
  appName: (window as any).__KTOOL_APP_INFO__?.appName ?? "KTool",
  appVersion: (window as any).__KTOOL_APP_INFO__?.appVersion ?? "",
  tauriVersion: (window as any).__KTOOL_APP_INFO__?.tauriVersion ?? "",
  os: (window as any).__KTOOL_APP_INFO__?.os ?? "Windows",
};
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
.settings-hint {
  font-size: 12px;
  color: var(--ktool-text-mute);
  margin: 8px 0 0;
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
  border-radius: var(--ktool-radius);
  background: var(--ktool-brand);
  color: var(--ktool-brand-contrast);
  font-weight: 700;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
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
</style>
