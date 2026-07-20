<template>
  <header class="titlebar flex items-center gap-3 px-4 h-[52px] shrink-0">
    <div class="min-w-0 flex items-center gap-2.5">
      <n-icon
        v-if="tool"
        :component="tool.icon"
        :size="18"
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

    <!-- 命令面板 -->
    <button class="titlebar-action" title="命令面板 (Ctrl+K)" @click="$emit('open-command')">
      <n-icon :size="17"><AppsOutline /></n-icon>
    </button>

    <!-- 历史记录 -->
    <button
      class="titlebar-action"
      :class="{ 'titlebar-action--on': showHistory }"
      title="历史记录"
      @click="$emit('toggle-history')"
    >
      <n-icon :size="17"><TimeOutline /></n-icon>
    </button>

    <!-- 主题切换：浅色 / 深色 / 跟随系统 -->
    <button class="titlebar-action" :title="themeTitle" @click="onCycleTheme">
      <n-icon :size="17">
        <SunnyOutline v-if="themeMode === 'light'" />
        <MoonOutline v-else-if="themeMode === 'dark'" />
        <ContrastOutline v-else />
      </n-icon>
    </button>

    <!-- 设置 -->
    <button class="titlebar-action" title="设置" @click="$emit('open-settings')">
      <n-icon :size="17"><SettingsOutline /></n-icon>
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
  AppsOutline,
} from "@vicons/ionicons5";
import type { ToolModule } from "@/tools/types";
import { useThemeStore } from "@/stores/theme";

defineProps<{
  tool: ToolModule | null;
  showHistory: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle-history"): void;
  (e: "open-settings"): void;
  (e: "open-command"): void;
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
</script>

<style scoped>
.titlebar {
  background: var(--ktool-surface);
  border-bottom: 1px solid var(--ktool-border);
}
.titlebar-tool-icon {
  color: var(--ktool-brand);
}
.titlebar-title {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--ktool-text);
  line-height: 1.2;
}
.titlebar-sub {
  font-size: 12px;
  color: var(--ktool-text-mute);
  line-height: 1.2;
}
.titlebar-action {
  width: 32px;
  height: 32px;
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
