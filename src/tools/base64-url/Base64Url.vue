<template>
  <ToolPage class="codec-page">
    <ToolToolbar :bordered="false" variant="subtle" class="codec-toolbar">
      <span class="toolbar-field-label">转换方式</span>
      <n-select v-model:value="mode" :options="modeOptions" size="small" class="mode-select" />

      <template #side>
        <span class="auto-hint">输入内容后自动转换</span>
      </template>
    </ToolToolbar>

    <SplitWorkspace
      v-model="splitPct"
      class="codec-workspace"
      input-label="原始内容"
      input-variant="surface"
      :output-label="`${modeLabel}结果`"
    >
      <template #input-actions>
        <n-button text size="tiny" :disabled="!input" @click="input = ''">清空</n-button>
      </template>
      <template #input>
        <EditorPane v-model="input" mono variant="surface" placeholder="在这里输入要处理的文本…" />
      </template>
      <template #output-actions>
        <n-button text size="tiny" :disabled="!output" @click="onSwap">交换</n-button>
        <n-button text size="tiny" :disabled="!output" @click="onCopyOutput">复制</n-button>
        <n-button text size="tiny" :disabled="!input && !output" @click="onClear">全部清空</n-button>
      </template>
      <template #output>
        <EditorPane v-model="output" readonly mono variant="surface" placeholder="转换结果将显示在这里…" />
      </template>
    </SplitWorkspace>

    <StatusBar class="codec-status" :tone="statusTone">
      {{ statusText }}
      <template #right>
        <span>输入 {{ input.length }} 字符</span>
        <span>输出 {{ output.length }} 字符</span>
      </template>
    </StatusBar>
  </ToolPage>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { NButton, NSelect, useMessage } from "naive-ui";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import EditorPane from "@/components/tool/EditorPane.vue";
import SplitWorkspace from "@/components/tool/SplitWorkspace.vue";
import StatusBar from "@/components/tool/StatusBar.vue";
import { parseHistoryInput, useToolHistory } from "@/composables/useToolHistory";

const message = useMessage();

type Mode = "base64-encode" | "base64-decode" | "url-encode" | "url-decode" | "uri-encode" | "uri-decode";

const mode = ref<Mode>("base64-encode");
const splitPct = ref(44);
const input = ref("");
const output = ref("");
const errorMsg = ref("");
const history = useToolHistory("base64-url", "Base64 / URL 编解码", (item) => {
  const saved = parseHistoryInput<{ mode: Mode; text: string }>(item.input);
  if (!saved) return;
  mode.value = saved.mode;
  input.value = saved.text;
  output.value = item.output;
});

const modeOptions: Array<{ label: string; value: Mode }> = [
  { label: "Base64 编码", value: "base64-encode" },
  { label: "Base64 解码", value: "base64-decode" },
  { label: "URL 编码", value: "url-encode" },
  { label: "URL 解码", value: "url-decode" },
  { label: "URI 编码", value: "uri-encode" },
  { label: "URI 解码", value: "uri-decode" },
];

const modeLabel = computed(() => modeOptions.find((item) => item.value === mode.value)?.label ?? "转换");
const statusTone = computed(() => (errorMsg.value ? "error" : output.value ? "success" : "default"));
const statusText = computed(() => errorMsg.value || (output.value ? "已自动转换" : "等待输入"));

let timer: ReturnType<typeof setTimeout> | null = null;

watch([input, mode], () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(run, 200);
});

function run() {
  errorMsg.value = "";
  if (!input.value) {
    output.value = "";
    return;
  }
  try {
    switch (mode.value) {
      case "base64-encode":
        output.value = encodeBase64(input.value);
        break;
      case "base64-decode":
        output.value = decodeBase64(input.value);
        break;
      case "url-encode":
        output.value = encodeURIComponent(input.value);
        break;
      case "url-decode":
        output.value = decodeURIComponent(input.value);
        break;
      case "uri-encode":
        output.value = encodeURI(input.value);
        break;
      case "uri-decode":
        output.value = decodeURI(input.value);
        break;
    }
    history.recordDebounced({
      title: `${modeLabel.value} · ${input.value.slice(0, 42)}`,
      input: JSON.stringify({ mode: mode.value, text: input.value }),
      output: output.value,
    });
  } catch (e) {
    output.value = "";
    errorMsg.value = `转换失败：${(e as Error).message}`;
  }
}

function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function decodeBase64(source: string): string {
  let normalized = source.replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  normalized += "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(normalized);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function onSwap() {
  if (!output.value) return;
  input.value = output.value;
  output.value = "";
}

async function onCopyOutput() {
  if (!output.value) return;
  try {
    await navigator.clipboard.writeText(output.value);
    message.success("已复制");
  } catch {
    message.error("复制失败");
  }
}

function onClear() {
  input.value = "";
  output.value = "";
  errorMsg.value = "";
}
</script>

<style scoped>
.codec-page {
  overflow: hidden;
}
.codec-page :deep(.tool-page-inner) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
}
.codec-toolbar {
  flex: 0 0 auto;
}
.toolbar-field-label {
  color: var(--ktool-text-soft);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
.mode-select {
  width: 160px;
}
.auto-hint {
  color: var(--ktool-text-mute);
  font-size: 13px;
  white-space: nowrap;
}
.codec-workspace {
  margin-top: 12px;
}
.codec-status {
  flex: 0 0 auto;
  margin-top: 12px;
}
</style>
