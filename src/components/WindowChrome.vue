<template>
  <header
    class="window-chrome"
    data-tauri-drag-region
    @dblclick="toggleMaximize"
  >
    <div class="window-brand" data-tauri-drag-region>
      <img class="window-brand-mark" :src="appIcon" alt="" draggable="false" />
      <span class="window-brand-name">KTool</span>
    </div>

    <div class="window-drag-space" data-tauri-drag-region />

    <div class="window-controls" @dblclick.stop>
      <button class="window-control" aria-label="最小化" title="最小化" @click="minimize">
        <n-icon :size="16"><RemoveOutline /></n-icon>
      </button>
      <button
        class="window-control"
        :aria-label="maximized ? '还原' : '最大化'"
        :title="maximized ? '还原' : '最大化'"
        @click="toggleMaximize"
      >
        <n-icon :size="14">
          <CopyOutline v-if="maximized" />
          <SquareOutline v-else />
        </n-icon>
      </button>
      <button class="window-control window-control--close" aria-label="关闭" title="关闭" @click="close">
        <n-icon :size="17"><CloseOutline /></n-icon>
      </button>
    </div>
  </header>

  <!-- 关闭方式选择弹窗 -->
  <div v-if="showCloseDialog" class="close-mask" @click.self="showCloseDialog = false">
    <div class="close-dialog">
      <div class="close-dialog-title">关闭 KTool</div>
      <div class="close-dialog-desc">请选择关闭方式：</div>
      <button class="close-option" @click="chooseMinimize">
        <span class="close-option-name">最小化到托盘</span>
        <span class="close-option-sub">在后台运行，可从托盘或 Alt+Space 唤出</span>
      </button>
      <button class="close-option" @click="chooseQuit">
        <span class="close-option-name">直接退出</span>
        <span class="close-option-sub">完全关闭应用程序</span>
      </button>
      <label class="close-noask">
        <input type="checkbox" v-model="noAskAgain" />
        <span>不再提示（按我的选择记住）</span>
      </label>
      <button class="close-cancel" @click="showCloseDialog = false">取消</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { NIcon } from "naive-ui";
import { invoke } from "@tauri-apps/api/core";
import {
  CloseOutline,
  CopyOutline,
  RemoveOutline,
  SquareOutline,
} from "@vicons/ionicons5";
import appIcon from "@/assets/brand/ktool-app-icon-ui.png";
import { useSettingsStore } from "@/stores/settings";

const emit = defineEmits<{ (e: "maximized-change", value: boolean): void }>();
const settings = useSettingsStore();
const maximized = ref(false);
const isTauri = "__TAURI_INTERNALS__" in window;
const showCloseDialog = ref(false);
const noAskAgain = ref(false);
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

async function doHide() {
  await (await currentWindow()).hide();
}

async function doQuit() {
  await invoke("quit_app");
}

async function close() {
  if (!isTauri) return;
  const mode = settings.data.closeBehavior;
  if (mode === "minimize") {
    await doHide();
    return;
  }
  if (mode === "quit") {
    await doQuit();
    return;
  }
  // ask：弹窗询问
  showCloseDialog.value = true;
}

async function chooseMinimize() {
  if (noAskAgain.value) settings.setCloseBehavior("minimize");
  showCloseDialog.value = false;
  await doHide();
}

async function chooseQuit() {
  if (noAskAgain.value) settings.setCloseBehavior("quit");
  showCloseDialog.value = false;
  await doQuit();
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
  width: 22px;
  height: 22px;
  object-fit: contain;
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
.close-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.45);
}
.close-dialog {
  width: 320px;
  padding: 20px;
  border-radius: 12px;
  background: var(--ktool-surface);
  border: 1px solid var(--ktool-border);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
  color: var(--ktool-text);
}
.close-dialog-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 6px;
}
.close-dialog-desc {
  font-size: 12px;
  color: var(--ktool-text-mute);
  margin-bottom: 14px;
}
.close-option {
  width: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  margin-bottom: 8px;
  border: 1px solid var(--ktool-border);
  border-radius: 9px;
  background: var(--ktool-surface-2);
  color: var(--ktool-text);
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease;
}
.close-option:hover {
  border-color: var(--ktool-brand);
  background: var(--ktool-surface-3);
}
.close-option-name {
  font-size: 13px;
  font-weight: 600;
}
.close-option-sub {
  font-size: 11px;
  color: var(--ktool-text-mute);
}
.close-noask {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--ktool-text-soft);
  margin: 6px 2px 14px;
  cursor: pointer;
  user-select: none;
}
.close-noask input {
  accent-color: var(--ktool-brand);
}
.close-cancel {
  width: 100%;
  padding: 9px;
  border: 0;
  border-radius: 9px;
  background: var(--ktool-surface-3);
  color: var(--ktool-text-soft);
  font-size: 13px;
  cursor: pointer;
}
.close-cancel:hover {
  color: var(--ktool-text);
}
</style>
