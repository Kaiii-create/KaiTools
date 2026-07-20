<template>
  <ToolPage>
    <!-- 预览区 + 拾色器 -->
    <div class="preview-section flex items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800">
      <div
        class="color-preview w-16 h-16 rounded-lg border-2 border-gray-300 dark:border-gray-600 shadow-lg cursor-pointer relative overflow-hidden"
        :style="{ backgroundColor: hex }"
        @click="triggerNativePicker"
      >
        <input
          ref="nativePickerRef"
          type="color"
          :value="hex"
          @input="onNativeColorInput"
          class="absolute inset-0 opacity-0 cursor-pointer"
          style="width: 100%; height: 100%"
        />
      </div>
      <div class="flex-1">
        <div class="text-sm font-medium">{{ hex }}</div>
        <div class="text-xs text-gray-500">RGB: {{ rgbString }}</div>
      </div>
      <n-button type="primary" size="small" @click="triggerNativePicker">
        <template #icon>
          <n-icon><ColorPickerIcon /></n-icon>
        </template>
        点击拾色
      </n-button>
    </div>

    <!-- 配置区 -->
    <div class="flex-1 overflow-auto p-4">
      <n-space vertical :size="16">
        <!-- HEX -->
        <n-card title="HEX" size="small">
          <div class="row">
            <n-input v-model:value="hex" placeholder="#000000" @input="syncFromHex" class="flex-1" />
            <n-button size="small" quaternary @click="onCopy(hex, 'HEX')">复制</n-button>
          </div>
        </n-card>

        <!-- RGB -->
        <n-card title="RGB" size="small">
          <div class="row">
            <n-input-number v-model:value="r" :min="0" :max="255" size="small" @update:value="syncFromRgb" />
            <n-input-number v-model:value="g" :min="0" :max="255" size="small" @update:value="syncFromRgb" />
            <n-input-number v-model:value="b" :min="0" :max="255" size="small" @update:value="syncFromRgb" />
            <n-button size="small" quaternary @click="onCopy(rgbString, 'RGB')">复制</n-button>
          </div>
          <div class="text-xs text-gray-500 mt-2">{{ rgbString }}</div>
        </n-card>

        <!-- RGBA -->
        <n-card title="RGBA" size="small">
          <div class="row">
            <n-input-number v-model:value="r" :min="0" :max="255" size="small" @update:value="syncFromRgb" />
            <n-input-number v-model:value="g" :min="0" :max="255" size="small" @update:value="syncFromRgb" />
            <n-input-number v-model:value="b" :min="0" :max="255" size="small" @update:value="syncFromRgb" />
            <n-input-number v-model:value="a" :min="0" :max="1" :step="0.1" size="small" />
            <n-button size="small" quaternary @click="onCopy(rgbaString, 'RGBA')">复制</n-button>
          </div>
          <div class="text-xs text-gray-500 mt-2">{{ rgbaString }}</div>
        </n-card>

        <!-- HSL -->
        <n-card title="HSL" size="small">
          <div class="row">
            <n-input-number v-model:value="h" :min="0" :max="360" size="small" @update:value="syncFromHsl" />
            <n-input-number v-model:value="s" :min="0" :max="100" size="small" @update:value="syncFromHsl" />
            <n-input-number v-model:value="l" :min="0" :max="100" size="small" @update:value="syncFromHsl" />
            <n-button size="small" quaternary @click="onCopy(hslString, 'HSL')">复制</n-button>
          </div>
          <div class="text-xs text-gray-500 mt-2">{{ hslString }}</div>
        </n-card>

        <!-- 颜色历史 -->
        <n-card title="历史颜色" size="small">
          <div class="flex flex-wrap gap-2">
            <div
              v-for="(color, index) in history"
              :key="index"
              class="w-8 h-8 rounded cursor-pointer hover:scale-110 transition-transform border border-gray-200"
              :style="{ backgroundColor: color }"
              :title="color"
              @click="hex = color; syncFromHex()"
            />
          </div>
        </n-card>
      </n-space>
    </div>
  </ToolPage>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import ToolPage from "@/components/tool/ToolPage.vue";
import { NCard, NSpace, NInput, NInputNumber, NButton, NIcon, useMessage } from "naive-ui";
import { ColorPaletteOutline as ColorPickerIcon } from "@vicons/ionicons5";

const message = useMessage();

const hex = ref("#3b82f6");
const r = ref(59);
const g = ref(130);
const b = ref(246);
const a = ref(1);
const h = ref(217);
const s = ref(91);
const l = ref(60);
const nativePickerRef = ref<HTMLInputElement | null>(null);

const history = ref<string[]>(["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"]);

const rgbString = computed(() => `rgb(${r.value}, ${g.value}, ${b.value})`);
const rgbaString = computed(() => `rgba(${r.value}, ${g.value}, ${b.value}, ${a.value})`);
const hslString = computed(() => `hsl(${h.value}, ${s.value}%, ${l.value}%)`);

function triggerNativePicker() {
  nativePickerRef.value?.click();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  (r /= 255), (g /= 255), (b /= 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  (h /= 360), (s /= 100), (l /= 100);
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function onNativeColorInput(e: Event) {
  hex.value = (e.target as HTMLInputElement).value;
  syncFromHex();
}

function syncFromHex() {
  const rgb = hexToRgb(hex.value);
  r.value = rgb.r; g.value = rgb.g; b.value = rgb.b;
  const hsl = rgbToHsl(r.value, g.value, b.value);
  h.value = hsl.h; s.value = hsl.s; l.value = hsl.l;
}

function syncFromRgb() {
  hex.value = rgbToHex(r.value, g.value, b.value);
  const hsl = rgbToHsl(r.value, g.value, b.value);
  h.value = hsl.h; s.value = hsl.s; l.value = hsl.l;
}

function syncFromHsl() {
  const rgb = hslToRgb(h.value, s.value, l.value);
  r.value = rgb.r; g.value = rgb.g; b.value = rgb.b;
  hex.value = rgbToHex(r.value, g.value, b.value);
}

watch(hex, () => {
  if (!history.value.includes(hex.value)) {
    history.value.unshift(hex.value);
    if (history.value.length > 20) history.value.pop();
  }
});

async function onCopy(text: string, label: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    message.success(`${label} 已复制`);
  } catch {
    message.error("复制失败");
  }
}
</script>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
