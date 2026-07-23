<template>
  <ToolPage :padded="false">
    <ToolToolbar>
      <n-button type="primary" size="small" :disabled="!imageLoaded" :loading="converting" @click="onConvert">
        开始转换
      </n-button>
      <n-button quaternary size="small" :disabled="!converted" @click="onDownload">下载图片</n-button>
      <n-button quaternary size="small" @click="onClear">清空</n-button>
      <div class="flex-1" />
      <n-tag v-if="status" :type="statusType" size="small" round>{{ status }}</n-tag>
    </ToolToolbar>

    <div class="converter-layout">
      <n-card title="选择图片" size="small">
        <div
          class="upload-area"
          @click="triggerUpload"
          @dragover.prevent
          @drop.prevent="onDrop"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.bmp,.gif,.svg,.ico,image/*"
            hidden
            @change="onFileSelect"
          />
          <template v-if="!imageLoaded">
            <n-icon :size="36"><UploadIcon /></n-icon>
            <strong>点击或拖拽图片到这里</strong>
            <span>支持 PNG、JPG、WebP、BMP、GIF、SVG、ICO</span>
          </template>
          <template v-else>
            <img :src="sourcePreviewUrl" alt="源图片预览" />
            <strong>{{ sourceFile?.name }}</strong>
            <span>{{ sourceFormat }} · {{ originalWidth }} × {{ originalHeight }} · {{ formatBytes(sourceFile?.size || 0) }}</span>
          </template>
        </div>
      </n-card>

      <n-card title="输出设置" size="small">
        <div class="settings-grid">
          <label>输出格式</label>
          <n-select v-model:value="outputFormat" :options="formatOptions" size="small" />

          <label>输出尺寸</label>
          <div class="size-row">
            <n-input-number
              :value="outputWidth"
              :min="1"
              :max="8192"
              size="small"
              @update:value="updateWidth"
            />
            <span>×</span>
            <n-input-number
              :value="outputHeight"
              :min="1"
              :max="8192"
              size="small"
              @update:value="updateHeight"
            />
            <n-checkbox v-model:checked="keepRatio">保持比例</n-checkbox>
            <n-button size="tiny" quaternary :disabled="!imageLoaded" @click="restoreSize">原尺寸</n-button>
          </div>

          <template v-if="outputFormat === 'jpeg' || outputFormat === 'webp'">
            <label>图片质量</label>
            <div class="quality-row">
              <n-slider v-model:value="quality" :min="10" :max="100" :step="1" />
              <span>{{ quality }}%</span>
            </div>
          </template>

          <template v-if="outputFormat === 'jpeg' || outputFormat === 'bmp'">
            <label>透明背景</label>
            <div class="background-row">
              <n-color-picker v-model:value="backgroundColor" :show-alpha="false" :modes="['hex']" size="small" />
              <span>JPG、BMP 不支持透明，将使用该背景色</span>
            </div>
          </template>

          <template v-if="outputFormat === 'ico'">
            <label>ICO 尺寸</label>
            <n-select
              v-model:value="icoSizes"
              :options="icoSizeOptions"
              multiple
              size="small"
              placeholder="至少选择一个尺寸"
            />
          </template>
        </div>
      </n-card>

      <n-alert v-if="sourceFormat === 'GIF'" type="warning" :show-icon="true">
        GIF 将作为静态图片转换，当前版本不保留动画。
      </n-alert>

      <n-card v-if="converted" title="转换结果" size="small">
        <div class="result-panel">
          <div class="result-preview checkerboard">
            <img v-if="outputPreviewUrl" :src="outputPreviewUrl" alt="转换结果预览" />
            <n-icon v-else :size="48"><ImageIcon /></n-icon>
          </div>
          <div class="result-meta">
            <strong>{{ outputFileName }}</strong>
            <span>{{ outputLabel }} · {{ formatBytes(outputBytes) }}</span>
            <span v-if="outputFormat === 'ico'">包含 {{ icoSizes.length }} 个图标尺寸</span>
          </div>
        </div>
      </n-card>
    </div>
  </ToolPage>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import {
  NAlert,
  NButton,
  NCard,
  NCheckbox,
  NColorPicker,
  NIcon,
  NInputNumber,
  NSelect,
  NSlider,
  NTag,
  useMessage,
} from "naive-ui";
import { CloudUploadOutline as UploadIcon, ImageOutline as ImageIcon } from "@vicons/ionicons5";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import { downloadFile } from "@/lib/download";

type OutputFormat = "png" | "jpeg" | "webp" | "bmp" | "ico";

const message = useMessage();
const fileInput = ref<HTMLInputElement | null>(null);
const sourceFile = ref<File | null>(null);
const sourceImage = ref<HTMLImageElement | null>(null);
const sourcePreviewUrl = ref("");
const outputPreviewUrl = ref("");
const imageLoaded = ref(false);
const converted = ref(false);
const converting = ref(false);
const outputBlob = ref<Blob | null>(null);
const outputBytes = ref(0);
const originalWidth = ref(0);
const originalHeight = ref(0);
const outputWidth = ref(0);
const outputHeight = ref(0);
const keepRatio = ref(true);
const outputFormat = ref<OutputFormat>("png");
const quality = ref(90);
const backgroundColor = ref("#ffffff");
const icoSizes = ref<number[]>([16, 32, 48, 128, 256]);
const status = ref("");
const statusType = ref<"success" | "error" | "default">("default");

const formatOptions = [
  { label: "PNG（支持透明）", value: "png" },
  { label: "JPG / JPEG", value: "jpeg" },
  { label: "WebP", value: "webp" },
  { label: "BMP", value: "bmp" },
  { label: "ICO（多尺寸图标）", value: "ico" },
];

const icoSizeOptions = [16, 24, 32, 48, 64, 128, 256].map((size) => ({
  label: `${size} × ${size}`,
  value: size,
}));

const sourceFormat = computed(() => {
  const extension = sourceFile.value?.name.split(".").pop()?.toUpperCase();
  return extension === "JPEG" ? "JPG" : extension || "图片";
});

const outputExtension = computed(() => (outputFormat.value === "jpeg" ? "jpg" : outputFormat.value));
const outputLabel = computed(() => outputExtension.value.toUpperCase());
const outputFileName = computed(() => {
  const name = sourceFile.value?.name || "image";
  const stem = name.replace(/\.[^.]+$/, "") || "image";
  return `${stem}.${outputExtension.value}`;
});

watch([outputFormat, outputWidth, outputHeight, quality, backgroundColor, icoSizes], invalidateOutput, {
  deep: true,
});

function triggerUpload() {
  fileInput.value?.click();
}

function onFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) loadFile(file);
}

function onDrop(event: DragEvent) {
  const file = event.dataTransfer?.files[0];
  if (file) loadFile(file);
}

function isSupportedFile(file: File): boolean {
  return /\.(png|jpe?g|webp|bmp|gif|svg|ico)$/i.test(file.name);
}

function loadFile(file: File) {
  if (!isSupportedFile(file)) {
    message.error("暂不支持该图片格式");
    return;
  }

  revokeSourcePreview();
  revokeOutputPreview();
  resetResult();
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    sourceFile.value = file;
    sourceImage.value = image;
    sourcePreviewUrl.value = url;
    originalWidth.value = image.naturalWidth;
    originalHeight.value = image.naturalHeight;
    outputWidth.value = image.naturalWidth;
    outputHeight.value = image.naturalHeight;
    imageLoaded.value = true;
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    message.error("图片无法读取，可能文件已损坏或当前系统不支持该编码");
  };
  image.src = url;
}

function updateWidth(value: number | null) {
  if (!value) return;
  outputWidth.value = Math.round(value);
  if (keepRatio.value && originalWidth.value) {
    outputHeight.value = Math.max(1, Math.round((value * originalHeight.value) / originalWidth.value));
  }
}

function updateHeight(value: number | null) {
  if (!value) return;
  outputHeight.value = Math.round(value);
  if (keepRatio.value && originalHeight.value) {
    outputWidth.value = Math.max(1, Math.round((value * originalWidth.value) / originalHeight.value));
  }
}

function restoreSize() {
  outputWidth.value = originalWidth.value;
  outputHeight.value = originalHeight.value;
}

function createCanvas(width: number, height: number, fillBackground: boolean): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: outputFormat.value === "bmp" });
  if (!context || !sourceImage.value) throw new Error("无法创建图片画布");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  if (fillBackground) {
    context.fillStyle = backgroundColor.value;
    context.fillRect(0, 0, width, height);
  } else {
    context.clearRect(0, 0, width, height);
  }
  context.drawImage(sourceImage.value, 0, 0, width, height);
  return canvas;
}

async function onConvert() {
  if (!sourceImage.value || converting.value) return;
  const width = Math.min(8192, Math.max(1, Math.round(outputWidth.value)));
  const height = Math.min(8192, Math.max(1, Math.round(outputHeight.value)));
  if (outputFormat.value === "ico" && icoSizes.value.length === 0) {
    message.warning("请至少选择一个 ICO 尺寸");
    return;
  }

  converting.value = true;
  status.value = "转换中";
  statusType.value = "default";
  revokeOutputPreview();
  try {
    const flatten = outputFormat.value === "jpeg" || outputFormat.value === "bmp";
    const canvas = createCanvas(width, height, flatten);
    let blob: Blob;
    if (outputFormat.value === "ico") {
      const icoBytes = await createIco(canvas, icoSizes.value);
      const icoBuffer = new ArrayBuffer(icoBytes.byteLength);
      new Uint8Array(icoBuffer).set(icoBytes);
      blob = new Blob([icoBuffer], { type: "image/x-icon" });
    } else if (outputFormat.value === "bmp") {
      blob = encodeBmp(canvas);
    } else {
      const mime = outputFormat.value === "jpeg" ? "image/jpeg" : `image/${outputFormat.value}`;
      blob = await canvasToBlob(canvas, mime, quality.value / 100);
    }

    outputBlob.value = blob;
    outputBytes.value = blob.size;
    outputPreviewUrl.value = outputFormat.value === "ico" ? "" : URL.createObjectURL(blob);
    converted.value = true;
    status.value = "转换成功";
    statusType.value = "success";
  } catch (error) {
    resetResult();
    status.value = "转换失败";
    statusType.value = "error";
    message.error(error instanceof Error ? error.message : String(error));
  } finally {
    converting.value = false;
  }
}

async function createIco(source: HTMLCanvasElement, selectedSizes: number[]): Promise<Uint8Array> {
  const sizes = [...new Set(selectedSizes)]
    .filter((size) => Number.isInteger(size) && size >= 16 && size <= 256)
    .sort((a, b) => a - b);
  if (sizes.length === 0) throw new Error("没有有效的 ICO 尺寸");

  const images: Uint8Array[] = [];
  for (const size of sizes) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("无法创建 ICO 画布");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    const scale = Math.min(size / source.width, size / source.height);
    const width = source.width * scale;
    const height = source.height * scale;
    context.drawImage(source, (size - width) / 2, (size - height) / 2, width, height);
    images.push(new Uint8Array(await (await canvasToBlob(canvas, "image/png", 1)).arrayBuffer()));
  }

  const headerSize = 6 + sizes.length * 16;
  const totalSize = headerSize + images.reduce((sum, image) => sum + image.length, 0);
  const result = new Uint8Array(totalSize);
  const view = new DataView(result.buffer);
  view.setUint16(0, 0, true);
  view.setUint16(2, 1, true);
  view.setUint16(4, sizes.length, true);
  let offset = headerSize;
  sizes.forEach((size, index) => {
    const entry = 6 + index * 16;
    result[entry] = size === 256 ? 0 : size;
    result[entry + 1] = size === 256 ? 0 : size;
    result[entry + 2] = 0;
    result[entry + 3] = 0;
    view.setUint16(entry + 4, 1, true);
    view.setUint16(entry + 6, 32, true);
    view.setUint32(entry + 8, images[index].length, true);
    view.setUint32(entry + 12, offset, true);
    result.set(images[index], offset);
    offset += images[index].length;
  });
  return result;
}

function encodeBmp(canvas: HTMLCanvasElement): Blob {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("无法读取图片像素");
  const { width, height } = canvas;
  const pixels = context.getImageData(0, 0, width, height).data;
  const rowSize = Math.floor((width * 24 + 31) / 32) * 4;
  const pixelSize = rowSize * height;
  const buffer = new ArrayBuffer(54 + pixelSize);
  const view = new DataView(buffer);
  view.setUint16(0, 0x4d42, true);
  view.setUint32(2, buffer.byteLength, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelSize, true);
  const bytes = new Uint8Array(buffer);
  for (let y = 0; y < height; y++) {
    const sourceY = height - 1 - y;
    const rowOffset = 54 + y * rowSize;
    for (let x = 0; x < width; x++) {
      const source = (sourceY * width + x) * 4;
      const target = rowOffset + x * 3;
      bytes[target] = pixels[source + 2];
      bytes[target + 1] = pixels[source + 1];
      bytes[target + 2] = pixels[source];
    }
  }
  return new Blob([buffer], { type: "image/bmp" });
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, imageQuality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("当前系统不支持该输出格式"))),
      mime,
      imageQuality,
    );
  });
}

async function onDownload() {
  if (!outputBlob.value) return;
  try {
    const path = await downloadFile(outputFileName.value, outputBlob.value);
    message.success(`已保存到 ${path}`);
  } catch (error) {
    message.error(error instanceof Error ? error.message : "保存失败");
  }
}

function invalidateOutput() {
  if (!converted.value) return;
  revokeOutputPreview();
  resetResult();
  status.value = "设置已更改，请重新转换";
  statusType.value = "default";
}

function resetResult() {
  converted.value = false;
  outputBlob.value = null;
  outputBytes.value = 0;
}

function onClear() {
  revokeSourcePreview();
  revokeOutputPreview();
  sourceFile.value = null;
  sourceImage.value = null;
  imageLoaded.value = false;
  originalWidth.value = 0;
  originalHeight.value = 0;
  outputWidth.value = 0;
  outputHeight.value = 0;
  status.value = "";
  resetResult();
  if (fileInput.value) fileInput.value.value = "";
}

function revokeSourcePreview() {
  if (sourcePreviewUrl.value) URL.revokeObjectURL(sourcePreviewUrl.value);
  sourcePreviewUrl.value = "";
}

function revokeOutputPreview() {
  if (outputPreviewUrl.value) URL.revokeObjectURL(outputPreviewUrl.value);
  outputPreviewUrl.value = "";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

onUnmounted(() => {
  revokeSourcePreview();
  revokeOutputPreview();
});
</script>

<style scoped>
.converter-layout {
  width: min(880px, 100%);
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-area {
  min-height: 220px;
  border: 1px dashed var(--ktool-border-strong);
  border-radius: var(--ktool-radius-lg);
  background: var(--ktool-surface-inset);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--ktool-text-mute);
  cursor: pointer;
  transition: border-color var(--ktool-duration), background var(--ktool-duration);
}

.upload-area:hover {
  border-color: var(--ktool-brand);
  background: var(--ktool-brand-soft);
}

.upload-area img {
  max-width: 100%;
  max-height: 150px;
  object-fit: contain;
}

.upload-area strong {
  color: var(--ktool-text);
}

.upload-area span {
  font-size: 12px;
}

.settings-grid {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  align-items: center;
  gap: 14px 12px;
}

.settings-grid > label {
  color: var(--ktool-text-soft);
  font-size: 12px;
}

.size-row,
.quality-row,
.background-row {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.size-row :deep(.n-input-number) {
  width: 120px;
}

.quality-row :deep(.n-slider) {
  flex: 1;
}

.quality-row > span {
  width: 44px;
  color: var(--ktool-text-soft);
  font-size: 12px;
  text-align: right;
}

.background-row :deep(.n-color-picker) {
  width: 150px;
}

.background-row > span {
  color: var(--ktool-text-mute);
  font-size: 12px;
}

.result-panel {
  display: flex;
  align-items: center;
  gap: 18px;
}

.result-preview {
  width: 150px;
  height: 110px;
  border: 1px solid var(--ktool-border);
  border-radius: var(--ktool-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ktool-text-mute);
  overflow: hidden;
}

.result-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.checkerboard {
  background-color: #fff;
  background-image:
    linear-gradient(45deg, #e8e8e8 25%, transparent 25%),
    linear-gradient(-45deg, #e8e8e8 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e8e8e8 75%),
    linear-gradient(-45deg, transparent 75%, #e8e8e8 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}

.result-meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.result-meta strong {
  color: var(--ktool-text);
}

.result-meta span {
  color: var(--ktool-text-mute);
  font-size: 12px;
}

@media (max-width: 720px) {
  .settings-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .size-row,
  .background-row {
    flex-wrap: wrap;
  }
}
</style>
