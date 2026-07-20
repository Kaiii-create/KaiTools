<template>
  <div class="qrcode flex h-full">
    <!-- 左侧：输入 + 配置 -->
    <div class="left-panel w-[340px] flex flex-col border-r border-gray-200 dark:border-gray-700">
      <ToolToolbar>
        <n-button size="small" type="primary" :disabled="!input" @click="onDownload">下载 PNG</n-button>
        <n-button size="small" quaternary @click="onClear">清空</n-button>
        <div class="flex-1" />
        <n-tag size="small" round type="info">实时预览</n-tag>
      </ToolToolbar>

      <div class="flex-1 overflow-y-auto p-3">
        <n-space vertical :size="16">
          <!-- 内容 -->
          <n-card title="内容" size="small">
            <n-input
              v-model:value="input"
              type="textarea"
              placeholder="输入文本或 URL，自动生成"
              :rows="3"
            />
          </n-card>

          <!-- 基础 -->
          <n-card title="基础" size="small">
            <n-space vertical :size="12">
              <div class="row">
                <span class="label">尺寸</span>
                <n-slider v-model:value="opts.size" :min="200" :max="600" :step="20" :format-tooltip="v => v + 'px'" />
                <span class="value">{{ opts.size }}</span>
              </div>
              <div class="row">
                <span class="label">纠错级别</span>
                <n-select v-model:value="opts.errorLevel" :options="errorOptions" size="small" style="width: 110px" />
              </div>
              <div class="row">
                <span class="label">外边距</span>
                <n-slider v-model:value="opts.margin" :min="0" :max="6" :step="1" style="width: 150px" />
                <span class="value">{{ opts.margin }}</span>
              </div>
            </n-space>
          </n-card>

          <!-- 码点样式 -->
          <n-card title="码点样式" size="small">
            <n-radio-group v-model:value="opts.dotStyle" size="small">
              <n-radio-button v-for="s in dotStyles" :key="s.value" :value="s.value">
                {{ s.label }}
              </n-radio-button>
            </n-radio-group>
          </n-card>

          <!-- 码眼样式 -->
          <n-card title="码眼样式" size="small">
            <n-radio-group v-model:value="opts.eyeStyle" size="small">
              <n-radio-button v-for="s in eyeStyles" :key="s.value" :value="s.value">
                {{ s.label }}
              </n-radio-button>
            </n-radio-group>
          </n-card>

          <!-- 颜色 -->
          <n-card title="颜色" size="small">
            <n-space vertical :size="12">
              <div class="row">
                <span class="label">前景模式</span>
                <n-radio-group v-model:value="opts.gradient" size="small">
                  <n-radio-button :value="false">纯色</n-radio-button>
                  <n-radio-button :value="true">渐变</n-radio-button>
                </n-radio-group>
              </div>
              <div v-if="!opts.gradient" class="row">
                <span class="label">前景色</span>
                <n-color-picker v-model:value="opts.fgColor" size="small" :show-alpha="false" />
              </div>
              <template v-else>
                <div class="row">
                  <span class="label">渐变起点</span>
                  <n-color-picker v-model:value="opts.gradientFrom" size="small" :show-alpha="false" />
                </div>
                <div class="row">
                  <span class="label">渐变终点</span>
                  <n-color-picker v-model:value="opts.gradientTo" size="small" :show-alpha="false" />
                </div>
                <div class="row">
                  <span class="label">角度</span>
                  <n-slider v-model:value="opts.gradientAngle" :min="0" :max="360" :step="15" :format-tooltip="v => v + '°'" style="width: 150px" />
                  <span class="value">{{ opts.gradientAngle }}°</span>
                </div>
              </template>
              <div class="row">
                <span class="label">背景透明</span>
                <n-switch v-model:value="bgTransparent" size="small" />
              </div>
              <div v-if="!bgTransparent" class="row">
                <span class="label">背景色</span>
                <n-color-picker v-model:value="opts.bgColor" size="small" :show-alpha="false" />
              </div>
            </n-space>
          </n-card>

          <!-- Logo -->
          <n-card title="Logo（嵌入中心）" size="small">
            <n-space vertical :size="12">
              <input
                ref="logoInputRef"
                type="file"
                accept="image/*"
                style="display: none"
                @change="onLogoChange"
              />
              <n-space>
                <n-button size="small" @click="logoInputRef?.click()">
                  {{ opts.logo ? '更换图片' : '选择图片' }}
                </n-button>
                <n-button v-if="opts.logo" size="small" quaternary type="error" @click="onLogoClear">
                  移除
                </n-button>
              </n-space>
              <div v-if="opts.logo" class="row">
                <span class="label">Logo 比例</span>
                <n-slider v-model:value="opts.logoSize" :min="0.1" :max="0.3" :step="0.02" :format-tooltip="v => Math.round(v * 100) + '%'" style="width: 150px" />
                <span class="value">{{ Math.round(opts.logoSize * 100) }}%</span>
              </div>
              <n-text v-if="!opts.logo" depth="3" style="font-size: 12px">
                提示：嵌入 Logo 会占用中心区域，建议同时调高纠错级别到 H
              </n-text>
            </n-space>
          </n-card>

          <!-- 底部文字 -->
          <n-card title="底部文字" size="small">
            <n-space vertical :size="12">
              <n-input v-model:value="opts.bottomText" placeholder="如：扫码关注" size="small" clearable />
              <div class="row">
                <span class="label">字号</span>
                <n-slider v-model:value="opts.textSize" :min="12" :max="32" :step="1" style="width: 150px" />
                <span class="value">{{ opts.textSize }}px</span>
              </div>
              <div class="row">
                <span class="label">文字颜色</span>
                <n-color-picker v-model:value="opts.textColor" size="small" :show-alpha="false" />
              </div>
            </n-space>
          </n-card>
        </n-space>
      </div>
    </div>

    <!-- 右侧：预览 -->
    <div class="flex-1 flex flex-col items-center justify-center min-w-0 bg-gray-50 dark:bg-gray-900 p-6">
      <div class="bg-white rounded-xl shadow-lg p-4 flex items-center justify-center">
        <canvas ref="canvasRef"></canvas>
      </div>
      <div v-if="!input" class="text-gray-400 text-sm mt-4">输入内容后自动生成</div>
      <n-alert v-if="errorMsg" type="error" title="生成失败" class="mt-4 max-w-md" closable @close="errorMsg = ''">
        {{ errorMsg }}
      </n-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import {
  NButton, NInput, NCard, NSpace, NSlider, NSelect, NColorPicker,
  NSwitch, NRadioGroup, NRadioButton, NTag, NAlert, NText, useMessage,
} from "naive-ui";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import { drawQrcode, type QrOptions, type DotStyle, type EyeStyle, type ErrorLevel } from "./draw";
import { downloadFile, canvasToBlob } from "@/lib/download";

const message = useMessage();

const input = ref("");
const canvasRef = ref<HTMLCanvasElement | null>(null);
const logoInputRef = ref<HTMLInputElement | null>(null);
const errorMsg = ref("");
const bgTransparent = ref(false);

const opts = reactive<QrOptions>({
  text: "",
  size: 320,
  errorLevel: "M",
  dotStyle: "square",
  eyeStyle: "square",
  fgColor: "#000000",
  bgColor: "#ffffff",
  gradient: false,
  gradientFrom: "#3b82f6",
  gradientTo: "#8b5cf6",
  gradientAngle: 45,
  logo: null,
  logoSize: 0.2,
  margin: 2,
  bottomText: "",
  textSize: 18,
  textColor: "#000000",
});

const errorOptions = [
  { label: "L (7%)", value: "L" },
  { label: "M (15%)", value: "M" },
  { label: "Q (25%)", value: "Q" },
  { label: "H (30%)", value: "H" },
];

const dotStyles: { label: string; value: DotStyle }[] = [
  { label: "方块", value: "square" },
  { label: "圆点", value: "dot" },
  { label: "菱形", value: "diamond" },
  { label: "圆角", value: "rounded" },
];

const eyeStyles: { label: string; value: EyeStyle }[] = [
  { label: "方块", value: "square" },
  { label: "圆形", value: "circle" },
  { label: "叶子", value: "leaf" },
];

let timer: ReturnType<typeof setTimeout> | null = null;

// 监听所有配置变化（input + opts + 背景透明开关）
watch([input, opts, bgTransparent], () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(generate, 200);
}, { deep: true });

function generate() {
  if (!canvasRef.value) return;
  // 背景透明时把 bgColor 转成 'transparent' 传给 draw
  const finalBg = bgTransparent.value ? "transparent" : opts.bgColor;
  try {
    drawQrcode(canvasRef.value, { ...opts, text: input.value, bgColor: finalBg });
    errorMsg.value = "";
  } catch (e) {
    errorMsg.value = `生成失败：${(e as Error).message}`;
  }
}

function onLogoChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    opts.logo = img;
  };
  img.onerror = () => message.error("图片加载失败");
  img.src = URL.createObjectURL(file);
  // 重置 input，允许重复选择同一文件
  target.value = "";
}

function onLogoClear() {
  opts.logo = null;
}

async function onDownload() {
  if (!canvasRef.value || !input.value) {
    message.warning("没有可下载的二维码");
    return;
  }
  try {
    const blob = await canvasToBlob(canvasRef.value, "image/png");
    const path = await downloadFile(`qrcode-${Date.now()}.png`, blob);
    message.success(`已下载到 ${path}`);
  } catch (e) {
    message.error((e as Error).message || "下载失败");
  }
}

function onClear() {
  input.value = "";
  opts.logo = null;
  opts.bottomText = "";
  errorMsg.value = "";
}

onMounted(() => generate());
</script>

<style scoped>
.qrcode {
  height: 100%;
}
.left-panel {
  background: var(--n-color, #fff);
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.label {
  font-size: 12px;
  color: #6b7280;
  width: 70px;
  flex-shrink: 0;
}
.value {
  font-size: 12px;
  color: #6b7280;
  min-width: 36px;
  text-align: right;
}
</style>
