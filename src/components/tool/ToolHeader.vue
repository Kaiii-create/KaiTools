<template>
  <div class="tool-header flex items-start justify-between gap-3 mb-4">
    <div class="flex items-start gap-2.5 min-w-0">
      <n-icon
        v-if="icon"
        :component="icon"
        :size="18"
        class="tool-header-icon shrink-0 mt-0.5"
      />
      <div class="min-w-0">
        <h2 class="tool-header-title truncate">{{ title }}</h2>
        <p v-if="description" class="tool-header-desc truncate">
          {{ description }}
        </p>
      </div>
    </div>
    <div v-if="$slots.actions" class="tool-header-actions shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { NIcon } from "naive-ui";
import type { Component } from "vue";

/**
 * 工具内页分区标题（可选）。
 * 注意：全局工具名称与说明由顶部 TitleBar 承载，
 * 此组件用于工具内部的分区/子功能标题。
 */
defineProps<{
  title: string;
  description?: string;
  icon?: Component;
}>();
</script>

<style scoped>
.tool-header-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--ktool-text);
}
.tool-header-desc {
  font-size: 12.5px;
  color: var(--ktool-text-mute);
  margin-top: 2px;
}
.tool-header-icon {
  color: var(--ktool-text-soft);
}
</style>
