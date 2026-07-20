<template>
  <div class="editor-pane flex flex-col h-full min-h-0">
    <header
      v-if="label || $slots.actions"
      class="editor-pane-head flex items-center justify-between gap-2 px-1 pb-1.5"
    >
      <span class="editor-pane-label">{{ label }}</span>
      <div v-if="$slots.actions" class="flex items-center gap-1">
        <slot name="actions" />
      </div>
    </header>
    <div class="editor-pane-body flex flex-1 min-h-0">
      <div v-if="lineNumbers" ref="gutterRef" class="editor-pane-gutter" aria-hidden="true">
        <span v-for="line in lineCount" :key="line">{{ line }}</span>
      </div>
      <n-input
        ref="inputRef"
        :value="modelValue"
        @update:value="(v: string) => emit('update:modelValue', v)"
        type="textarea"
        :readonly="readonly"
        :placeholder="placeholder"
        :autosize="autosize"
        class="editor-pane-input"
        :class="{ 'editor-pane-input--mono': mono }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { NInput } from "naive-ui";

/**
 * 编辑器面板：带标签与可选操作的文本编辑区。
 * 通过 v-model 双向绑定，可用于输入 / 输出（readonly）区域。
 */
const props = withDefaults(
  defineProps<{
    label?: string;
    modelValue?: string;
    readonly?: boolean;
    placeholder?: string;
    /** 等宽字体（代码 / JSON 等） */
    mono?: boolean;
    /** 自适应高度 */
    autosize?: boolean | { minRows: number; maxRows: number };
    /** 是否显示代码行号 */
    lineNumbers?: boolean;
  }>(),
  {
    modelValue: "",
    readonly: false,
    mono: false,
    autosize: false,
    lineNumbers: false,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
}>();

const inputRef = ref<InstanceType<typeof NInput> | null>(null);
const gutterRef = ref<HTMLElement | null>(null);
const lineCount = computed(() => Math.max(1, props.modelValue.split("\n").length));
let textarea: HTMLTextAreaElement | null = null;

function syncGutter() {
  if (gutterRef.value && textarea) gutterRef.value.scrollTop = textarea.scrollTop;
}

async function bindTextarea() {
  await nextTick();
  textarea?.removeEventListener("scroll", syncGutter);
  textarea = (inputRef.value?.$el as HTMLElement | undefined)?.querySelector("textarea") ?? null;
  textarea?.addEventListener("scroll", syncGutter, { passive: true });
  syncGutter();
}

watch(() => props.lineNumbers, bindTextarea);
onMounted(bindTextarea);
onUnmounted(() => textarea?.removeEventListener("scroll", syncGutter));
</script>

<style scoped>
.editor-pane-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--ktool-text-soft);
  letter-spacing: 0.01em;
}
.editor-pane-body {
  border-radius: var(--ktool-radius);
  overflow: hidden;
  background: var(--ktool-surface-inset);
}
.editor-pane-gutter {
  width: 42px;
  flex: 0 0 42px;
  padding: 10px 8px;
  overflow: hidden;
  border-right: 1px solid var(--ktool-border);
  background: var(--ktool-surface-inset);
  color: var(--ktool-text-mute);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 12px;
  line-height: 1.6;
  text-align: right;
  user-select: none;
}
.editor-pane-gutter span {
  display: block;
  height: 1.6em;
}
.editor-pane-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border-radius: 0;
}
.editor-pane-input :deep(.n-input-wrapper),
.editor-pane-input :deep(.n-input__textarea),
.editor-pane-input :deep(textarea) {
  background: var(--ktool-surface-inset);
  height: 100%;
}
.editor-pane-input :deep(textarea) {
  box-shadow: none;
  resize: none;
  font-size: 13px;
  line-height: 1.6;
  padding: 10px 12px;
}
.editor-pane-input--mono :deep(textarea) {
  font-family: "JetBrains Mono", "Fira Code", "SFMono-Regular", Consolas,
    "Liberation Mono", Menlo, monospace;
}
</style>
