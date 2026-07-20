<template>
  <div class="app-shell flex h-full w-full">
    <!-- 侧边栏：工具图标列表 -->
    <aside
      class="sidebar w-[64px] flex flex-col items-center py-3 gap-1 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
    >
      <div
        class="logo w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg mb-2"
        style="background: var(--ktool-brand)"
      >
        K
      </div>
      <n-tooltip
        v-for="tool in tools"
        :key="tool.id"
        placement="right"
        :show-arrow="true"
      >
        <template #trigger>
          <button
            class="tool-icon w-11 h-11 rounded-lg flex items-center justify-center transition-colors"
            :class="
              activeToolId === tool.id
                ? 'bg-brand-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
            "
            @click="onSelectTool(tool.id)"
          >
            <n-icon :component="tool.icon" :size="22" />
          </button>
        </template>
        {{ tool.name }}
      </n-tooltip>
      <div class="flex-1" />
      <n-tooltip placement="right">
        <template #trigger>
          <n-button
            circle
            size="small"
            class="mb-2"
            @click="showSettings = true"
          >
            <template #icon>
              <n-icon :size="20">
                <SettingsIcon />
              </n-icon>
            </template>
          </n-button>
        </template>
        设置
      </n-tooltip>
    </aside>

    <!-- 中间：搜索 + 工具列表 -->
    <section
      class="middle w-[240px] flex flex-col border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950"
    >
      <div class="p-3">
        <n-input
          v-model:value="search"
          placeholder="搜索工具 (Ctrl+K)"
          clearable
          size="small"
          @keydown="onSearchKeydown"
        >
          <template #prefix>
            <n-icon>
              <SearchIcon />
            </n-icon>
          </template>
        </n-input>
      </div>
      <div class="flex-1 overflow-y-auto px-2 pb-3">
        <div
          v-for="tool in filteredTools"
          :key="tool.id"
          class="tool-item px-3 py-2 rounded-lg cursor-pointer mb-1 transition-colors"
          :class="
            activeToolId === tool.id
              ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
          "
          @click="onSelectTool(tool.id)"
        >
          <div class="flex items-center gap-2">
            <n-icon :component="tool.icon" :size="16" />
            <span class="text-sm font-medium">{{ tool.name }}</span>
          </div>
          <div v-if="tool.description" class="text-xs text-gray-400 mt-0.5 truncate">
            {{ tool.description }}
          </div>
        </div>
        <div
          v-if="filteredTools.length === 0"
          class="text-center text-sm text-gray-400 py-8"
        >
          没有匹配的工具
        </div>
      </div>
    </section>

    <!-- 主工作区 -->
    <main class="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-950">
      <header
        class="header h-12 flex items-center px-4 border-b border-gray-200 dark:border-gray-700"
      >
        <h1 class="text-base font-semibold text-gray-800 dark:text-gray-100">
          {{ activeTool?.name ?? "KTool" }}
        </h1>
        <span
          v-if="activeTool?.description"
          class="text-xs text-gray-400 ml-3"
        >
          {{ activeTool.description }}
        </span>
        <div class="flex-1" />
        <n-button
          quaternary
          size="small"
          @click="showHistory = !showHistory"
          :type="showHistory ? 'primary' : 'default'"
        >
          <template #icon>
            <n-icon>
              <HistoryIcon />
            </n-icon>
          </template>
          历史记录
        </n-button>
        <n-button quaternary circle size="small" @click="onToggleTheme">
          <template #icon>
            <n-icon>
              <MoonIcon v-if="!isDark" />
              <SunnyIcon v-else />
            </n-icon>
          </template>
        </n-button>
      </header>
      <div class="flex-1 flex min-h-0">
        <div class="flex-1 min-h-0 p-3">
          <component
            v-if="activeTool"
            :is="activeTool.component"
            class="h-full"
          />
          <div
            v-else
            class="h-full flex items-center justify-center text-gray-400"
          >
            请选择一个工具
          </div>
        </div>
        <!-- 历史记录面板 -->
        <transition name="slide">
          <div
            v-if="showHistory"
            class="history-panel w-[320px] border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 flex flex-col"
          >
            <div class="p-3 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between">
                <span class="font-medium">历史记录</span>
                <n-button size="tiny" text @click="clearHistory">清空</n-button>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-2">
              <div
                v-for="(item, index) in history"
                :key="index"
                class="history-item p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 mb-1"
                @click="onHistoryClick(item)"
              >
                <div class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                  {{ item.title }}
                </div>
                <div class="text-xs text-gray-500 truncate">{{ item.input }}</div>
                <div class="text-xs text-gray-400 mt-1">
                  {{ formatTime(item.createdAt) }}
                </div>
              </div>
              <div v-if="history.length === 0" class="text-center text-gray-400 py-8">
                暂无历史记录
              </div>
            </div>
          </div>
        </transition>
      </div>
    </main>

    <!-- 设置弹窗 -->
    <n-modal v-model:show="showSettings" title="设置" :width="400">
      <n-space vertical :size="16">
        <n-card title="关于" size="small">
          <div class="text-sm">
            <div>版本：v0.1.0</div>
            <div>项目：KTool</div>
            <div class="mt-2">
              <a
                href="https://github.com"
                target="_blank"
                class="text-blue-500 hover:underline"
              >
                GitHub 仓库（即将上线）
              </a>
            </div>
          </div>
        </n-card>
        <n-card title="主题设置" size="small">
          <n-radio-group v-model:value="themeMode" size="small">
            <n-radio-button :value="'light'">浅色</n-radio-button>
            <n-radio-button :value="'dark'">深色</n-radio-button>
            <n-radio-button :value="'auto'">跟随系统</n-radio-button>
          </n-radio-group>
        </n-card>
        <n-card title="快捷键" size="small">
          <div class="text-sm text-gray-500">
            <div>Ctrl+K：聚焦搜索</div>
            <div>Alt+Space：唤起应用（设置中可自定义）</div>
          </div>
        </n-card>
      </n-space>
      <template #footer>
        <n-button @click="showSettings = false">关闭</n-button>
        <n-button type="primary" @click="showSettings = false">保存</n-button>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  NIcon,
  NInput,
  NButton,
  NTooltip,
  NModal,
  NCard,
  NSpace,
  NRadioGroup,
  NRadioButton,
  darkTheme,
  type GlobalTheme,
} from "naive-ui";
import {
  Search as SearchIcon,
  Moon as MoonIcon,
  Sunny as SunnyIcon,
  Settings as SettingsIcon,
  Time as HistoryIcon,
} from "@vicons/ionicons5";
import { tools, searchTools } from "@/tools/registry";
import { useThemeStore } from "@/stores/theme";
import { useHistoryStore } from "@/stores/history";

const themeStore = useThemeStore();
const historyStore = useHistoryStore();
const isDark = computed(() => themeStore.isDark);
const themeMode = computed({
  get: () => themeStore.mode,
  set: (val: string) => themeStore.setMode(val as "light" | "dark" | "auto"),
});

const search = ref("");
const activeToolId = ref<string>(tools[0]?.id ?? "");
const showHistory = ref(false);
const showSettings = ref(false);

const activeTool = computed(
  () => tools.find((t) => t.id === activeToolId.value) ?? null
);
const filteredTools = computed(() => searchTools(search.value));

// 历史记录来自 store（响应式，自动刷新）
const history = computed(() => historyStore.items);

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return new Date(timestamp).toLocaleDateString("zh-CN");
}

function onSelectTool(id: string) {
  activeToolId.value = id;
  search.value = "";
}

function onToggleTheme() {
  themeStore.setMode(isDark.value ? "light" : "dark");
}

function onHistoryClick(item: { toolId: string }) {
  activeToolId.value = item.toolId;
}

function clearHistory() {
  historyStore.clear();
}

function onSearchKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
  }
}

// 全局快捷键 Ctrl+K 聚焦搜索
function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    const input = document.querySelector<HTMLInputElement>(
      ".middle input[type='text'], .middle textarea"
    );
    input?.focus();
  }
}

onMounted(() => window.addEventListener("keydown", onGlobalKeydown));
onUnmounted(() => window.removeEventListener("keydown", onGlobalKeydown));

// 暴露给 App.vue 用的主题
defineExpose<{ theme: GlobalTheme | null }>({
  theme: computed(() => (isDark.value ? darkTheme : null)) as unknown as GlobalTheme,
});
</script>

<style scoped>
.app-shell {
  height: 100vh;
}
.tool-icon {
  border: none;
  cursor: pointer;
}
.tool-item {
  user-select: none;
}
.slide-enter-active,
.slide-leave-active {
  transition: width 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  width: 0;
}
.history-panel {
  overflow: hidden;
}
</style>
