<template>
  <header class="titlebar flex items-center gap-3 px-4 h-[48px] shrink-0">
    <div class="min-w-0 flex items-center gap-2.5">
      <n-icon
        v-if="tool"
        :component="tool.icon"
        :size="20"
        class="titlebar-tool-icon shrink-0"
      />
      <div class="min-w-0 leading-tight">
        <h1 class="titlebar-title truncate">{{ tool?.name ?? "KTool" }}</h1>
        <p v-if="tool?.description" class="titlebar-sub truncate">
          {{ tool.description }}
        </p>
      </div>
    </div>

    <div class="flex-1" />

    <!-- 独立键盘统计 -->
    <button
      class="titlebar-action"
      :class="{ 'titlebar-action--on': showKeyboardStats }"
      title="键盘统计"
      @click="$emit('toggle-keyboard-stats')"
    >
      <n-icon :size="16"><KeypadOutline /></n-icon>
    </button>

    <!-- 历史记录 -->
    <button
      class="titlebar-action"
      :class="{ 'titlebar-action--on': showHistory }"
      title="历史记录"
      @click="$emit('toggle-history')"
    >
      <n-icon :size="16"><TimeOutline /></n-icon>
    </button>

    <!-- 主题切换：浅色 / 深色 / 跟随系统 -->
    <button class="titlebar-action" :title="themeTitle" @click="onCycleTheme">
      <n-icon :size="16">
        <SunnyOutline v-if="themeMode === 'light'" />
        <MoonOutline v-else-if="themeMode === 'dark'" />
        <ContrastOutline v-else />
      </n-icon>
    </button>

    <!-- 设置 -->
    <button class="titlebar-action" title="设置" @click="$emit('open-settings')">
      <n-icon :size="16"><SettingsOutline /></n-icon>
    </button>

    <!-- GitHub 仓库 -->
    <button class="titlebar-action" title="打开 GitHub 仓库" @click="openRepository">
      <n-icon :size="17"><LogoGithub /></n-icon>
    </button>
  </header>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { NIcon } from "naive-ui";
import {
  TimeOutline,
  SettingsOutline,
  SunnyOutline,
  MoonOutline,
  ContrastOutline,
  KeypadOutline,
  LogoGithub,
} from "@vicons/ionicons5";
import { open } from "@tauri-apps/plugin-shell";
import type { ToolModule } from "@/tools/types";
import { useThemeStore } from "@/stores/theme";

defineProps<{
  tool: ToolModule | null;
  showHistory: boolean;
  showKeyboardStats: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle-history"): void;
  (e: "toggle-keyboard-stats"): void;
  (e: "open-settings"): void;
}>();

const themeStore = useThemeStore();
const themeMode = computed(() => themeStore.mode);
const themeTitle = computed(() => {
  const map = { light: "浅色", dark: "深色", auto: "跟随系统" } as const;
  return `主题：${map[themeStore.mode]}（点击切换）`;
});

function onCycleTheme() {
  themeStore.cycleMode();
}

async function openRepository() {
  await open("https://github.com/Kaiii-create/KaiTools");
}
</script>

<style scoped>
.titlebar {
  background: var(--ktool-surface);
}
.titlebar-tool-icon {
  color: var(--ktool-brand);
}
.titlebar-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ktool-text);
  line-height: 1.2;
}
.titlebar-sub {
  font-size: 13px;
  color: var(--ktool-text-mute);
  line-height: 1.2;
}
.titlebar-action {
  width: 30px;
  height: 30px;
  border-radius: var(--ktool-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  background: transparent;
  color: var(--ktool-text-soft);
  cursor: pointer;
  transition: background var(--ktool-duration) var(--ktool-ease),
    color var(--ktool-duration) var(--ktool-ease);
}
.titlebar-action:hover {
  background: var(--ktool-surface-2);
  color: var(--ktool-text);
}
.titlebar-action--on {
  background: var(--ktool-brand-soft);
  color: var(--ktool-brand);
}
</style>
