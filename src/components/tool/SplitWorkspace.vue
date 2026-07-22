<template>
  <div
    ref="rootRef"
    class="split-workspace"
    :class="[
      { 'is-resizing': resizing },
      `split-workspace--input-${inputVariant}`,
    ]"
  >
    <section
      class="split-workspace-pane split-workspace-pane--input"
      :style="{ width: `calc(${split}% - 6px)` }"
    >
      <header class="split-workspace-head">
        <div class="split-workspace-title">{{ inputLabel }}</div>
        <div v-if="$slots['input-actions']" class="split-workspace-actions">
          <slot name="input-actions" />
        </div>
      </header>
      <div class="split-workspace-body">
        <slot name="input" />
      </div>
    </section>

    <div
      class="split-workspace-divider"
      :class="{ 'split-workspace-divider--static': !resizable }"
      role="separator"
      aria-orientation="vertical"
      aria-valuemin="30"
      aria-valuemax="70"
      :aria-valuenow="Math.round(split)"
      :tabindex="resizable ? 0 : -1"
      title="拖动调整宽度，双击恢复默认"
      @mousedown.prevent="startResize"
      @dblclick="resetSplit"
      @keydown.left.prevent="nudge(-2)"
      @keydown.right.prevent="nudge(2)"
    >
      <span class="split-workspace-grip" />
    </div>

    <section
      class="split-workspace-pane split-workspace-pane--output"
      :style="{ width: `calc(${100 - split}% - 6px)` }"
    >
      <header class="split-workspace-head">
        <div class="split-workspace-title">{{ outputLabel }}</div>
        <div v-if="$slots['output-actions']" class="split-workspace-actions">
          <slot name="output-actions" />
        </div>
      </header>
      <div class="split-workspace-body">
        <slot name="output" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    inputLabel?: string;
    outputLabel?: string;
    resizable?: boolean;
    inputVariant?: "inset" | "surface";
  }>(),
  {
    modelValue: 44,
    inputLabel: "输入",
    outputLabel: "结果",
    resizable: true,
    inputVariant: "surface",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
}>();

const rootRef = ref<HTMLElement | null>(null);
const resizing = ref(false);
const split = computed(() => clamp(props.modelValue));

function clamp(value: number) {
  return Math.min(70, Math.max(30, value));
}

function startResize() {
  if (!props.resizable) return;
  resizing.value = true;
  document.addEventListener("mousemove", onResize);
  document.addEventListener("mouseup", stopResize);
  document.body.style.userSelect = "none";
  document.body.style.cursor = "col-resize";
}

function onResize(event: MouseEvent) {
  if (!resizing.value || !rootRef.value) return;
  const rect = rootRef.value.getBoundingClientRect();
  emit("update:modelValue", clamp(((event.clientX - rect.left) / rect.width) * 100));
}

function stopResize() {
  resizing.value = false;
  document.removeEventListener("mousemove", onResize);
  document.removeEventListener("mouseup", stopResize);
  document.body.style.userSelect = "";
  document.body.style.cursor = "";
}

function resetSplit() {
  if (props.resizable) emit("update:modelValue", 44);
}

function nudge(amount: number) {
  if (props.resizable) emit("update:modelValue", clamp(split.value + amount));
}

onUnmounted(stopResize);
</script>

<style scoped>
.split-workspace {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  width: 100%;
}
.split-workspace-pane {
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--ktool-radius-md);
  transition: box-shadow var(--ktool-duration) var(--ktool-ease);
}
.split-workspace-pane--input {
  background: var(--ktool-surface-inset);
}
.split-workspace--input-surface .split-workspace-pane--input {
  background: var(--ktool-surface);
  box-shadow: var(--ktool-shadow-sm);
}
.split-workspace-pane--output {
  background: var(--ktool-surface);
  box-shadow: var(--ktool-shadow-sm);
}
.split-workspace-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 40px;
  padding: 8px 12px;
}
.split-workspace-title {
  min-width: 0;
  color: var(--ktool-text);
  font-size: 13px;
  font-weight: 600;
}
.split-workspace-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 4px;
}
.split-workspace-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  padding: 0 8px 8px;
}
.split-workspace-body :deep(.editor-pane) {
  flex: 1 1 auto;
  min-width: 0;
}
.split-workspace-body :deep(.editor-pane-body) {
  border-radius: var(--ktool-radius-md);
}
.split-workspace-divider {
  position: relative;
  flex: 0 0 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: col-resize;
}
.split-workspace-divider::before {
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 50%;
  width: 1px;
  background: var(--ktool-border);
  content: "";
  transform: translateX(-50%);
}
.split-workspace-grip {
  position: relative;
  width: 4px;
  height: 32px;
  border-radius: var(--ktool-radius-sm);
  background: var(--ktool-border-strong);
  opacity: 0;
  transition: opacity var(--ktool-duration) var(--ktool-ease),
    background var(--ktool-duration) var(--ktool-ease);
}
.split-workspace-divider:hover .split-workspace-grip,
.split-workspace-divider:focus-visible .split-workspace-grip,
.is-resizing .split-workspace-grip {
  background: var(--ktool-brand);
  opacity: 1;
}
.split-workspace-divider--static {
  cursor: default;
}
.split-workspace-divider--static .split-workspace-grip {
  display: none;
}
</style>
