<template>
  <ToolPage class="json-page">
    <div class="json-stack">
      <ToolPanel title="输入" bordered flush class="json-panel">
        <template #header-extra>
          <div class="json-header-actions">
            <n-button text size="tiny" @click="pasteInput">粘贴</n-button>
            <n-button text size="tiny" :disabled="!input" @click="clearInput">清空</n-button>
          </div>
        </template>

        <EditorPane
          v-model="input"
          mono
          line-numbers
          placeholder='在此粘贴 JSON，例如 {"name":"KTool","version":1}'
        />

        <ToolToolbar :bordered="false" class="json-toolbar">
          <n-switch v-model:value="autoFormat" size="small">
            <template #checked>自动格式化</template>
            <template #unchecked>自动格式化</template>
          </n-switch>

          <template #side>
            <n-select
              v-model:value="indent"
              :options="indentOptions"
              size="small"
              class="indent-select"
            />
            <n-button size="small" @click="onValidate">校验</n-button>
            <n-button size="small" @click="onMinify">压缩</n-button>
            <n-button size="small" type="primary" @click="onFormat">格式化</n-button>
          </template>
        </ToolToolbar>
      </ToolPanel>

      <ToolPanel title="输出" bordered flush class="json-panel">
        <template #header-extra>
          <div class="json-header-actions">
            <n-button text size="tiny" :disabled="!output" @click="onSwap">交换到输入</n-button>
            <n-button text size="tiny" :disabled="!output" @click="onCopyOutput">复制结果</n-button>
          </div>
        </template>

        <EditorPane
          v-model="output"
          readonly
          mono
          line-numbers
          placeholder="格式化结果将显示在这里…"
        />
      </ToolPanel>
    </div>

    <StatusBar :tone="statusTone" class="json-status" :title="errorMsg || status">
      {{ errorMsg || status || "等待输入" }}
      <template #right>
        <span>行数 {{ outputLineCount }}</span>
        <span>输入 {{ input.length }} 字符</span>
        <span>输出 {{ output.length }} 字符</span>
      </template>
    </StatusBar>
  </ToolPage>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { NButton, NSelect, NSwitch, useMessage } from "naive-ui";
import { formatJson, minifyJson, validateJson } from "@/api/json";
import { useHistoryStore } from "@/stores/history";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolPanel from "@/components/tool/ToolPanel.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import EditorPane from "@/components/tool/EditorPane.vue";
import StatusBar from "@/components/tool/StatusBar.vue";

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
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastHistoryTime = 0;
let lastHistoryInput = "";

const outputLineCount = computed(() => (output.value ? output.value.split("\n").length : 0));
const statusTone = computed<"default" | "success" | "error">(() => statusType.value);

watch([input, indent, autoFormat], () => {
  if (!autoFormat.value) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => runFormat(true), 300);
});

async function runFormat(silent = false) {
  if (!input.value.trim()) {
    output.value = "";
    errorMsg.value = "";
    status.value = "";
    statusType.value = "default";
    return;
  }

  const res = await formatJson(input.value, indent.value);
  if (res.success) {
    output.value = res.data;
    errorMsg.value = "";
    status.value = silent ? "已格式化" : "格式化成功";
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
    status.value = "语法错误";
    statusType.value = "error";
  }
}

async function onFormat() {
  if (!input.value.trim()) {
    message.warning("请输入 JSON 内容");
    return;
  }
  await runFormat(false);
}

async function onMinify() {
  if (!input.value.trim()) {
    message.warning("请输入 JSON 内容");
    return;
  }
  const res = await minifyJson(input.value);
  if (res.success) {
    output.value = res.data;
    errorMsg.value = "";
    status.value = "压缩成功";
    statusType.value = "success";
  } else {
    errorMsg.value = res.error;
    status.value = "压缩失败";
    statusType.value = "error";
  }
}

async function onValidate() {
  if (!input.value.trim()) {
    message.warning("请输入 JSON 内容");
    return;
  }
  const res = await validateJson(input.value);
  if (res.success) {
    output.value = input.value;
    errorMsg.value = "";
    status.value = res.data;
    statusType.value = "success";
    message.success(res.data);
  } else {
    errorMsg.value = res.error;
    status.value = "校验失败";
    statusType.value = "error";
    message.error(res.error);
  }
}

function onSwap() {
  if (!output.value) return;
  input.value = output.value;
  output.value = "";
  status.value = "已交换到输入";
  statusType.value = "default";
}

async function onCopyOutput() {
  if (!output.value) return;
  try {
    await navigator.clipboard.writeText(output.value);
    message.success("已复制到剪贴板");
  } catch {
    message.error("复制失败");
  }
}

async function pasteInput() {
  try {
    input.value = await navigator.clipboard.readText();
  } catch {
    message.error("无法读取剪贴板");
  }
}

function clearInput() {
  input.value = "";
  output.value = "";
  errorMsg.value = "";
  status.value = "";
  statusType.value = "default";
}
</script>

<style scoped>
.json-page {
  overflow: hidden;
}
.json-page :deep(.tool-page-inner) {
  height: 100%;
  min-height: 0;
  padding: 12px 16px;
}
.json-stack {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(170px, 1fr) minmax(170px, 1fr);
  gap: 10px;
}
.json-panel {
  background: var(--ktool-surface);
  box-shadow: var(--ktool-shadow-sm);
}
.json-panel :deep(.tool-panel-head) {
  min-height: 40px;
  padding: 7px 12px;
}
.json-panel :deep(.tool-panel-body) {
  display: flex;
  flex-direction: column;
}
.json-panel :deep(.editor-pane-body) {
  border-radius: 0;
}
.json-toolbar {
  min-height: 46px;
  padding: 7px 10px;
  border-top: 1px solid var(--ktool-border);
}
.json-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.indent-select {
  width: 126px;
}
.json-status {
  margin-top: 10px;
  border: 1px solid var(--ktool-border);
  border-radius: var(--ktool-radius-sm);
}

@media (max-width: 980px) {
  .json-page :deep(.tool-page-inner) {
    padding-inline: 12px;
  }
  .json-toolbar :deep(.tool-toolbar-main) {
    display: none;
  }
  .json-status :deep(.status-bar-right span:first-child) {
    display: none;
  }
}
</style>
