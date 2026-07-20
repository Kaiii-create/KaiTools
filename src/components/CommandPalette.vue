<template>
  <teleport to="body">
    <transition name="kp-fade">
      <div v-if="show" class="kp-overlay" @click.self="$emit('update:show', false)">
        <div class="kp-panel ktool-pop" role="dialog" aria-label="命令面板">
          <div class="kp-search flex items-center gap-2 px-3">
            <n-icon :size="17" class="text-[var(--ktool-text-mute)]">
              <SearchOutline />
            </n-icon>
            <input
              ref="inputRef"
              v-model="query"
              class="kp-input"
              placeholder="搜索并切换到工具…"
              @keydown="onKeydown"
            />
            <kbd class="kp-kbd">Esc</kbd>
          </div>

          <n-empty
            v-if="results.length === 0"
            description="没有匹配的工具"
            size="small"
            class="py-10"
          />

          <ul v-else class="kp-list ktool-scroll">
            <li
              v-for="(t, i) in results"
              :key="t.id"
              class="kp-item"
              :class="{ 'kp-item--active': i === activeIndex }"
              @mouseenter="activeIndex = i"
              @click="select(t.id)"
            >
              <span class="kp-item-icon">
                <n-icon :component="t.icon" :size="17" />
              </span>
              <span class="kp-item-name truncate">{{ t.name }}</span>
              <span class="kp-item-cat">{{ t.category }}</span>
            </li>
          </ul>

          <div class="kp-footer">
            <span><kbd class="kp-kbd">↑</kbd><kbd class="kp-kbd">↓</kbd> 导航</span>
            <span><kbd class="kp-kbd">↵</kbd> 选择</span>
            <span><kbd class="kp-kbd">Esc</kbd> 关闭</span>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from "vue";
import { NIcon, NEmpty } from "naive-ui";
import { SearchOutline } from "@vicons/ionicons5";
import { tools, searchTools } from "@/tools/registry";

const props = defineProps<{ show: boolean }>();
const emit = defineEmits<{
  (e: "update:show", v: boolean): void;
  (e: "select", id: string): void;
}>();

const query = ref("");
const activeIndex = ref(0);
const inputRef = ref<HTMLInputElement | null>(null);

const results = computed(() => searchTools(query.value));

watch(
  () => props.show,
  (v) => {
    if (v) {
      query.value = "";
      activeIndex.value = 0;
      nextTick(() => inputRef.value?.focus());
    }
  }
);
watch(results, () => {
  if (activeIndex.value >= results.value.length) activeIndex.value = 0;
});

function onKeydown(e: KeyboardEvent) {
  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeIndex.value = Math.max(activeIndex.value - 1, 0);
  } else if (e.key === "Enter") {
    e.preventDefault();
    const t = results.value[activeIndex.value];
    if (t) select(t.id);
  } else if (e.key === "Escape") {
    e.preventDefault();
    emit("update:show", false);
  }
}

function select(id: string) {
  emit("select", id);
  emit("update:show", false);
}
void tools;
</script>

<style scoped>
.kp-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: rgba(16, 18, 23, 0.32);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
}
.kp-panel {
  width: min(560px, calc(100vw - 32px));
  max-height: 64vh;
  display: flex;
  flex-direction: column;
  background: var(--ktool-surface);
  border: 1px solid var(--ktool-border);
  border-radius: var(--ktool-radius-lg);
  box-shadow: var(--ktool-shadow-lg);
  overflow: hidden;
}
.kp-search {
  height: 48px;
  border-bottom: 1px solid var(--ktool-border);
  flex-shrink: 0;
}
.kp-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--ktool-text);
  font-size: 14px;
}
.kp-input::placeholder {
  color: var(--ktool-text-mute);
}
.kp-kbd {
  font-size: 10px;
  font-family: inherit;
  color: var(--ktool-text-mute);
  background: var(--ktool-surface-2);
  border: 1px solid var(--ktool-border);
  border-radius: 4px;
  padding: 1px 5px;
  line-height: 1.5;
}
.kp-list {
  list-style: none;
  margin: 0;
  padding: 6px;
  overflow: auto;
  flex: 1;
}
.kp-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--ktool-radius);
  cursor: pointer;
  color: var(--ktool-text-soft);
}
.kp-item--active {
  background: var(--ktool-brand-soft);
  color: var(--ktool-text);
}
.kp-item-icon {
  display: flex;
  color: var(--ktool-text-mute);
}
.kp-item--active .kp-item-icon {
  color: var(--ktool-brand);
}
.kp-item-name {
  font-size: 13.5px;
  font-weight: 500;
  flex: 1;
  min-width: 0;
}
.kp-item-cat {
  font-size: 11px;
  color: var(--ktool-text-mute);
  background: var(--ktool-surface-2);
  border-radius: 4px;
  padding: 2px 6px;
}
.kp-footer {
  display: flex;
  gap: 14px;
  padding: 8px 12px;
  border-top: 1px solid var(--ktool-border);
  font-size: 11px;
  color: var(--ktool-text-mute);
}
.kp-footer .kp-kbd {
  margin-right: 2px;
}

.kp-fade-enter-active,
.kp-fade-leave-active {
  transition: opacity 0.15s var(--ktool-ease);
}
.kp-fade-enter-from,
.kp-fade-leave-to {
  opacity: 0;
}
</style>
