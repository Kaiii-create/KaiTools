<template>
  <footer class="status-bar flex items-center gap-3 px-4">
    <div class="status-bar-main flex items-center gap-2 min-w-0">
      <span
        v-if="tone"
        class="status-bar-dot"
        :class="`status-bar-dot--${tone}`"
      />
      <span class="status-bar-text truncate">
        <slot />
      </span>
    </div>
    <div class="flex-1" />
    <div v-if="$slots.right" class="status-bar-right flex items-center gap-3 shrink-0">
      <slot name="right" />
    </div>
  </footer>
</template>

<script setup lang="ts">
/** 状态栏：工具底部的细状态行（状态、计数等）。 */
withDefaults(
  defineProps<{
    /** 状态点色调 */
    tone?: "default" | "success" | "error" | "warning";
  }>(),
  { tone: "default" }
);
</script>

<style scoped>
.status-bar {
  min-height: 30px;
  font-size: 12px;
  color: var(--ktool-text-mute);
  border-top: 1px solid var(--ktool-border);
  background: var(--ktool-surface);
}
.status-bar-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ktool-text-mute);
  flex-shrink: 0;
}
.status-bar-dot--success {
  background: #2ba24c;
}
.status-bar-dot--error {
  background: var(--ktool-danger);
}
.status-bar-dot--warning {
  background: #d9a23b;
}
.status-bar-text {
  line-height: 1.2;
}
</style>
