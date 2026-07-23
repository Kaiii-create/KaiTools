<template>
  <ToolPage :padded="false">
    <ToolToolbar>
      <n-button type="primary" size="small" :loading="converting" :disabled="inputPaths.length === 0" @click="convert">
        开始转换
      </n-button>
      <n-button quaternary size="small" :disabled="converting" @click="clearAll">清空</n-button>
      <div class="flex-1" />
      <n-tag v-if="progressText" :type="resultPath ? 'success' : 'default'" size="small" round>{{ progressText }}</n-tag>
    </ToolToolbar>

    <div class="converter-body">
      <n-card title="转换类型" size="small">
        <n-radio-group v-model:value="conversion" name="document-conversion" :disabled="converting">
          <n-radio-button value="word-to-pdf">Word 转 PDF</n-radio-button>
          <n-radio-button value="pdf-to-word">PDF 转 Word</n-radio-button>
          <n-radio-button value="pdf-to-images">PDF 转图片</n-radio-button>
          <n-radio-button value="images-to-pdf">多图转 PDF</n-radio-button>
        </n-radio-group>
      </n-card>

      <n-card :title="conversion === 'images-to-pdf' ? '选择图片' : '选择源文件'" size="small">
        <button class="file-picker" type="button" :disabled="converting" @click="chooseInput">
          <n-icon :size="34"><DocumentIcon /></n-icon>
          <span class="file-title">{{ selectedTitle }}</span>
          <span class="file-path">{{ selectedDescription }}</span>
        </button>
      </n-card>

      <n-card v-if="conversion === 'pdf-to-images'" title="图片设置" size="small">
        <div class="settings-grid">
          <label>输出格式</label>
          <n-select v-model:value="imageFormat" :options="imageFormatOptions" size="small" />

          <label>清晰度</label>
          <n-select v-model:value="renderDpi" :options="dpiOptions" size="small" />

          <template v-if="imageFormat === 'jpeg'">
            <label>JPG 质量</label>
            <div class="slider-row">
              <n-slider v-model:value="imageQuality" :min="30" :max="100" :step="1" />
              <span>{{ imageQuality }}%</span>
            </div>
          </template>

          <label>页面范围</label>
          <div>
            <n-input v-model:value="pageRange" size="small" placeholder="留空表示全部，例如 1-3,5" />
            <div v-if="pdfPageCount" class="setting-tip">
              共 {{ pdfPageCount }} 页；每页单独保存到默认下载目录
            </div>
          </div>
        </div>
      </n-card>

      <n-card v-if="conversion === 'images-to-pdf'" title="PDF 页面设置" size="small">
        <div class="settings-grid">
          <label>页面尺寸</label>
          <n-select v-model:value="pdfPageSize" :options="pageSizeOptions" size="small" />

          <label>页边距</label>
          <n-select v-model:value="pdfMargin" :options="marginOptions" size="small" />

          <label>排列顺序</label>
          <span class="setting-copy">按选择文件时的顺序，每张图片生成一页</span>
        </div>
      </n-card>

      <n-card v-if="resultPath" title="输出文件" size="small">
        <div class="result-row">
          <n-icon :size="22"><CheckIcon /></n-icon>
          <div class="result-copy">
            <strong>{{ fileName(resultPath) }}</strong>
            <span>{{ resultPath }}</span>
          </div>
        </div>
      </n-card>
    </div>
  </ToolPage>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { join } from "@tauri-apps/api/path";
import { readFile, writeFile } from "@tauri-apps/plugin-fs";
import {
  NButton,
  NCard,
  NIcon,
  NInput,
  NRadioButton,
  NRadioGroup,
  NSelect,
  NSlider,
  NTag,
  useMessage,
} from "naive-ui";
import { CheckmarkCircleOutline as CheckIcon, DocumentTextOutline as DocumentIcon } from "@vicons/ionicons5";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import { downloadFile, ensureDownloadDirectory } from "@/lib/download";

type Conversion = "word-to-pdf" | "pdf-to-word" | "pdf-to-images" | "images-to-pdf";
type ImageFormat = "png" | "jpeg";
type PdfPageSize = "original" | "a4" | "letter";

const message = useMessage();
const conversion = ref<Conversion>("word-to-pdf");
const inputPaths = ref<string[]>([]);
const resultPath = ref("");
const progressText = ref("");
const converting = ref(false);
const pdfPageCount = ref(0);
const imageFormat = ref<ImageFormat>("png");
const imageQuality = ref(90);
const renderDpi = ref(150);
const pageRange = ref("");
const pdfPageSize = ref<PdfPageSize>("a4");
const pdfMargin = ref(10);
let pdfRendererPromise: Promise<typeof import("pdfjs-dist")> | null = null;

const configs = {
  "word-to-pdf": {
    chooseText: "点击选择 Word 文档",
    supportText: "支持 .doc、.docx",
    inputName: "Word 文档",
    inputExtensions: ["doc", "docx"],
    multiple: false,
    outputName: "PDF 文档",
    outputExtension: "pdf",
  },
  "pdf-to-word": {
    chooseText: "点击选择 PDF 文档",
    supportText: "支持 .pdf",
    inputName: "PDF 文档",
    inputExtensions: ["pdf"],
    multiple: false,
    outputName: "Word 文档",
    outputExtension: "docx",
  },
  "pdf-to-images": {
    chooseText: "点击选择 PDF 文档",
    supportText: "内置引擎，不依赖其他软件",
    inputName: "PDF 文档",
    inputExtensions: ["pdf"],
    multiple: false,
    outputName: "图片文件",
    outputExtension: "png",
  },
  "images-to-pdf": {
    chooseText: "点击选择一张或多张图片",
    supportText: "支持 PNG、JPG、WebP、BMP、GIF、SVG、ICO",
    inputName: "图片",
    inputExtensions: ["png", "jpg", "jpeg", "webp", "bmp", "gif", "svg", "ico"],
    multiple: true,
    outputName: "PDF 文档",
    outputExtension: "pdf",
  },
} as const;

const imageFormatOptions = [
  { label: "PNG（无损）", value: "png" },
  { label: "JPG（体积较小）", value: "jpeg" },
];
const dpiOptions = [
  { label: "96 DPI（屏幕预览）", value: 96 },
  { label: "150 DPI（推荐）", value: 150 },
  { label: "300 DPI（打印级）", value: 300 },
];
const pageSizeOptions = [
  { label: "A4（自动横竖）", value: "a4" },
  { label: "Letter（自动横竖）", value: "letter" },
  { label: "跟随图片尺寸", value: "original" },
];
const marginOptions = [
  { label: "无边距", value: 0 },
  { label: "10 mm", value: 10 },
  { label: "20 mm", value: 20 },
];

const currentConfig = computed(() => configs[conversion.value]);
const requiresWord = computed(() => conversion.value === "word-to-pdf" || conversion.value === "pdf-to-word");
const selectedTitle = computed(() => {
  if (inputPaths.value.length === 0) return currentConfig.value.chooseText;
  if (inputPaths.value.length === 1) return fileName(inputPaths.value[0]);
  return `已选择 ${inputPaths.value.length} 张图片`;
});
const selectedDescription = computed(() => {
  if (inputPaths.value.length === 0) return currentConfig.value.supportText;
  if (inputPaths.value.length === 1) {
    const pages = pdfPageCount.value ? ` · ${pdfPageCount.value} 页` : "";
    return `${inputPaths.value[0]}${pages}`;
  }
  return inputPaths.value.map(fileName).join("、");
});

watch(conversion, () => clearAll());

function fileName(path: string): string {
  return path.split(/[\\/]/).pop() || path;
}

function fileStem(path: string): string {
  return fileName(path).replace(/\.[^.]+$/, "") || "converted";
}

async function chooseInput() {
  const config = currentConfig.value;
  const selected = await open({
    multiple: config.multiple,
    directory: false,
    filters: [{ name: config.inputName, extensions: [...config.inputExtensions] }],
  });
  const paths = typeof selected === "string" ? [selected] : Array.isArray(selected) ? selected : [];
  if (paths.length === 0) return;
  inputPaths.value = paths;
  resultPath.value = "";
  progressText.value = "";
  pdfPageCount.value = 0;
  if (conversion.value === "pdf-to-images") {
    try {
      progressText.value = "正在读取 PDF";
      const bytes = await readFile(paths[0]);
      const pdfjs = await loadPdfRenderer();
      const loadingTask = pdfjs.getDocument({ data: bytes });
      const pdfDocument = await loadingTask.promise;
      pdfPageCount.value = pdfDocument.numPages;
      await loadingTask.destroy();
      progressText.value = "";
    } catch (error) {
      inputPaths.value = [];
      progressText.value = "";
      message.error(`PDF 无法读取：${errorMessage(error)}`);
    }
  }
}

async function convert() {
  if (inputPaths.value.length === 0 || converting.value) return;
  converting.value = true;
  resultPath.value = "";
  try {
    let completed = true;
    if (requiresWord.value) completed = await convertWithWord();
    else if (conversion.value === "pdf-to-images") completed = await convertPdfToImages();
    else await convertImagesToPdf();
    if (!completed) {
      progressText.value = "";
      return;
    }
    progressText.value = "转换完成";
    message.success("文档转换完成");
  } catch (error) {
    progressText.value = "转换失败";
    message.error(errorMessage(error));
  } finally {
    converting.value = false;
  }
}

async function convertWithWord() {
  const config = currentConfig.value;
  const outputDirectory = await ensureDownloadDirectory();
  if (!outputDirectory) return false;
  const outputPath = await join(
    outputDirectory,
    `${fileStem(inputPaths.value[0])}.${config.outputExtension}`,
  );
  progressText.value = "正在调用 Word";
  resultPath.value = await invoke<string>("convert_document", {
    inputPath: inputPaths.value[0],
    outputPath,
    conversion: conversion.value,
  });
  return true;
}

async function convertPdfToImages() {
  const outputDirectory = await ensureDownloadDirectory("选择图片保存文件夹");
  if (!outputDirectory) return false;

  progressText.value = "正在加载 PDF";
  const bytes = await readFile(inputPaths.value[0]);
  const pdfjs = await loadPdfRenderer();
  const loadingTask = pdfjs.getDocument({ data: bytes });
  const pdfDocument = await loadingTask.promise;
  try {
    const pages = parsePageRange(pageRange.value, pdfDocument.numPages);
    const extension = imageFormat.value === "jpeg" ? "jpg" : "png";
    const stem = fileStem(inputPaths.value[0]);
    let lastOutputPath = "";
    for (let index = 0; index < pages.length; index++) {
      const pageNumber = pages[index];
      progressText.value = `正在转换并保存第 ${pageNumber} 页（${index + 1}/${pages.length}）`;
      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: renderDpi.value / 72 });
      const width = Math.ceil(viewport.width);
      const height = Math.ceil(viewport.height);
      if (width * height > 45_000_000) throw new Error(`第 ${pageNumber} 页分辨率过高，请降低 DPI`);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: imageFormat.value === "png" });
      if (!context) throw new Error("无法创建 PDF 页面画布");
      if (imageFormat.value === "jpeg") {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
      }
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const mime = imageFormat.value === "jpeg" ? "image/jpeg" : "image/png";
      const blob = await canvasToBlob(canvas, mime, imageQuality.value / 100);
      const outputName = `${stem}-page-${String(pageNumber).padStart(3, "0")}.${extension}`;
      lastOutputPath = await join(outputDirectory, outputName);
      await writeFile(lastOutputPath, new Uint8Array(await blob.arrayBuffer()));
      page.cleanup();
      canvas.width = 1;
      canvas.height = 1;
      await nextPaint();
    }
    resultPath.value = pages.length === 1 ? lastOutputPath : outputDirectory;
    return true;
  } finally {
    await loadingTask.destroy();
  }
}

function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

async function convertImagesToPdf() {
  const { PDFDocument } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  for (let index = 0; index < inputPaths.value.length; index++) {
    const path = inputPaths.value[index];
    progressText.value = `正在处理图片 ${index + 1}/${inputPaths.value.length}`;
    const sourceBytes = await readFile(path);
    const extension = fileName(path).split(".").pop()?.toLowerCase();
    let embedded;
    let imageWidth: number;
    let imageHeight: number;
    if (extension === "jpg" || extension === "jpeg") {
      embedded = await pdf.embedJpg(sourceBytes);
      imageWidth = embedded.width;
      imageHeight = embedded.height;
    } else if (extension === "png") {
      embedded = await pdf.embedPng(sourceBytes);
      imageWidth = embedded.width;
      imageHeight = embedded.height;
    } else {
      const converted = await imageBytesToPng(sourceBytes, extension || "png");
      embedded = await pdf.embedPng(converted.bytes);
      imageWidth = converted.width;
      imageHeight = converted.height;
    }

    const margin = (pdfMargin.value * 72) / 25.4;
    let [pageWidth, pageHeight] = resolvePageSize(pdfPageSize.value, imageWidth, imageHeight, margin);
    if (pdfPageSize.value !== "original" && (imageWidth > imageHeight) !== (pageWidth > pageHeight)) {
      [pageWidth, pageHeight] = [pageHeight, pageWidth];
    }
    const usableWidth = Math.max(1, pageWidth - margin * 2);
    const usableHeight = Math.max(1, pageHeight - margin * 2);
    const scale = Math.min(usableWidth / imageWidth, usableHeight / imageHeight);
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;
    const page = pdf.addPage([pageWidth, pageHeight]);
    page.drawImage(embedded, {
      x: (pageWidth - drawWidth) / 2,
      y: (pageHeight - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    });
  }

  progressText.value = "正在生成 PDF";
  const output = await pdf.save();
  resultPath.value = await downloadFile(
    `${fileStem(inputPaths.value[0])}.pdf`,
    new Blob([copyToArrayBuffer(output)], { type: "application/pdf" }),
  );
}

function parsePageRange(value: string, totalPages: number): number[] {
  const normalized = value.trim().replace(/，/g, ",");
  if (!normalized) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages = new Set<number>();
  for (const part of normalized.split(",")) {
    const token = part.trim();
    if (!token) continue;
    const range = token.match(/^(\d+)\s*-\s*(\d+)$/);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start < 1 || end > totalPages || start > end) throw new Error(`无效页面范围：${token}`);
      for (let page = start; page <= end; page++) pages.add(page);
    } else if (/^\d+$/.test(token)) {
      const page = Number(token);
      if (page < 1 || page > totalPages) throw new Error(`页码超出范围：${page}`);
      pages.add(page);
    } else {
      throw new Error(`无法识别页面范围：${token}`);
    }
  }
  if (pages.size === 0) throw new Error("请填写有效的页面范围");
  return [...pages].sort((a, b) => a - b);
}

function resolvePageSize(size: PdfPageSize, width: number, height: number, margin: number): [number, number] {
  if (size === "a4") return [595.28, 841.89];
  if (size === "letter") return [612, 792];
  const widthPoints = Math.min(14_400, Math.max(72, (width * 72) / 96 + margin * 2));
  const heightPoints = Math.min(14_400, Math.max(72, (height * 72) / 96 + margin * 2));
  return [widthPoints, heightPoints];
}

async function imageBytesToPng(
  bytes: Uint8Array,
  extension: string,
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const mimeTypes: Record<string, string> = {
    webp: "image/webp",
    bmp: "image/bmp",
    gif: "image/gif",
    svg: "image/svg+xml",
    ico: "image/x-icon",
  };
  const blob = new Blob([copyToArrayBuffer(bytes)], { type: mimeTypes[extension] || "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("无法创建图片画布");
    context.drawImage(image, 0, 0);
    const png = await canvasToBlob(canvas, "image/png", 1);
    return { bytes: new Uint8Array(await png.arrayBuffer()), width: canvas.width, height: canvas.height };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片无法读取或编码不受支持"));
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("图片编码失败"))), mime, quality);
  });
}

function copyToArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function loadPdfRenderer() {
  if (!pdfRendererPromise) {
    pdfRendererPromise = import("pdfjs-dist").then((module) => {
      module.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      return module;
    });
  }
  return pdfRendererPromise;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function clearAll() {
  if (converting.value) return;
  inputPaths.value = [];
  resultPath.value = "";
  progressText.value = "";
  pdfPageCount.value = 0;
  pageRange.value = "";
}
</script>

<style scoped>
.converter-body {
  width: min(820px, 100%);
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.file-picker {
  width: 100%;
  min-height: 180px;
  border: 1px dashed var(--ktool-border-strong);
  border-radius: var(--ktool-radius-lg);
  background: var(--ktool-surface-inset);
  color: var(--ktool-text-soft);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: border-color var(--ktool-duration), background var(--ktool-duration);
}

.file-picker:hover:not(:disabled) {
  border-color: var(--ktool-brand);
  background: var(--ktool-brand-soft);
}

.file-picker:disabled {
  cursor: wait;
  opacity: 0.65;
}

.file-title {
  color: var(--ktool-text);
  font-size: 15px;
  font-weight: 600;
}

.file-path {
  max-width: 90%;
  color: var(--ktool-text-mute);
  font-size: 12px;
  overflow-wrap: anywhere;
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

.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-row :deep(.n-slider) {
  flex: 1;
}

.slider-row span,
.setting-copy,
.setting-tip {
  color: var(--ktool-text-mute);
  font-size: 12px;
}

.setting-tip {
  margin-top: 5px;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--ktool-success);
}

.result-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.result-copy strong {
  color: var(--ktool-text);
}

.result-copy span {
  color: var(--ktool-text-mute);
  font-size: 12px;
  overflow-wrap: anywhere;
}

@media (max-width: 720px) {
  .settings-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}
</style>
