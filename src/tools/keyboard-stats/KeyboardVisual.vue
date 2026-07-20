<template>
  <div class="kbd-visual" :style="{ '--kbd-accent': accent }">
    <div
      v-for="(row, ri) in rows"
      :key="ri"
      class="kbd-row"
    >
      <div
        v-for="(k, ki) in row"
        :key="ri + '-' + ki + '-' + k.code"
        class="kbd-key"
        :class="{ 'is-active': activeMap[keyId(k)] }"
        :style="keyStyle(k)"
        :data-code="k.code"
      >
        <!-- 波纹 -->
        <span
          v-for="r in ripples[keyId(k)] || []"
          :key="r.id"
          class="kbd-ripple"
        />
        <!-- 键帽内容 -->
        <span class="kbd-label">{{ k.label || (k.code === 'space' ? '' : k.label) }}</span>
        <span v-if="showCount && counts[k.code]" class="kbd-count">{{ formatCount(counts[k.code]) }}</span>
        <!-- 浮起气泡 -->
        <transition-group name="kbd-pop" tag="span" class="kbd-pop-layer">
          <span
            v-for="p in pops[keyId(k)] || []"
            :key="p.id"
            class="kbd-pop-bubble"
          >+1</span>
        </transition-group>
        <!-- 光晕 -->
        <span class="kbd-glow" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { KEYBOARD_ROWS, type KeyDef } from "./keyLayout";

const props = withDefaults(
  defineProps<{
    counts?: Record<string, number>;
    accent?: string;
    showCount?: boolean;
    compact?: boolean;
  }>(),
  {
    counts: () => ({}),
    accent: "#6366f1",
    showCount: true,
    compact: false,
  }
);

const rows = KEYBOARD_ROWS;

// 同一物理 code 可能出现多次（左右 Shift/Ctrl），用行列生成唯一 id 做动画定位
function keyId(k: KeyDef): string {
  return k.code;
}

const activeMap = reactive<Record<string, boolean>>({});
const ripples = reactive<Record<string, { id: number }[]>>({});
const pops = reactive<Record<string, { id: number }[]>>({});
let seq = 0;

function keyStyle(k: KeyDef): Record<string, string> {
  const style: Record<string, string> = {};
  if (k.flex) {
    style.flex = "1";
  } else {
    style.flexGrow = String(k.w ?? 1);
  }
  return style;
}

function formatCount(n: number): string {
  if (n >= 10000) return (n / 1000).toFixed(1) + "k";
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

// 外部调用：触发某个 code 的按下特效
function trigger(code: string) {
  const id = code;
  activeMap[id] = true;
  window.setTimeout(() => {
    activeMap[id] = false;
  }, 160);

  const rid = ++seq;
  if (!ripples[id]) ripples[id] = [];
  ripples[id].push({ id: rid });
  window.setTimeout(() => {
    const arr = ripples[id];
    if (arr) ripples[id] = arr.filter((r) => r.id !== rid);
  }, 600);

  const pid = ++seq;
  if (!pops[id]) pops[id] = [];
  pops[id].push({ id: pid });
  window.setTimeout(() => {
    const arr = pops[id];
    if (arr) pops[id] = arr.filter((p) => p.id !== pid);
  }, 700);
}

defineExpose({ trigger });
</script>

<style scoped>
.kbd-visual {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  user-select: none;
}
.kbd-row {
  display: flex;
  gap: 6px;
  width: 100%;
}
.kbd-key {
  position: relative;
  flex: 0 0 auto;
  flex-basis: 0;
  min-width: 0;
  aspect-ratio: auto;
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.06), rgba(0, 0, 0, 0.18));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 3px 0 rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.82);
  font-size: 12px;
  font-weight: 600;
  overflow: visible;
  transition: transform 0.12s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.12s ease, background 0.2s ease, border-color 0.2s ease;
}
.kbd-key.is-active {
  transform: translateY(3px) scale(0.97);
  box-shadow: 0 0 0 rgba(0, 0, 0, 0.35), 0 0 22px 2px var(--kbd-accent), inset 0 1px 0 rgba(255, 255, 255, 0.15);
  border-color: var(--kbd-accent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--kbd-accent) 42%, transparent), rgba(0, 0, 0, 0.2));
  color: #fff;
}
.kbd-label {
  position: relative;
  z-index: 2;
  white-space: nowrap;
  pointer-events: none;
}
.kbd-count {
  position: absolute;
  right: 4px;
  bottom: 3px;
  z-index: 2;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  padding: 1px 3px;
  border-radius: 5px;
  color: var(--kbd-accent);
  background: rgba(0, 0, 0, 0.35);
  pointer-events: none;
}
.kbd-glow {
  position: absolute;
  inset: -2px;
  border-radius: 12px;
  opacity: 0;
  background: radial-gradient(circle at center, var(--kbd-accent), transparent 70%);
  transition: opacity 0.2s ease;
  pointer-events: none;
  z-index: 0;
}
.kbd-key.is-active .kbd-glow {
  opacity: 0.55;
}
.kbd-ripple {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: var(--kbd-accent);
  transform: translate(-50%, -50%) scale(0);
  animation: kbd-ripple-anim 0.6s ease-out forwards;
  pointer-events: none;
  z-index: 1;
}
@keyframes kbd-ripple-anim {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0.55;
  }
  100% {
    transform: translate(-50%, -50%) scale(6);
    opacity: 0;
  }
}
.kbd-pop-layer {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 0;
  z-index: 3;
  pointer-events: none;
}
.kbd-pop-bubble {
  position: absolute;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: 800;
  color: var(--kbd-accent);
  text-shadow: 0 0 8px var(--kbd-accent);
}
.kbd-pop-enter-active {
  animation: kbd-pop-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.kbd-pop-leave-active {
  opacity: 0;
}
@keyframes kbd-pop-up {
  0% {
    opacity: 0;
    transform: translate(-50%, 6px) scale(0.6);
  }
  25% {
    opacity: 1;
    transform: translate(-50%, -6px) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -30px) scale(0.9);
  }
}

/* 紧凑模式（桌面小插件用） */
.kbd-visual.compact .kbd-key,
.compact .kbd-key {
  height: 34px;
  border-radius: 7px;
  font-size: 10px;
}
</style>
