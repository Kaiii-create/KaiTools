<template>
  <ToolPage>
    <!-- 工具栏 -->
    <ToolToolbar>
      <n-button type="primary" size="small" :disabled="!imageLoaded" @click="onConvert">转换为 ICO</n-button>
      <n-button quaternary size="small" :disabled="!converted" @click="onDownload">下载 ICO</n-button>
      <n-button quaternary size="small" @click="onClear">清空</n-button>
      <div class="flex-1" />
      <n-tag v-if="status" :type="statusType" size="small" round>
        {{ status }}
      </n-tag>
    </ToolToolbar>

    <!-- 配置区 -->
    <div class="config-panel flex-1 overflow-auto p-4">
      <n-space vertical :size="16">
        <!-- 上传 -->
        <n-card title="上传图片" size="small">
          <div
            class="upload-area w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
            @click="triggerUpload"
            @dragover.prevent
            @drop.prevent="onDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="onFileSelect"
            />
            <div v-if="!imageLoaded" class="text-center">
              <n-icon size="32" class="mx-auto text-gray-400">
                <UploadIcon />
              </n-icon>
              <div class="mt-2 text-sm text-gray-500">点击或拖拽上传图片</div>
              <div class="text-xs text-gray-400 mt-1">支持 PNG/JPG/JPEG/GIF/WebP</div>
            </div>
            <img v-else :src="previewUrl" class="max-w-full max-h-full object-contain rounded" />
          </div>
        </n-card>

        <!-- 尺寸配置 -->
        <n-card title="ICO 尺寸配置" size="small">
          <n-space vertical :size="12">
            <div class="row">
              <span class="label">选择尺寸</span>
              <n-select
                v-model:value="selectedSizes"
                :options="sizeOptions"
                multiple
                size="small"
                style="flex: 1"
              />
            </div>
            <div class="row">
              <span class="label">自定义尺寸</span>
              <n-input-number v-model:value="customSize" :min="16" :max="512" size="small" />
              <n-button size="small" @click="addCustomSize">添加</n-button>
            </div>
            <n-text depth="3" style="font-size: 12px">
              提示：多选尺寸会生成包含多个分辨率的 ICO 文件，兼容性更好
            </n-text>
          </n-space>
        </n-card>

        <!-- 预览 -->
        <n-card v-if="converted" title="预览" size="small">
          <div class="flex flex-wrap gap-4">
            <div
              v-for="size in selectedSizes"
              :key="size"
              class="flex flex-col items-center"
            >
              <div
                class="border border-gray-300 rounded"
                :style="{ width: `${size}px`, height: `${size}px` }"
              >
                <img :src="previewUrl" :width="size" :height="size" />
              </div>
              <span class="text-xs mt-1">{{ size }}x{{ size }}</span>
            </div>
          </div>
        </n-card>
      </n-space>
    </div>
  </ToolPage>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { NButton, NCard, NSpace, NSelect, NInputNumber, NTag, NText, NIcon, useMessage } from "naive-ui";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import { CloudUploadOutline as UploadIcon } from "@vicons/ionicons5";
import { downloadFile } from "@/lib/download";

const message = useMessage();

const fileInput = ref<HTMLInputElement | null>(null);
const previewUrl = ref("");
const imageLoaded = ref(false);
const converted = ref(false);
const icoBlob = ref<Blob | null>(null);
const status = ref("");
const statusType = ref<"success" | "error" | "default">("default");

const sizeOptions = [
  { label: "16x16", value: 16 },
  { label: "24x24", value: 24 },
  { label: "32x32", value: 32 },
  { label: "48x48", value: 48 },
  { label: "64x64", value: 64 },
  { label: "128x128", value: 128 },
  { label: "256x256", value: 256 },
];

const selectedSizes = ref<number[]>([16, 32, 48, 256]);
const customSize = ref(64);

function triggerUpload() {
  fileInput.value?.click();
}

function onFileSelect(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) processFile(file);
}

function onDrop(e: DragEvent) {
  const file = e.dataTransfer?.files[0];
  if (file && file.type.startsWith("image/")) processFile(file);
}

function processFile(file: File) {
  previewUrl.value = URL.createObjectURL(file);
  imageLoaded.value = true;
  converted.value = false;
  status.value = "";
}

function addCustomSize() {
  if (customSize.value && !selectedSizes.value.includes(customSize.value)) {
    selectedSizes.value.push(customSize.value);
  }
}

async function onConvert() {
  if (!previewUrl.value) return;
  try {
    const icoData = await createIco();
    icoBlob.value = new Blob([icoData.buffer as ArrayBuffer], { type: "image/x-icon" });
    converted.value = true;
    status.value = "转换成功";
    statusType.value = "success";
  } catch (e) {
    status.value = "转换失败";
    statusType.value = "error";
    message.error((e as Error).message);
  }
}

async function createIco(): Promise<Uint8Array> {
  const image = await loadImage(previewUrl.value);
  const sizes = [...new Set(selectedSizes.value)].sort((a, b) => a - b);
  const headers: Uint8Array[] = [];
  const data: Uint8Array[] = [];
  let offset = 6 + sizes.length * 16;

  for (const size of sizes) {
    const resized = await resizeImage(image, size, size);
    const png = await canvasToPng(resized);
    const width = size <= 256 ? size : 0;
    const height = size <= 256 ? size : 0;
    const bitsPerPixel = 32;
    const bytesInRes = png.length;

    const header = new Uint8Array(16);
    header[0] = width;
    header[1] = height;
    header[2] = 0;
    header[3] = 0;
    header[4] = 1;
    header[5] = 0;
    header[6] = bitsPerPixel;
    header[7] = 0;
    writeUInt32LE(header, 8, bytesInRes);
    writeUInt32LE(header, 12, offset);

    headers.push(header);
    data.push(png);
    offset += bytesInRes;
  }

  const header = new Uint8Array(6);
  header[0] = 0;
  header[1] = 0;
  header[2] = 1;
  header[3] = 0;
  header[4] = sizes.length;
  header[5] = 0;

  return concat([header, ...headers, ...data]);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = src;
  });
}

function resizeImage(img: HTMLImageElement, width: number, height: number): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);
    resolve(canvas);
  });
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
      reader.readAsArrayBuffer(blob!);
    }, "image/png");
  });
}

function writeUInt32LE(arr: Uint8Array, offset: number, value: number) {
  arr[offset] = value & 0xff;
  arr[offset + 1] = (value >> 8) & 0xff;
  arr[offset + 2] = (value >> 16) & 0xff;
  arr[offset + 3] = (value >> 24) & 0xff;
}

function concat(arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

async function onDownload() {
  if (!icoBlob.value) return;
  try {
    const path = await downloadFile(`icon-${Date.now()}.ico`, icoBlob.value);
    message.success(`已下载到 ${path}`);
  } catch (e) {
    message.error((e as Error).message || "下载失败");
  }
}

function onClear() {
  previewUrl.value = "";
  imageLoaded.value = false;
  converted.value = false;
  icoBlob.value = null;
  status.value = "";
  if (fileInput.value) fileInput.value.value = "";
}
</script>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.label {
  font-size: 12px;
  color: #6b7280;
  width: 80px;
  flex-shrink: 0;
}
</style>
