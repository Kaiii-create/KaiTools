<template>
  <div class="picker-root" @mousemove="onMove" @mousedown="onDown" @contextmenu.prevent="cancelPick">
    <canvas
      ref="canvasRef"
      class="picker-canvas"
      :width="CANVAS_SIZE"
      :height="CANVAS_SIZE"
    />
    <div class="picker-hud">
      <span class="picker-swatch" :style="{ background: curHex }" />
      <span class="picker-hex">{{ curHex }}</span>
      <span class="picker-rgb">RGB({{ current.r }}, {{ current.g }}, {{ current.b }})</span>
    </div>
    <div class="picker-tip">移动鼠标取色 · 左键复制并退出 · 右键 / Esc 取消</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { invoke } from "@tauri-apps/api/core";
import { emitTo } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

interface PickerSample {
  x: number;
  y: number;
  w: number;
  h: number;
  grid: number[];
}

interface ScreenColor {
  r: number;
  g: number;
  b: number;
}

const RADIUS = 7;
const CELL = 14;
const CANVAS_SIZE = (RADIUS * 2 + 1) * CELL; // 210px

const canvasRef = ref<HTMLCanvasElement | null>(null);
const curHex = ref("#000000");
const current = reactive<ScreenColor>({ r: 0, g: 0, b: 0 });

let px = 0; // 光标在屏幕上的真实坐标
let py = 0;
let lx = 0; // 放大镜左上角坐标（偏移到光标右侧，避免遮挡取色点）
let ly = 0;
let rafId = 0;

function rgbToHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return "#" + h(r) + h(g) + h(b);
}

function computeLoupePos() {
  let nx = px + CANVAS_SIZE + 16;
  if (nx + CANVAS_SIZE > window.innerWidth) nx = px - CANVAS_SIZE - 16;
  let ny = py - CANVAS_SIZE / 2;
  ny = Math.max(8, Math.min(window.innerHeight - CANVAS_SIZE - 8, ny));
  lx = nx;
  ly = ny;
}

function scheduleDraw() {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = 0;
    draw();
  });
}

async function draw() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  let res: PickerSample;
  try {
    res = await invoke<PickerSample>("sample_screen_grid", { radius: RADIUS });
  } catch {
    return;
  }
  px = res.x + (res.w - 1) / 2;
  py = res.y + (res.h - 1) / 2;
  computeLoupePos();

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  canvas.style.left = lx + "px";
  canvas.style.top = ly + "px";
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // grid 为扁平化 BGR 字节数组，长度 = w*h*3（每个像素 [B, G, R]）
  for (let i = 0; i < res.grid.length; i += 3) {
    const gi = i / 3;
    const gx = gi % res.w;
    const gy = Math.floor(gi / res.w);
    const b = res.grid[i];
    const g = res.grid[i + 1];
    const r = res.grid[i + 2];
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(gx * CELL, gy * CELL, CELL, CELL);
  }

  // 中心十字（代表光标所在点）
  const cx = Math.floor(res.w / 2) * CELL + CELL / 2;
  const cy = Math.floor(res.h / 2) * CELL + CELL / 2;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 9, cy);
  ctx.lineTo(cx + 9, cy);
  ctx.moveTo(cx, cy - 9);
  ctx.lineTo(cx, cy + 9);
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.strokeRect(cx - 1, cy - 1, 2, 2);

  // 中心像素（屏幕光标处）：grid 为 BGR，每像素 3 字节
  const centerByte = Math.floor(res.grid.length / 2);
  const cp = centerByte - (centerByte % 3);
  const cr = res.grid[cp + 2];
  const cg = res.grid[cp + 1];
  const cb = res.grid[cp];
  current.r = cr;
  current.g = cg;
  current.b = cb;
  curHex.value = rgbToHex(cr, cg, cb);
}

function onMove(e: MouseEvent) {
  px = e.clientX;
  py = e.clientY;
  computeLoupePos();
  scheduleDraw();
}

async function pick() {
  let hex = curHex.value;
  // 兜底：若尚未采样到（极少见），实时取一次真实像素
  if (!hex || hex === "#000000") {
    try {
      const c = await invoke<ScreenColor>("sample_screen_color");
      hex = rgbToHex(c.r, c.g, c.b);
    } catch {}
  }
  if (hex) {
    try {
      await navigator.clipboard.writeText(hex);
    } catch {}
    try {
      await emitTo("main", "color-picked", { hex });
    } catch {}
  }
  await getCurrentWebviewWindow().close();
}

async function onDown(e: MouseEvent) {
  if (e.button !== 0) return; // 仅左键取色
  await pick();
}

async function cancelPick() {
  await getCurrentWebviewWindow().close();
}

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") cancelPick();
}

let intervalId: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  draw();
  intervalId = setInterval(draw, 50);
  window.addEventListener("keydown", onKey);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
  if (rafId) cancelAnimationFrame(rafId);
  window.removeEventListener("keydown", onKey);
});
</script>

<style scoped>
.picker-root {
  position: fixed;
  inset: 0;
  cursor: crosshair;
  user-select: none;
  background: transparent;
}
.picker-canvas {
  position: absolute;
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.65);
  pointer-events: none;
}
.picker-hud {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: rgba(0, 0, 0, 0.72);
  border-radius: 999px;
  color: #fff;
  font: 600 13px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}
.picker-swatch {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.5);
}
.picker-rgb {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}
.picker-tip {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 12px;
  white-space: nowrap;
}
</style>
