<template>
  <aside class="sidebar flex flex-col h-full">
    <!-- 品牌区域 -->
    <div class="sidebar-brand flex items-center gap-2.5 px-4 h-14 shrink-0">
      <div class="brand-mark">K</div>
      <div class="min-w-0 leading-tight">
        <div class="brand-name">KTool</div>
        <div class="brand-sub">开发者工具箱</div>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="px-3 pb-2 shrink-0">
      <n-input
        v-model:value="search"
        placeholder="搜索工具"
        size="small"
        clearable
        @focus="onSearchFocus"
      >
        <template #prefix>
          <n-icon :size="15" class="text-[var(--ktool-text-mute)]">
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
          <span class="nav-item-icon"><n-icon :component="t.icon" :size="17" /></span>
          <span class="nav-item-name truncate">{{ t.name }}</span>
        </button>
        <div v-if="filtered.length === 0" class="nav-empty">
          <n-icon :size="22"><SearchOutline /></n-icon>
          <span>没有匹配的工具</span>
        </div>
      </template>

      <!-- 常规态：收藏 + 分类 -->
      <template v-else>
        <!-- 收藏 -->
        <div v-if="favItems.length" class="nav-group">
          <div class="nav-group-label">
            <n-icon :size="13"><Star /></n-icon> 收藏
          </div>
          <button
            v-for="t in favItems"
            :key="t.id"
            class="nav-item"
            :class="{ 'nav-item--active': t.id === activeId }"
            @click="onSelect(t.id)"
          >
            <span class="nav-item-icon"><n-icon :component="t.icon" :size="17" /></span>
            <span class="nav-item-name truncate">{{ t.name }}</span>
            <span class="nav-item-star nav-item-star--on" @click.stop="onToggleFav(t.id)">
              <n-icon :size="14"><Star /></n-icon>
            </span>
          </button>
        </div>

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
            <span class="nav-item-icon"><n-icon :component="t.icon" :size="17" /></span>
            <span class="nav-item-name truncate">{{ t.name }}</span>
            <span
              class="nav-item-star"
              :class="{ 'nav-item-star--on': isFav(t.id) }"
              @click.stop="onToggleFav(t.id)"
            >
              <n-icon :size="14"><Star /></n-icon>
            </span>
          </button>
        </div>
      </template>
    </nav>

    <!-- 底部：设置 -->
    <div class="sidebar-footer px-2 pb-3 pt-2 shrink-0">
      <button class="sidebar-settings" @click="$emit('open-settings')">
        <n-icon :size="18"><SettingsOutline /></n-icon>
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
  Star,
} from "@vicons/ionicons5";
import { tools, searchTools } from "@/tools/registry";
import type { ToolCategory, ToolModule } from "@/tools/types";
import { useNavStore } from "@/stores/nav";

const props = defineProps<{ activeId: string }>();
const emit = defineEmits<{
  (e: "select", id: string): void;
  (e: "open-settings"): void;
  (e: "open-command"): void;
}>();

const navStore = useNavStore();
const search = ref("");

const filtered = computed(() => searchTools(search.value));

const categoryOrder: ToolCategory[] = ["编码", "时间", "加密", "转换", "其他"];
const grouped = computed(() => {
  const map = new Map<string, ToolModule[]>();
  for (const t of tools) {
    const c = t.category ?? "其他";
    if (!map.has(c)) map.set(c, []);
    map.get(c)!.push(t);
  }
  return categoryOrder
    .filter((c) => map.has(c))
    .map((c) => ({ category: c, items: map.get(c)! }));
});

function byId(id: string): ToolModule | undefined {
  return tools.find((t) => t.id === id);
}

const favItems = computed(() =>
  navStore.favorites.map(byId).filter((t): t is ToolModule => !!t)
);
function isFav(id: string) {
  return navStore.isFavorite(id);
}
function onToggleFav(id: string) {
  navStore.toggleFavorite(id);
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
  width: 232px;
  flex-shrink: 0;
  background: var(--ktool-surface);
  border-right: 1px solid var(--ktool-border);
}

/* —— 品牌 —— */
.brand-mark {
  width: 30px;
  height: 30px;
  border-radius: var(--ktool-radius);
  background: var(--ktool-brand);
  color: var(--ktool-brand-contrast);
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: -0.02em;
}
.brand-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--ktool-text);
  line-height: 1.1;
}
.brand-sub {
  font-size: 11px;
  color: var(--ktool-text-mute);
  line-height: 1.2;
}

.search-kbd {
  font-size: 10px;
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
  gap: 5px;
  padding: 6px 10px 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ktool-text-mute);
  text-transform: uppercase;
}

/* —— 项 —— */
.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
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
.nav-item--active .nav-item-icon {
  color: var(--ktool-brand);
}
.nav-item-icon {
  display: flex;
  color: var(--ktool-text-mute);
  flex-shrink: 0;
}
.nav-item-name {
  font-size: 13px;
  font-weight: 500;
  flex: 1;
  min-width: 0;
}
.nav-item-star {
  display: flex;
  color: var(--ktool-text-mute);
  opacity: 0;
  flex-shrink: 0;
  transition: opacity var(--ktool-duration) var(--ktool-ease),
    color var(--ktool-duration) var(--ktool-ease);
}
.nav-item:hover .nav-item-star {
  opacity: 0.7;
}
.nav-item-star:hover {
  color: var(--ktool-brand);
}
.nav-item-star--on {
  opacity: 1;
  color: var(--ktool-brand);
}

.nav-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 28px 12px;
  color: var(--ktool-text-mute);
  font-size: 12.5px;
}

/* —— 底部设置 —— */
.sidebar-footer {
  border-top: 1px solid var(--ktool-border);
}
.sidebar-settings {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
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
