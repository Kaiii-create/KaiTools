<template>
  <header
    class="window-chrome"
    data-tauri-drag-region
    @dblclick="toggleMaximize"
  >
    <div class="window-brand" data-tauri-drag-region>
      <span class="window-brand-mark">K</span>
      <span class="window-brand-name">KTool</span>
    </div>

    <div class="window-drag-space" data-tauri-drag-region />

    <div class="window-controls" @dblclick.stop>
      <button class="window-control" aria-label="最小化" title="最小化" @click="minimize">
        <span class="control-minimize" />
      </button>
      <button
        class="window-control"
        :aria-label="maximized ? '还原' : '最大化'"
        :title="maximized ? '还原' : '最大化'"
        @click="toggleMaximize"
      >
        <span :class="maximized ? 'control-restore' : 'control-maximize'" />
      </button>
      <button class="window-control window-control--close" aria-label="关闭" title="关闭" @click="close">
        <span class="control-close" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const emit = defineEmits<{ (e: "maximized-change", value: boolean): void }>();
const maximized = ref(false);
const isTauri = "__TAURI_INTERNALS__" in window;
let unlistenResize: (() => void) | undefined;

async function currentWindow() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  return getCurrentWindow();
}

async function syncMaximized() {
  if (!isTauri) return;
  try {
    maximized.value = await (await currentWindow()).isMaximized();
    emit("maximized-change", maximized.value);
  } catch {
    // 浏览器预览环境中保持普通窗口外观。
  }
}

async function minimize() {
  if (!isTauri) return;
  await (await currentWindow()).minimize();
}

async function toggleMaximize() {
  if (!isTauri) return;
  await (await currentWindow()).toggleMaximize();
  await syncMaximized();
}

async function close() {
  if (!isTauri) return;
  await (await currentWindow()).close();
}

onMounted(async () => {
  if (!isTauri) return;
  const appWindow = await currentWindow();
  await syncMaximized();
  unlistenResize = await appWindow.onResized(syncMaximized);
});

onUnmounted(() => unlistenResize?.());
</script>

<style scoped>
.window-chrome {
  height: 36px;
  flex: 0 0 36px;
  display: flex;
  align-items: center;
  user-select: none;
  background: var(--ktool-windowbar);
  border-bottom: 1px solid var(--ktool-border);
}
.window-brand {
  height: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 12px;
}
.window-brand-mark {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border-radius: 4px;
  color: #fff;
  background: var(--ktool-brand);
  font-size: 11px;
  font-weight: 750;
  line-height: 1;
}
.window-brand-name {
  color: var(--ktool-text);
  font-size: 12px;
  font-weight: 600;
}
.window-brand-mark,
.window-brand-name {
  pointer-events: none;
}
.window-drag-space {
  flex: 1;
  height: 100%;
}
.window-controls {
  height: 100%;
  display: flex;
}
.window-control {
  width: 46px;
  height: 100%;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 0;
  color: var(--ktool-text-soft);
  background: transparent;
  cursor: default;
  transition: background-color 150ms ease, color 150ms ease;
}
.window-control:hover {
  color: var(--ktool-text);
  background: var(--ktool-surface-3);
}
.window-control--close:hover {
  color: #fff;
  background: #c42b1c;
}
.control-minimize {
  width: 10px;
  height: 1px;
  background: currentColor;
}
.control-maximize {
  width: 10px;
  height: 10px;
  border: 1px solid currentColor;
}
.control-restore {
  position: relative;
  width: 9px;
  height: 9px;
  border: 1px solid currentColor;
}
.control-restore::before {
  content: "";
  position: absolute;
  width: 9px;
  height: 9px;
  left: -4px;
  top: 3px;
  border: 1px solid currentColor;
  background: var(--ktool-windowbar);
}
.control-close {
  position: relative;
  width: 12px;
  height: 12px;
}
.control-close::before,
.control-close::after {
  content: "";
  position: absolute;
  top: 5px;
  left: 0;
  width: 12px;
  height: 1px;
  background: currentColor;
}
.control-close::before { transform: rotate(45deg); }
.control-close::after { transform: rotate(-45deg); }
</style>
