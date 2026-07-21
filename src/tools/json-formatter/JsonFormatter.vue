<template>
  <ToolPage class="json-page">
    <!-- 顶部工具栏 -->
    <ToolToolbar :bordered="false" class="json-toolbar">
      <n-switch v-model:value="escapeOn" size="small">
        <template #checked>转义</template>
        <template #unchecked>转义</template>
      </n-switch>
      <n-switch v-model:value="showLineNumbers" size="small">
        <template #checked>行号</template>
        <template #unchecked>行号</template>
      </n-switch>
      <n-switch v-model:value="compact" size="small">
        <template #checked>压缩</template>
        <template #unchecked>压缩</template>
      </n-switch>
      <n-switch v-model:value="autoFormat" size="small">
        <template #checked>自动</template>
        <template #unchecked>自动</template>
      </n-switch>

      <template #side>
        <n-select v-model:value="indent" :options="indentOptions" size="small" class="indent-select" />
        <n-button size="small" @click="onValidate">校验</n-button>
        <n-button size="small" type="primary" @click="onFormat">格式化</n-button>
        <n-button size="small" :disabled="!output" @click="onCopyOutput">复制</n-button>
        <n-button size="small" @click="clearAll">清空</n-button>
      </template>
    </ToolToolbar>

    <!-- 左右分栏（可拖拽） -->
    <div ref="containerRef" class="json-split" :class="{ 'is-dragging': dragging }">
      <section class="json-pane" :style="{ width: `calc(${splitPct}% - 5px)` }">
        <header class="json-pane-head">
          <span>输入</span>
          <div class="flex items-center gap-2">
            <n-button text size="tiny" @click="pasteInput">粘贴</n-button>
            <n-button text size="tiny" @click="input = ''">清空</n-button>
          </div>
        </header>
        <EditorPane
          v-model="input"
          mono
          :line-numbers="showLineNumbers"
          placeholder='在此粘贴 JSON，例如 {"name":"KTool","version":1}'
        />
      </section>

      <div class="json-divider" @mousedown.prevent="startDrag">
        <span class="json-divider-grip" />
      </div>

      <section class="json-pane" :style="{ width: `calc(${100 - splitPct}% - 5px)` }">
        <header class="json-pane-head">
          <span>输出{{ compact ? '（压缩）' : '' }}</span>
          <div class="flex items-center gap-2">
            <n-button text size="tiny" :disabled="!output" @click="onSwap">交换</n-button>
          </div>
        </header>
        <EditorPane
          v-model="output"
          readonly
          mono
          :line-numbers="showLineNumbers"
          placeholder="格式化结果将显示在这里…"
        />
      </section>
    </div>

    <StatusBar class="json-status" :tone="statusTone">
      {{ status }}
      <template #right>
        <span>输入 {{ input.length }} 字符</span>
        <span>输出 {{ output.length }} 字符</span>
        <span>{{ outputLineCount }} 行</span>
      </template>
    </StatusBar>
  </ToolPage>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { NButton, NSelect, NSwitch, useMessage } from "naive-ui";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import StatusBar from "@/components/tool/StatusBar.vue";
import EditorPane from "@/components/tool/EditorPane.vue";
import { formatJson, minifyJson } from "@/api/json";
import { useHistoryStore } from "@/stores/history";

const message = useMessage();
const historyStore = useHistoryStore();

const indent = ref<2 | 4 | 8>(2);
const indentOptions = [
  { label: "缩进 2 空格", value: 2 },
  { label: "缩进 4 空格", value: 4 },
  { label: "Tab 缩进", value: 8 },
];

const input = ref("");
const output = ref("");
const errorMsg = ref("");
const status = ref("");
const statusType = ref<"default" | "success" | "error">("default");
const autoFormat = ref(true);
const escapeOn = ref(true); // 转义默认开启
const showLineNumbers = ref(true);
const compact = ref(false); // 压缩

const splitPct = ref(50); // 默认 5:5
const containerRef = ref<HTMLElement | null>(null);
const dragging = ref(false);

const outputLineCount = computed(() => (output.value ? output.value.split("\n").length : 0));
const statusTone = computed(() => statusType.value);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastHistoryTime = 0;
let lastHistoryInput = "";

// 把输出中的 Unicode 转义还原为可读字符（如 \u003e -> >），用于右侧“显示正常”
function decodeEscapes(s: string): string {
  return s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) =>
    String.fromCodePoint(parseInt(h, 16))
  );
}

watch(
  [input, indent, autoFormat, escapeOn, compact],
  () => {
    if (!autoFormat.value) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runFormat(true), 300);
  },
  { flush: "post" }
);

async function runFormat(silent = false) {
  if (!input.value.trim()) {
    output.value = "";
    errorMsg.value = "";
    status.value = "等待输入";
    statusType.value = "default";
    return;
  }
  // 直接按原始 JSON 解析，不做整体反转义（避免把 \" \\n 等误转为真实字符而破坏语法）
  const text = input.value;
  const res = compact.value
    ? await minifyJson(text)
    : await formatJson(text, indent.value);
  if (res.success) {
    // “转义”开启：把 \uXXXX 等还原为可读字符（显示正常）；
    // 关闭：保持后端原始序列化结果，仅还原输入中原本就转义的序列，
    // 不再对未转义的字符（如中文）额外编码。
    output.value = escapeOn.value ? decodeEscapes(res.data) : res.data;
    errorMsg.value = "";
    status.value = compact.value ? "已压缩" : "格式化成功";
    statusType.value = "success";
    const now = Date.now();
    if (now - lastHistoryTime > 5000 && input.value !== lastHistoryInput) {
      historyStore.add({
        toolId: "json-formatter",
        toolName: "JSON 格式化",
        title: input.value.slice(0, 60),
        input: input.value,
        output: res.data,
      });
      lastHistoryTime = now;
      lastHistoryInput = input.value;
    }
  } else {
    errorMsg.value = silent ? "" : res.error;
    status.value = "JSON 语法错误";
    statusType.value = "error";
  }
}

async function onFormat() {
  await runFormat(false);
}
async function onValidate() {
  await runFormat(false);
  if (statusType.value === "success") message.success("JSON 合法");
  else message.error(errorMsg.value || "JSON 语法错误");
}
async function onCopyOutput() {
  if (!output.value) return;
  try {
    await navigator.clipboard.writeText(output.value);
    message.success("已复制输出");
  } catch {
    message.error("复制失败");
  }
}
function onSwap() {
  if (!output.value) return;
  input.value = output.value;
  output.value = "";
  message.info("已交换，输出已回填到输入");
}
async function pasteInput() {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      input.value = text;
      message.success("已粘贴");
    }
  } catch {
    message.error("粘贴失败（请检查剪贴板权限）");
  }
}
function clearAll() {
  input.value = "";
  output.value = "";
  errorMsg.value = "";
  status.value = "等待输入";
  statusType.value = "default";
}

// —— 历史记录恢复 ——
function restoreFromHistory(item: { input?: string }) {
  if (item.input == null) return;
  input.value = item.input;
  output.value = "";
  runFormat(false).catch(() => {});
  historyStore.clearRestore();
}
onMounted(() => {
  const p = historyStore.pendingRestore;
  if (p && p.toolId === "json-formatter") restoreFromHistory(p);
});
watch(
  () => historyStore.pendingRestore,
  (item) => {
    if (item && item.toolId === "json-formatter") restoreFromHistory(item);
  }
);

// —— 拖拽分栏 ——
function startDrag() {
  dragging.value = true;
  document.addEventListener("mousemove", onDrag);
  document.addEventListener("mouseup", stopDrag);
  document.body.style.userSelect = "none";
  document.body.style.cursor = "col-resize";
}
function onDrag(e: MouseEvent) {
  if (!dragging.value || !containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  let pct = ((e.clientX - rect.left) / rect.width) * 100;
  pct = Math.min(90, Math.max(10, pct));
  splitPct.value = pct;
}
function stopDrag() {
  dragging.value = false;
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
  document.body.style.userSelect = "";
  document.body.style.cursor = "";
}
onUnmounted(() => {
  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", stopDrag);
});
</script>

<style scoped>
.json-page {
  overflow: hidden;
}
.json-page :deep(.tool-page-inner) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
}
.json-toolbar {
  min-height: 46px;
  padding: 7px 8px;
  border-bottom: 1px solid var(--ktool-border);
  flex: 0 0 auto;
}
.json-toolbar :deep(.n-switch) {
  --n-switch-width: 46px;
}
.indent-select {
  width: 124px;
}

.json-split {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  width: 100%;
  margin-top: 12px;
  user-select: none;
}
.json-split.is-dragging {
  cursor: col-resize;
}
.json-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  background: var(--ktool-surface);
  border: 1px solid var(--ktool-border);
  border-radius: var(--ktool-radius);
  box-shadow: var(--ktool-shadow-sm);
  overflow: hidden;
}
.json-pane-head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 12px;
  border-bottom: 1px solid var(--ktool-border);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ktool-text-soft);
}
.json-pane :deep(.editor-pane) {
  flex: 1 1 auto;
  min-height: 0;
}
.json-divider {
  flex: 0 0 10px;
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.json-divider::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  transform: translateX(-50%);
  background: var(--ktool-border);
}
.json-divider-grip {
  width: 4px;
  height: 38px;
  border-radius: 4px;
  background: var(--ktool-border-strong);
  transition: background 0.15s ease;
}
.json-divider:hover .json-divider-grip,
.json-split.is-dragging .json-divider-grip {
  background: var(--ktool-brand);
}
.json-status {
  margin-top: 10px;
  flex: 0 0 auto;
  border: 1px solid var(--ktool-border);
  border-radius: var(--ktool-radius-sm);
}
</style>
