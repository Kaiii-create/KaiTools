<template>
  <aside class="sidebar flex flex-col h-full">
    <!-- 搜索框 -->
    <div class="px-3 pt-3 pb-2 shrink-0">
      <n-input
        v-model:value="search"
        placeholder="搜索工具"
        size="small"
        clearable
        @focus="onSearchFocus"
      >
        <template #prefix>
          <n-icon :size="16" class="text-[var(--ktool-text-mute)]">
            <SearchOutline />
          </n-icon>
        </template>
        <template #suffix>
          <kbd class="search-kbd">Ctrl K</kbd>
        </template>
      </n-input>
    </div>

    <!-- 导航列表 -->
    <nav class="sidebar-nav flex-1 min-h-0 overflow-auto ktool-scroll px-2 pb-3">
      <!-- 搜索态：扁平结果 -->
      <template v-if="search.trim()">
        <button
          v-for="t in filtered"
          :key="t.id"
          class="nav-item"
          :class="{ 'nav-item--active': t.id === activeId }"
          @click="onSelect(t.id)"
        >
          <span class="nav-item-icon"><n-icon :component="t.icon" :size="16" /></span>
          <span class="nav-item-name truncate">{{ t.name }}</span>
        </button>
        <div v-if="filtered.length === 0" class="nav-empty">
          <n-icon :size="20"><SearchOutline /></n-icon>
          <span>没有匹配的工具</span>
        </div>
      </template>

      <!-- 常规态：分类 -->
      <template v-else>
        <!-- 分类列表 -->
        <div v-for="g in grouped" :key="g.category" class="nav-group">
          <div class="nav-group-label">{{ g.category }}</div>
          <button
            v-for="t in g.items"
            :key="t.id"
            class="nav-item"
            :class="{ 'nav-item--active': t.id === activeId }"
            @click="onSelect(t.id)"
          >
            <span class="nav-item-icon"><n-icon :component="t.icon" :size="16" /></span>
            <span class="nav-item-name truncate">{{ t.name }}</span>
          </button>
        </div>
      </template>
    </nav>

    <!-- 底部：设置 -->
    <div class="sidebar-footer px-2 pb-3 pt-2 shrink-0">
      <button class="sidebar-settings" @click="$emit('open-settings')">
        <n-icon :size="16"><SettingsOutline /></n-icon>
        <span>设置</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { NInput, NIcon } from "naive-ui";
import {
  SearchOutline,
  SettingsOutline,
} from "@vicons/ionicons5";
import { tools, searchTools } from "@/tools/registry";
import type { ToolCategory, ToolModule } from "@/tools/types";
import { useSettingsStore } from "@/stores/settings";

const props = defineProps<{ activeId: string }>();
const emit = defineEmits<{
  (e: "select", id: string): void;
  (e: "open-settings"): void;
  (e: "open-command"): void;
}>();

const settings = useSettingsStore();
const search = ref("");

// 根据用户设置过滤掉被隐藏的工具
const visibleTools = computed(() => tools.filter((t) => !settings.isToolHidden(t.id)));

const filtered = computed(() =>
  searchTools(search.value).filter((t) => !settings.isToolHidden(t.id))
);

const categoryOrder: ToolCategory[] = ["编码", "时间", "加密", "转换", "二维码", "其他"];
const grouped = computed(() => {
  const map = new Map<string, ToolModule[]>();
  for (const t of visibleTools.value) {
    const c = t.category ?? "其他";
    if (!map.has(c)) map.set(c, []);
    map.get(c)!.push(t);
  }
  return categoryOrder
    .filter((c) => map.has(c))
    .map((c) => ({ category: c, items: map.get(c)! }));
});

function byId(id: string): ToolModule | undefined {
  return visibleTools.value.find((t) => t.id === id);
}

function onSelect(id: string) {
  emit("select", id);
  search.value = "";
}

function onSearchFocus() {
  // 聚焦时不自动打开命令面板，仅在按下 Ctrl+K 时打开
}
// 暴露给父级：在搜索框按 Ctrl+K 打开命令面板
defineExpose({
  openCommand: () => emit("open-command"),
});
void props;
</script>

<style scoped>
.sidebar {
  width: 208px;
  flex-shrink: 0;
  background: var(--ktool-bg);
}

.search-kbd {
  font-size: 11px;
  font-family: inherit;
  color: var(--ktool-text-mute);
  background: var(--ktool-surface-2);
  border: 1px solid var(--ktool-border);
  border-radius: 4px;
  padding: 1px 4px;
  line-height: 1.4;
}

/* —— 分组 —— */
.nav-group {
  margin-top: 8px;
}
.nav-group-label {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ktool-text-mute);
  text-transform: uppercase;
}

/* —— 项 —— */
.nav-item {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--ktool-radius);
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  color: var(--ktool-text-soft);
  text-align: left;
  transition: background var(--ktool-duration) var(--ktool-ease),
    color var(--ktool-duration) var(--ktool-ease);
}
.nav-item:hover {
  background: var(--ktool-surface-2);
  color: var(--ktool-text);
}
.nav-item--active {
  background: var(--ktool-brand-soft);
  color: var(--ktool-brand);
}
.nav-item--active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 3px;
  background: var(--ktool-brand);
}
.nav-item-icon {
  display: flex;
  color: var(--ktool-text-mute);
  flex-shrink: 0;
  transition: color var(--ktool-duration) var(--ktool-ease);
}
.nav-item--active .nav-item-icon {
  color: var(--ktool-brand);
}
.nav-item-name {
  font-size: 13px;
  font-weight: 500;
  flex: 1;
  min-width: 0;
}

.nav-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 12px;
  color: var(--ktool-text-mute);
  font-size: 13px;
}

/* —— 底部设置 —— */
.sidebar-footer {
  border-top: 1px solid var(--ktool-border);
}
.sidebar-settings {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--ktool-radius);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  color: var(--ktool-text-soft);
  font-size: 13px;
  font-weight: 500;
  transition: background var(--ktool-duration) var(--ktool-ease),
    color var(--ktool-duration) var(--ktool-ease);
}
.sidebar-settings:hover {
  background: var(--ktool-surface-2);
  color: var(--ktool-text);
}
</style>
