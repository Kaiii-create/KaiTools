<template>
  <div class="window-frame" :class="{ 'window-frame--maximized': maximized }">
    <WindowChrome @maximized-change="maximized = $event" />

    <div class="app-shell flex min-h-0 flex-1 w-full overflow-hidden">
      <!-- 单一左侧导航栏 -->
      <Sidebar
        ref="sidebarRef"
        :active-id="activeToolId"
        @select="onSelect"
        @open-settings="showSettings = true"
        @open-command="showCommand = true"
      />

    <!-- 主区域 -->
      <main class="app-main flex flex-col min-w-0 flex-1">
      <TitleBar
        :tool="activeTool"
        :show-history="showHistory"
        @toggle-history="showHistory = !showHistory"
        @open-settings="showSettings = true"
        @open-command="showCommand = true"
      />

      <div class="app-workspace flex-1 min-h-0">
        <transition name="workspace" mode="out-in">
          <component :is="activeTool.component" :key="activeTool.id" />
        </transition>
      </div>
      </main>
    </div>

    <!-- 历史记录（从右侧滑出，不占工作区） -->
    <HistoryDrawer
      :show="showHistory"
      :history="historyStore.items"
      @update:show="showHistory = $event"
      @select="onSelect"
      @clear="historyStore.clear()"
    />

    <!-- 命令面板 -->
    <CommandPalette
      :show="showCommand"
      @update:show="showCommand = $event"
      @select="onSelect"
    />

    <!-- 设置 -->
    <SettingsModal :show="showSettings" @update:show="showSettings = $event" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import WindowChrome from "@/components/WindowChrome.vue";
import Sidebar from "@/components/Sidebar.vue";
import TitleBar from "@/components/TitleBar.vue";
import HistoryDrawer from "@/components/HistoryDrawer.vue";
import CommandPalette from "@/components/CommandPalette.vue";
import SettingsModal from "@/components/SettingsModal.vue";
import { tools } from "@/tools/registry";
import { useHistoryStore } from "@/stores/history";
import type { HistoryItem } from "@/stores/history";
import { useNavStore } from "@/stores/nav";
import { useSettingsStore } from "@/stores/settings";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { openColorPicker } from "@/lib/picker";
import { invoke } from "@tauri-apps/api/core";

const historyStore = useHistoryStore();
const navStore = useNavStore();
const settings = useSettingsStore();

const activeToolId = ref<string>(tools[0].id);
const showHistory = ref(false);
const showCommand = ref(false);
const showSettings = ref(false);
const maximized = ref(false);
const sidebarRef = ref<InstanceType<typeof Sidebar> | null>(null);

const activeTool = computed(
  () => tools.find((t) => t.id === activeToolId.value) ?? tools[0]
);

function onSelect(payload: string | HistoryItem) {
  if (typeof payload === "string") {
    activeToolId.value = payload;
    navStore.touchRecent(payload);
  } else {
    activeToolId.value = payload.toolId;
    navStore.touchRecent(payload.toolId);
    historyStore.requestRestore(payload);
  }
}

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.code === "KeyK") {
    e.preventDefault();
    showCommand.value = !showCommand.value;
  }
}

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
  navStore.touchRecent(activeToolId.value);
  // 把当前取色快捷键交给 Rust 端统一注册（安全，不会因冲突崩溃）
  applyPickerShortcut(settings.data.pickerShortcut);
  // 把关闭行为同步给 Rust（影响 Alt+F4 等系统级关闭）
  applyCloseMode(settings.data.closeBehavior);
  // 监听 Rust 端全局快捷键触发的取色事件
  getCurrentWindow()
    .listen("open-color-picker", () => openColorPicker())
    .catch(() => {});
});

// 屏幕取色全局快捷键：随设置变化交给 Rust 端重注册
async function applyPickerShortcut(shortcut: string) {
  try {
    await invoke("set_picker_shortcut", { shortcut });
  } catch (e) {
    console.warn("[picker] 取色快捷键设置失败：", e);
  }
}
watch(() => settings.data.pickerShortcut, (s) => applyPickerShortcut(s));

// 关闭行为：同步给 Rust（系统级关闭尊重设置）
async function applyCloseMode(mode: string) {
  try {
    await invoke("set_close_mode", { mode });
  } catch (e) {
    console.warn("[close] 关闭模式设置失败：", e);
  }
}
watch(() => settings.data.closeBehavior, (m) => applyCloseMode(m));
</script>

<style scoped>
.window-frame {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ktool-bg);
  border: 0;
  border-radius: 10px;
  box-shadow: none;
}
.window-frame--maximized {
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
.app-shell {
  background: var(--ktool-bg);
}
.app-main {
  background: var(--ktool-bg);
}
.app-workspace {
  background: var(--ktool-surface);
}
</style>
