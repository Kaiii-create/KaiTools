<template>
  <ToolPage class="json-page">
    <!-- 顶部工具栏 -->
    <ToolToolbar :bordered="false" variant="subtle" class="json-toolbar">
      <span class="switch-item">
        <n-switch v-model:value="escapeOn" size="small" />
        <span class="switch-label">保留转义</span>
      </span>
      <span class="switch-item">
        <n-switch v-model:value="showLineNumbers" size="small" />
        <span class="switch-label">行号</span>
      </span>
      <span class="switch-item">
        <n-switch v-model:value="compact" size="small" />
        <span class="switch-label">压缩</span>
      </span>
      <span class="switch-item">
        <n-switch v-model:value="autoFormat" size="small" />
        <span class="switch-label">自动</span>
      </span>

      <template #side>
        <n-select v-model:value="indent" :options="indentOptions" size="small" class="indent-select" />
        <n-button size="small" secondary @click="onValidate">校验</n-button>
        <n-button size="small" type="primary" @click="onFormat">格式化</n-button>
      </template>
    </ToolToolbar>

    <!-- 左右分栏（可拖拽） -->
    <SplitWorkspace
      v-model="splitPct"
      class="json-workspace"
      input-label="输入"
      input-variant="surface"
      :output-label="compact ? '压缩结果' : '格式化结果'"
    >
      <template #input-actions>
        <n-button text size="tiny" @click="loadExample">示例 JSON</n-button>
        <n-button text size="tiny" @click="pasteInput">粘贴</n-button>
        <n-button text size="tiny" @click="input = ''">清空</n-button>
      </template>
      <template #input>
        <EditorPane
          v-model="input"
          mono
          variant="surface"
          :line-numbers="showLineNumbers"
          placeholder='在此粘贴 JSON，例如 {"name":"KTool","version":1}'
        />
      </template>
      <template #output-actions>
        <n-button text size="tiny" :disabled="!output" @click="onSwap">交换</n-button>
        <n-button text size="tiny" :disabled="!output" @click="onCopyOutput">复制</n-button>
        <n-button text size="tiny" @click="clearAll">全部清空</n-button>
      </template>
      <template #output>
        <EditorPane
          v-model="output"
          readonly
          mono
          variant="surface"
          :line-numbers="showLineNumbers"
          placeholder="格式化结果将显示在这里…"
        />
      </template>
    </SplitWorkspace>

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
import { ref, computed, watch, onMounted } from "vue";
import { NButton, NSelect, NSwitch, useMessage } from "naive-ui";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import StatusBar from "@/components/tool/StatusBar.vue";
import EditorPane from "@/components/tool/EditorPane.vue";
import SplitWorkspace from "@/components/tool/SplitWorkspace.vue";
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
const showLineNumbers = ref(false);
const compact = ref(false); // 压缩

const splitPct = ref(44);

const outputLineCount = computed(() => (output.value ? output.value.split("\n").length : 0));
const statusTone = computed(() => statusType.value);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastHistoryTime = 0;
let lastHistoryInput = "";

const SAMPLE_JSON = String.raw`{
  "project": {
    "name": "KTool",
    "description": "一款轻量、实用的开发者工具箱",
    "features": ["JSON 格式化", "压缩", "校验", "转义处理"]
  },
  "author": {
    "name": "kai",
    "officialAccount": "PHPer技术",
    "qq": "877166291",
    "github": "https://github.com/Kaiii-create/KaiTools"
  },
  "escapeExamples": {
    "newline": "第一行\n第二行",
    "tab": "名称\tKTool",
    "quote": "他说：\"Hello KTool\"",
    "backslash": "C:\\Users\\kai\\KTool",
    "unicode": "\u4f60\u597d\uff0cKTool",
    "htmlSymbols": "<div data-name=\"KTool\">& © ™</div>",
    "emoji": "🚀 ✨ 🧰"
  },
  "links": {
    "search": "https://example.com/?keyword=KTool&from=json",
    "email": "kai@example.com"
  },
  "enabled": true,
  "version": 1
}`;

// 只还原能够安全直接出现在 JSON 字符串中的 Unicode 转义。
// 控制字符、孤立代理项继续保留转义，避免把合法 JSON 变成非法文本。
function decodeEscapesSafely(s: string): string {
  let output = "";
  let inString = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '"') {
      inString = !inString;
      output += ch;
      continue;
    }
    if (!inString || ch !== "\\") {
      output += ch;
      continue;
    }
    const next = s[i + 1];
    if (next !== "u") {
      output += ch + (next ?? "");
      i++;
      continue;
    }
    const firstHex = s.slice(i + 2, i + 6);
    if (!/^[0-9a-f]{4}$/i.test(firstHex)) {
      output += ch;
      continue;
    }
    const first = parseInt(firstHex, 16);
    const secondEscape = s.slice(i + 6, i + 12);
    if (first >= 0xd800 && first <= 0xdbff && /^\\u[dD][c-fC-F][0-9a-fA-F]{2}$/.test(secondEscape)) {
      const second = parseInt(secondEscape.slice(2), 16);
      output += String.fromCodePoint(0x10000 + ((first - 0xd800) << 10) + (second - 0xdc00));
      i += 11;
      continue;
    }
    if (first < 0x20 || first === 0x22 || first === 0x5c || (first >= 0xd800 && first <= 0xdfff)) {
      output += s.slice(i, i + 6);
    } else {
      output += String.fromCodePoint(first);
    }
    i += 5;
  }
  return output;
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

async function runFormat(_silent = false) {
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
    // 开启时保留输入中的转义形式；关闭时只安全还原可显示 Unicode。
    output.value = escapeOn.value ? res.data : decodeEscapesSafely(res.data);
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
    errorMsg.value = res.error;
    status.value = res.error;
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
async function loadExample() {
  input.value = SAMPLE_JSON;
  output.value = "";
  await runFormat(false);
  message.success("示例 JSON 已载入");
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
  min-height: 48px;
  padding: 8px 12px;
  flex: 0 0 auto;
}
.json-toolbar :deep(.n-switch) {
  --n-switch-width: 46px;
}
.indent-select {
  width: 124px;
}
.json-toolbar .switch-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.json-toolbar .switch-label {
  font-size: 13px;
  line-height: 1;
  color: var(--ktool-text-soft);
  white-space: nowrap;
  user-select: none;
}
.json-workspace {
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 12px;
}
.json-status {
  margin-top: 12px;
  flex: 0 0 auto;
}
</style>
