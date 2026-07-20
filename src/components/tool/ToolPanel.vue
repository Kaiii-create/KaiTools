<template>
  <section class="tool-panel" :class="{ 'tool-panel--bordered': bordered }">
    <header
      v-if="title || $slots['header-extra']"
      class="tool-panel-head flex items-center justify-between gap-3"
    >
      <div class="flex items-center gap-2 min-w-0">
        <span v-if="title" class="tool-panel-title">{{ title }}</span>
        <span v-if="subtitle" class="tool-panel-sub">{{ subtitle }}</span>
      </div>
      <div v-if="$slots['header-extra']" class="shrink-0">
        <slot name="header-extra" />
      </div>
    </header>
    <div class="tool-panel-body" :class="{ 'tool-panel-body--flush': flush }">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
/** 工具内容面板：低对比背景 / 可选细边框，用于聚合输入、输出等区域。 */
withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    /** 是否显示细边框（默认仅用背景层区分） */
    bordered?: boolean;
    /** 内容是否贴边（无内边距） */
    flush?: boolean;
  }>(),
  { bordered: false, flush: false }
);
</script>

<style scoped>
.tool-panel {
  background: var(--ktool-surface-2);
  border-radius: var(--ktool-radius);
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.tool-panel--bordered {
  border: 1px solid var(--ktool-border);
}
.tool-panel-head {
  padding: 8px 12px;
  border-bottom: 1px solid var(--ktool-border);
}
.tool-panel-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ktool-text-soft);
}
.tool-panel-sub {
  font-size: 12px;
  color: var(--ktool-text-mute);
}
.tool-panel-body {
  padding: 12px;
  flex: 1;
  min-height: 0;
}
.tool-panel-body--flush {
  padding: 0;
}
</style>
