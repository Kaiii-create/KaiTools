<template>
  <ToolPage>
    <ToolToolbar>
      <n-tabs v-model:value="mode" type="segment" size="small" @update:value="run">
        <n-tab name="base64-encode">Base64 编码</n-tab>
        <n-tab name="base64-decode">Base64 解码</n-tab>
        <n-tab name="url-encode">URL 编码</n-tab>
        <n-tab name="url-decode">URL 解码</n-tab>
        <n-tab name="uri-encode">URI 编码</n-tab>
        <n-tab name="uri-decode">URI 解码</n-tab>
      </n-tabs>
      <n-divider vertical />
      <n-button size="small" quaternary @click="onSwap" :disabled="!output">↑↓ 交换</n-button>
      <n-button size="small" quaternary @click="onCopyOutput" :disabled="!output">复制结果</n-button>
      <n-button size="small" quaternary @click="onClear">清空</n-button>
    </ToolToolbar>

    <div class="flex-1 grid grid-cols-2 gap-2 p-2 min-h-0">
      <div class="flex flex-col min-h-0">
        <div class="text-xs text-[var(--ktool-text-mute)] mb-1 px-1">输入</div>
        <n-input
          v-model:value="input"
          type="textarea"
          placeholder="输入要编码/解码的内容（自动转换）"
          class="flex-1"
          style="height: 100%"
        />
      </div>
      <div class="flex flex-col min-h-0">
        <div class="text-xs text-[var(--ktool-text-mute)] mb-1 px-1">输出</div>
        <n-input
          v-model:value="output"
          type="textarea"
          placeholder="结果"
          readonly
          class="flex-1"
          style="height: 100%"
        />
      </div>
    </div>

    <n-alert
      v-if="errorMsg"
      type="error"
      title="错误"
      class="mx-2 mb-2"
      closable
      @close="errorMsg = ''"
    >
      {{ errorMsg }}
    </n-alert>
  </ToolPage>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { NButton, NInput, NTabs, NTab, NDivider, NAlert, useMessage } from "naive-ui";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";

const message = useMessage();

type Mode = "base64-encode" | "base64-decode" | "url-encode" | "url-decode" | "uri-encode" | "uri-decode";

const mode = ref<Mode>("base64-encode");
const input = ref("");
const output = ref("");
const errorMsg = ref("");

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
        // 支持 Unicode（直接 btoa 不支持中文）
        output.value = btoa(unescape(encodeURIComponent(input.value)));
        break;
      case "base64-decode":
        output.value = decodeURIComponent(escape(atob(input.value.trim())));
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
  } catch (e) {
    output.value = "";
    errorMsg.value = `解码失败：${(e as Error).message}`;
  }
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
