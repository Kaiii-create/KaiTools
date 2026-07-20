<template>
  <div class="code-formatter flex flex-col h-full">
    <!-- 工具栏 -->
    <div class="toolbar flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
      <n-select v-model:value="language" :options="languages" size="small" style="width: 120px" />
      <n-button type="primary" size="small" @click="onFormat">格式化</n-button>
      <n-button size="small" @click="onMinify">压缩</n-button>
      <n-button quaternary size="small" @click="onCopyOutput" :disabled="!output">复制结果</n-button>
      <n-button quaternary size="small" @click="onClear">清空</n-button>
      <div class="flex-1" />
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
          placeholder="输入代码"
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
          placeholder="格式化结果"
          readonly
          class="flex-1"
          style="height: 100%"
          round
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { NButton, NInput, NSelect, NTag, useMessage } from "naive-ui";
import prettier from "prettier/standalone";
import parserHtml from "prettier/plugins/html";
import parserCss from "prettier/plugins/postcss";
import parserBabel from "prettier/plugins/babel";

const message = useMessage();

const language = ref("html");
const input = ref("");
const output = ref("");
const status = ref("");
const statusType = ref<"success" | "error" | "default">("default");

const languages = [
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "JavaScript", value: "javascript" },
];

function getParser(lang: string): string {
  switch (lang) {
    case "html": return "html";
    case "css": return "css";
    case "javascript": return "babel";
    default: return "html";
  }
}

async function onFormat() {
  if (!input.value.trim()) {
    message.warning("请输入代码");
    return;
  }
  try {
    output.value = await prettier.format(input.value, {
      parser: getParser(language.value),
      plugins: [parserHtml, parserCss, parserBabel],
      semi: true,
      singleQuote: true,
      tabWidth: 2,
    });
    status.value = "格式化成功";
    statusType.value = "success";
  } catch (e) {
    output.value = "";
    status.value = "格式化失败";
    statusType.value = "error";
    message.error((e as Error).message);
  }
}

async function onMinify() {
  if (!input.value.trim()) {
    message.warning("请输入代码");
    return;
  }
  try {
    output.value = await prettier.format(input.value, {
      parser: getParser(language.value),
      plugins: [parserHtml, parserCss, parserBabel],
      semi: true,
      singleQuote: true,
      tabWidth: 0,
      printWidth: 10000,
    });
    output.value = output.value.replace(/\s+/g, " ");
    status.value = "压缩成功";
    statusType.value = "success";
  } catch (e) {
    output.value = "";
    status.value = "压缩失败";
    statusType.value = "error";
    message.error((e as Error).message);
  }
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
  status.value = "";
}
</script>
