<template>
  <ToolPage class="qr-decode-page">
    <ToolToolbar>
      <n-button size="small" @click="pickImage">
        <template #icon><n-icon><ImageOutline /></n-icon></template>
        选择图片
      </n-button>
      <n-button size="small" :disabled="!result" @click="copyResult">复制结果</n-button>
      <n-button size="small" @click="clearAll">清空</n-button>
      <template #side>
        <n-tag v-if="status" :type="statusType" size="small">{{ status }}</n-tag>
      </template>
    </ToolToolbar>

    <div class="qr-urlbar">
      <n-input
        v-model:value="urlInput"
        size="small"
        placeholder="粘贴图片地址 (http/https) 直接解码，例如 https://example.com/qr.png"
        clearable
        @keyup.enter="decodeUrl"
      >
        <template #prefix><n-icon size="15"><LinkOutline /></n-icon></template>
      </n-input>
      <n-button size="small" type="primary" :loading="loadingUrl" @click="decodeUrl">解码地址</n-button>
    </div>

    <div class="qr-decode-body">
      <div
        class="qr-drop"
        :class="{ 'is-over': dragOver }"
        @click="pickImage"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @drop.prevent="onDrop"
      >
        <img v-if="previewUrl" :src="previewUrl" class="qr-preview" alt="预览" />
        <div v-else class="qr-drop-hint">
          <n-icon size="34"><ImageOutline /></n-icon>
          <p>点击选择、拖拽图片，或粘贴地址解码</p>
          <span class="text-xs text-gray-400">支持 PNG / JPG / WEBP / BMP / GIF</span>
        </div>
      </div>

      <div class="qr-result" :class="{ empty: !result }">
        <div class="qr-result-head">解码结果</div>
        <pre v-if="result" class="qr-result-text">{{ result }}</pre>
        <span v-else class="qr-result-empty">尚未解码</span>
      </div>
    </div>
  </ToolPage>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from "vue";
import { NButton, NIcon, NInput, NTag, useMessage } from "naive-ui";
import { ImageOutline, LinkOutline } from "@vicons/ionicons5";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import jsQR from "jsqr";
import { parseHistoryInput, useToolHistory } from "@/composables/useToolHistory";

const message = useMessage();
const previewUrl = ref("");
const result = ref("");
const status = ref("");
const statusType = ref<"success" | "warning" | "error" | "default">("default");
const dragOver = ref(false);
const urlInput = ref("");
const loadingUrl = ref(false);
const history = useToolHistory("qr-decode", "二维码解码", (item) => {
  const saved = parseHistoryInput<{ url?: string }>(item.input);
  urlInput.value = saved?.url ?? "";
  result.value = item.output;
  status.value = "已从历史记录恢复";
  statusType.value = "success";
});

async function pickImage() {
  const selected = await open({
    multiple: false,
    filters: [{ name: "Image", extensions: ["png", "jpg", "jpeg", "webp", "bmp", "gif"] }],
  });
  if (typeof selected === "string") await loadPath(selected);
}

async function onDrop(e: DragEvent) {
  dragOver.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/") || file.size > 20 * 1024 * 1024) {
    message.error("请选择不超过 20 MB 的图片");
    return;
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const url = setPreviewBlob(new Blob([bytes]));
  await decodeFromUrl(url);
}

async function loadPath(path: string) {
  try {
    const bytes = await readFile(path);
    if (bytes.byteLength > 20 * 1024 * 1024) throw new Error("图片不能超过 20 MB");
    const url = setPreviewBlob(new Blob([bytes]));
    await decodeFromUrl(url);
  } catch (err) {
    message.error("读取图片失败");
    console.error(err);
  }
}

/** 按地址抓取图片并解码（图片字节由 Rust 侧 fetch，绕过 CSP） */
async function decodeUrl() {
  const u = urlInput.value.trim();
  if (!u) {
    message.warning("请先输入图片地址");
    return;
  }
  loadingUrl.value = true;
  status.value = "加载中…";
  statusType.value = "default";
  try {
    const bytes = await invoke<number[]>("fetch_image_bytes", { url: u });
    const blob = new Blob([new Uint8Array(bytes)]);
    const url = setPreviewBlob(blob);
    await decodeFromUrl(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    message.error(`图片加载失败：${msg}`);
    status.value = "加载失败";
    statusType.value = "error";
  } finally {
    loadingUrl.value = false;
  }
}

/** 按地址加载图片并解码 */
function decodeFromUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const max = 1400;
      let { width, height } = img;
      const scale = Math.min(1, max / Math.max(width, height)) || 1;
      width = Math.max(1, Math.floor(width * scale));
      height = Math.max(1, Math.floor(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        status.value = "无法解码";
        statusType.value = "error";
        resolve();
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const data = ctx.getImageData(0, 0, width, height);
      decodeImageData(data);
      resolve();
    };
    img.onerror = () => {
      message.error("图片加载失败");
      status.value = "图片加载失败";
      statusType.value = "error";
      resolve();
    };
    img.src = url;
  });
}

/** 在画布上解码 RGBA 图像数据 */
function decodeImageData(data: ImageData) {
  const code = jsQR(data.data, data.width, data.height);
  if (code) {
    result.value = code.data;
    status.value = "解码成功";
    statusType.value = "success";
    history.record({
      title: `解码 · ${code.data.slice(0, 48)}`,
      input: JSON.stringify({ url: urlInput.value.trim() }),
      output: code.data,
    });
    message.success("解码成功");
  } else {
    result.value = "";
    status.value = "未检测到二维码";
    statusType.value = "warning";
    message.warning("未检测到二维码，请换一张更清晰的图片或截图");
  }
}

async function copyResult() {
  if (!result.value) return;
  try {
    await navigator.clipboard.writeText(result.value);
    message.success("已复制");
  } catch {
    message.error("复制失败");
  }
}

function clearAll() {
  result.value = "";
  revokePreview();
  status.value = "";
}

function setPreviewBlob(blob: Blob): string {
  revokePreview();
  const url = URL.createObjectURL(blob);
  previewUrl.value = url;
  return url;
}

function revokePreview() {
  if (previewUrl.value.startsWith("blob:")) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = "";
}

onUnmounted(revokePreview);
</script>

<style scoped>
.qr-decode-page :deep(.tool-page-inner) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
}
.qr-urlbar {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.qr-urlbar .n-input {
  flex: 1 1 auto;
  min-width: 0;
}
.qr-decode-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}
.qr-drop {
  flex: 0 0 auto;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px dashed var(--ktool-border-strong);
  border-radius: var(--ktool-radius);
  background: var(--ktool-surface);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
  overflow: hidden;
}
.qr-drop:hover,
.qr-drop.is-over {
  border-color: var(--ktool-brand);
  background: var(--ktool-surface-hover);
}
.qr-drop-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--ktool-text-soft);
}
.qr-drop-hint p {
  margin: 0;
  font-size: 13px;
}
.qr-preview {
  max-width: 100%;
  max-height: 240px;
  object-fit: contain;
}
.qr-result {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ktool-border);
  border-radius: var(--ktool-radius);
  background: var(--ktool-surface);
  overflow: hidden;
}
.qr-result.empty {
  align-items: center;
  justify-content: center;
}
.qr-result-head {
  flex: 0 0 auto;
  padding: 7px 12px;
  border-bottom: 1px solid var(--ktool-border);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ktool-text-soft);
}
.qr-result-text {
  flex: 1;
  margin: 0;
  padding: 12px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
}
.qr-result-empty {
  color: var(--ktool-text-faint);
  font-size: 13px;
}
</style>
