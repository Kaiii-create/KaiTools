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
import { ref, computed, onMounted, onUnmounted } from "vue";
import WindowChrome from "@/components/WindowChrome.vue";
import Sidebar from "@/components/Sidebar.vue";
import TitleBar from "@/components/TitleBar.vue";
import HistoryDrawer from "@/components/HistoryDrawer.vue";
import CommandPalette from "@/components/CommandPalette.vue";
import SettingsModal from "@/components/SettingsModal.vue";
import { tools } from "@/tools/registry";
import { useHistoryStore } from "@/stores/history";
import { useNavStore } from "@/stores/nav";

const historyStore = useHistoryStore();
const navStore = useNavStore();

const activeToolId = ref<string>(tools[0].id);
const showHistory = ref(false);
const showCommand = ref(false);
const showSettings = ref(false);
const maximized = ref(false);
const sidebarRef = ref<InstanceType<typeof Sidebar> | null>(null);

const activeTool = computed(
  () => tools.find((t) => t.id === activeToolId.value) ?? tools[0]
);

function onSelect(id: string) {
  activeToolId.value = id;
  navStore.touchRecent(id);
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
});
onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped>
.window-frame {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ktool-bg);
  border: 1px solid var(--ktool-window-border);
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
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
  background: var(--ktool-bg);
}
</style>
