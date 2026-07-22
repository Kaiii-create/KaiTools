<template>
  <div class="kbd-visual" :class="{ compact }" :style="{ '--kbd-accent': accent }">
    <div class="kbd-blocks">
      <div
        v-for="(block, blockIndex) in blocks"
        :key="blockIndex"
        class="kbd-block"
        :class="{
          'kbd-block--main': blockIndex === 0,
          'kbd-block--navigation': blockIndex === 1 && blocks.length > 1,
          'kbd-block--numpad': isGridBlock(block),
        }"
      >
        <div v-if="isGridBlock(block)" class="kbd-numpad-grid">
          <div
            v-for="key in block.flat()"
            :key="`${key.code}-${key.x}-${key.y}`"
            class="kbd-key"
            :class="{ 'is-active': activeMap[key.code] }"
            :style="gridKeyStyle(key)"
          >
            <span v-for="ripple in ripples[key.code] || []" :key="ripple.id" class="kbd-ripple" />
            <span class="kbd-label">{{ key.label }}</span>
            <span v-if="showCount && counts[key.code]" class="kbd-count">{{ formatCount(counts[key.code]) }}</span>
            <transition-group name="kbd-pop" tag="span" class="kbd-pop-layer">
              <span v-for="pop in pops[key.code] || []" :key="pop.id" class="kbd-pop-bubble">+1</span>
            </transition-group>
          </div>
        </div>

        <template v-else>
          <div
            v-for="(row, rowIndex) in block"
            :key="rowIndex"
            class="kbd-row"
            :class="{ 'kbd-row--spacer': row.every((key) => key.spacer) }"
          >
            <div
              v-for="(key, keyIndex) in row"
              :key="`${rowIndex}-${keyIndex}-${key.code}`"
              class="kbd-key"
              :class="{ 'kbd-key--spacer': key.spacer, 'is-active': activeMap[key.code] }"
              :style="rowKeyStyle(key)"
            >
              <template v-if="!key.spacer">
                <span v-for="ripple in ripples[key.code] || []" :key="ripple.id" class="kbd-ripple" />
                <span class="kbd-label">{{ key.label }}</span>
                <span v-if="showCount && counts[key.code]" class="kbd-count">{{ formatCount(counts[key.code]) }}</span>
                <transition-group name="kbd-pop" tag="span" class="kbd-pop-layer">
                  <span v-for="pop in pops[key.code] || []" :key="pop.id" class="kbd-pop-bubble">+1</span>
                </transition-group>
              </template>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from "vue";
import { KEYBOARD_ROWS, type KeyDef } from "./keyLayout";

const props = withDefaults(
  defineProps<{
    blocks?: KeyDef[][][];
    counts?: Record<string, number>;
    accent?: string;
    showCount?: boolean;
    compact?: boolean;
    activeCode?: string | null;
    activeSeq?: number;
  }>(),
  {
    blocks: () => [KEYBOARD_ROWS],
    counts: () => ({}),
    accent: "var(--ktool-brand)",
    showCount: true,
    compact: false,
    activeCode: null,
    activeSeq: 0,
  }
);

const activeMap = reactive<Record<string, boolean>>({});
const ripples = reactive<Record<string, { id: number }[]>>({});
const pops = reactive<Record<string, { id: number }[]>>({});
let sequence = 0;

function isGridBlock(block: KeyDef[][]): boolean {
  return block.flat().some((key) => key.x != null || key.y != null || key.h != null);
}

function rowKeyStyle(key: KeyDef): Record<string, string> {
  return { flexGrow: String(key.w ?? 1) };
}

function gridKeyStyle(key: KeyDef): Record<string, string> {
  return {
    gridColumn: `${key.x ?? 1} / span ${key.w ?? 1}`,
    gridRow: `${key.y ?? 1} / span ${key.h ?? 1}`,
  };
}

function formatCount(count: number): string {
  if (count >= 10000) return `${Math.round(count / 1000)}k`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

function trigger(code: string) {
  activeMap[code] = true;
  window.setTimeout(() => { activeMap[code] = false; }, 130);

  const rippleId = ++sequence;
  if (!ripples[code]) ripples[code] = [];
  ripples[code].push({ id: rippleId });
  window.setTimeout(() => {
    if (ripples[code]) ripples[code] = ripples[code].filter((item) => item.id !== rippleId);
  }, 420);

  const popId = ++sequence;
  if (!pops[code]) pops[code] = [];
  pops[code].push({ id: popId });
  window.setTimeout(() => {
    if (pops[code]) pops[code] = pops[code].filter((item) => item.id !== popId);
  }, 520);
}

watch(
  () => props.activeSeq,
  () => {
    if (props.activeCode) trigger(props.activeCode);
  }
);

defineExpose({ trigger });
</script>

<style scoped>
.kbd-visual {
  width: 100%;
  min-width: 860px;
  user-select: none;
}
.kbd-blocks {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
}
.kbd-block {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}
.kbd-block--main {
  flex: 1 1 auto;
}
.kbd-block--navigation {
  flex: 0 0 164px;
}
.kbd-block--numpad {
  flex: 0 0 216px;
  padding-top: 60px;
}
.kbd-row {
  display: flex;
  gap: 5px;
  width: 100%;
}
.kbd-row--spacer {
  height: 8px;
}
.kbd-row--spacer .kbd-key {
  height: 8px;
}
.kbd-numpad-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(5, 42px);
  gap: 5px;
}
.kbd-numpad-grid .kbd-key {
  height: auto;
}
.kbd-key {
  position: relative;
  flex: 0 0 0;
  min-width: 0;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--ktool-border-strong);
  border-radius: 7px;
  background: var(--ktool-surface-2);
  box-shadow: 0 2px 0 var(--ktool-border-strong);
  color: var(--ktool-text-soft);
  font-size: 11px;
  font-weight: 600;
  transition: transform 100ms var(--ktool-ease), border-color 100ms var(--ktool-ease),
    background 100ms var(--ktool-ease), box-shadow 100ms var(--ktool-ease);
}
.kbd-key--spacer {
  visibility: hidden;
  pointer-events: none;
}
.kbd-key.is-active {
  transform: translateY(2px);
  border-color: var(--kbd-accent);
  background: var(--ktool-brand-soft);
  box-shadow: 0 0 0 2px var(--ktool-brand-soft-2);
  color: var(--kbd-accent);
}
.kbd-label {
  position: relative;
  z-index: 2;
  white-space: nowrap;
}
.kbd-count {
  position: absolute;
  right: 3px;
  bottom: 3px;
  z-index: 2;
  padding: 1px 3px;
  border-radius: 3px;
  background: var(--ktool-surface);
  color: var(--kbd-accent);
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
}
.kbd-ripple {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--kbd-accent);
  animation: kbd-ripple 420ms ease-out forwards;
  pointer-events: none;
}
.kbd-pop-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
}
.kbd-pop-bubble {
  position: absolute;
  left: 50%;
  top: 2px;
  color: var(--kbd-accent);
  font-size: 10px;
  font-weight: 700;
}
.kbd-pop-enter-active { animation: kbd-pop 520ms ease-out forwards; }
.kbd-pop-leave-active { opacity: 0; }
@keyframes kbd-ripple {
  from { opacity: 0.28; transform: translate(-50%, -50%) scale(0); }
  to { opacity: 0; transform: translate(-50%, -50%) scale(5); }
}
@keyframes kbd-pop {
  from { opacity: 0; transform: translate(-50%, 4px); }
  30% { opacity: 1; }
  to { opacity: 0; transform: translate(-50%, -20px); }
}
.kbd-visual.compact {
  min-width: 760px;
}
.kbd-visual.compact .kbd-key {
  height: 32px;
  border-radius: 5px;
  font-size: 9px;
}
.kbd-visual.compact .kbd-row--spacer,
.kbd-visual.compact .kbd-row--spacer .kbd-key {
  height: 5px;
}
</style>
