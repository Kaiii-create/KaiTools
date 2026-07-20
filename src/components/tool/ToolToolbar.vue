<template>
  <div
    class="tool-toolbar flex items-center gap-2"
    :class="[bordered ? 'tool-toolbar--bordered' : '', padded ? 'px-4' : '']"
  >
    <div class="tool-toolbar-main flex items-center gap-2 flex-wrap min-w-0">
      <slot />
    </div>
    <div class="flex-1" />
    <div v-if="$slots.side" class="tool-toolbar-side flex items-center gap-2 shrink-0">
      <slot name="side" />
    </div>
  </div>
</template>

<script setup lang="ts">
/** 工具操作栏：承载主操作按钮（左）与辅助操作（右）。 */
withDefaults(
  defineProps<{
    /** 是否显示底部细分割线 */
    bordered?: boolean;
    /** 是否带左右内边距 */
    padded?: boolean;
  }>(),
  { bordered: true, padded: true }
);
</script>

<style scoped>
.tool-toolbar {
  min-height: 48px;
  padding-top: 8px;
  padding-bottom: 8px;
  background: var(--ktool-surface);
}
.tool-toolbar--bordered {
  border-bottom: 1px solid var(--ktool-border);
}
</style>
