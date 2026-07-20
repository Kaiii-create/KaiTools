<template>
  <div class="tool-page h-full overflow-auto ktool-scroll">
    <div class="tool-page-inner" :class="padded ? 'p-4' : ''">
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
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
