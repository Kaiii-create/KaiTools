<template>
  <div class="tool-page h-full flex flex-col">
    <div class="tool-page-inner ktool-scroll" :class="padded ? 'p-4' : ''">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
/** 工具页面根容器：负责滚动与内边距，工具内容在其内部排布。 */
withDefaults(
  defineProps<{
    /** 是否带内边距（默认 16px） */
    padded?: boolean;
  }>(),
  { padded: true }
);
</script>

<style scoped>
.tool-page-inner {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
