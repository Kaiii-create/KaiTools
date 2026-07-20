<template>
  <div class="empty-state flex flex-col items-center justify-center text-center gap-3 py-12 px-6">
    <div v-if="icon" class="empty-state-icon">
      <n-icon :component="icon" :size="34" />
    </div>
    <div v-else class="empty-state-dot" />
    <div>
      <div class="empty-state-title">{{ title }}</div>
      <p v-if="description" class="empty-state-desc">{{ description }}</p>
      <div v-if="$slots.default" class="empty-state-extra mt-3">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NIcon } from "naive-ui";
import type { Component } from "vue";

withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    icon?: Component;
  }>(),
  { title: "暂无内容" }
);
</script>

<style scoped>
.empty-state-icon {
  color: var(--ktool-text-mute);
  opacity: 0.7;
}
.empty-state-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--ktool-surface-3);
}
.empty-state-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ktool-text-soft);
}
.empty-state-desc {
  font-size: 12.5px;
  color: var(--ktool-text-mute);
  margin-top: 4px;
  max-width: 320px;
}
</style>
