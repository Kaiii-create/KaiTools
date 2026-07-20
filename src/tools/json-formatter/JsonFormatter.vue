<template>
  <div class="json-formatter flex flex-col h-full">
    <!-- 工具栏 -->
    <div class="toolbar flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
      <n-select
        v-model:value="indent"
        :options="indentOptions"
        size="small"
        style="width: 110px"
      />
      <n-button size="small" type="primary" @click="onFormat">格式化</n-button>
      <n-button size="small" @click="onMinify">压缩</n-button>
      <n-button size="small" @click="onValidate">校验</n-button>
      <n-divider vertical />
      <n-button size="small" quaternary @click="onSwap" :disabled="!output">↑↓ 交换</n-button>
      <n-button size="small" quaternary @click="onCopyOutput" :disabled="!output">
        复制结果
      </n-button>
      <n-button size="small" quaternary @click="onClear">清空</n-button>
      <div class="flex-1" />
      <n-switch v-model:value="autoFormat" size="small">
        <template #checked>自动</template>
        <template #unchecked>自动</template>
      </n-switch>
      <n-tag v-if="status" :type="statusType" size="small" round>
        {{ status }}
      </n-tag>
    </div>

    <!-- 输入/输出区 -->
    <div class="flex-1 grid grid-cols-2 gap-2 p-2 min-h-0">
      <div class="flex flex-col min-h-0">
        <div class="text-xs text-gray-500 mb-1 px-1">输入</div>
        <n-input
          v-model:value="input"
          type="textarea"
          placeholder='粘贴 JSON，自动格式化。例如 {"name":"ktool","version":1}'
          :autofocus="true"
          class="flex-1"
          style="height: 100%"
          round
        />
      </div>
      <div class="flex flex-col min-h-0">
        <div class="text-xs text-gray-500 mb-1 px-1">输出</div>
        <n-input
          v-model:value="output"
          type="textarea"
          placeholder="格式化结果将显示在这里"
          readonly
          class="flex-1"
          style="height: 100%"
          round
        />
      </div>
    </div>

    <!-- 错误提示 -->
    <n-alert
      v-if="errorMsg"
      type="error"
      :title="`解析失败`"
      class="mx-2 mb-2"
      closable
      @close="errorMsg = ''"
    >
      {{ errorMsg }}
    </n-alert>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import {
  NButton,
  NInput,
  NSelect,
  NTag,
  NDivider,
  NAlert,
  NSwitch,
  useMessage,
} from "naive-ui";
import { formatJson, minifyJson, validateJson } from "@/api/json";
import { useHistoryStore } from "@/stores/history";

const message = useMessage();
const historyStore = useHistoryStore();

const indent = ref<2 | 4 | 8>(2);
const indentOptions = [
  { label: "2 空格", value: 2 },
  { label: "4 空格", value: 4 },
  { label: "Tab", value: 8 },
];

const input = ref("");
const output = ref("");
const errorMsg = ref("");
const status = ref("");
const statusType = ref<"default" | "success" | "error">("default");
const autoFormat = ref(true);

// 防抖
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// 自动格式化：输入变化或缩进变化时触发
watch([input, indent, autoFormat], () => {
  if (!autoFormat.value) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    runFormat(true);
  }, 300);
});

async function runFormat(silent = false) {
  if (!input.value.trim()) {
    output.value = "";
    errorMsg.value = "";
    status.value = "";
    return;
  }
  const res = await formatJson(input.value, indent.value);
  if (res.success) {
    output.value = res.data;
    errorMsg.value = "";
    status.value = silent ? "已格式化" : "格式化成功";
    statusType.value = "success";
    // 记录到历史（节流：同一输入 5 秒内不重复记录）
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
    // 静默模式下不弹错误提示，只在状态栏显示
    errorMsg.value = silent ? "" : res.error;
    status.value = "语法错误";
    statusType.value = "error";
  }
}

let lastHistoryTime = 0;
let lastHistoryInput = "";

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
    status.value = "失败";
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
  status.value = "";
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

function onClear() {
  input.value = "";
  output.value = "";
  errorMsg.value = "";
  status.value = "";
}
</script>

<style scoped>
.json-formatter {
  background: transparent;
}
</style>
