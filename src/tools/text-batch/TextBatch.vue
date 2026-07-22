<template>
  <ToolPage class="tb-page">
    <ToolToolbar>
      <n-button size="small" @click="removeEmpty">去空行</n-button>
      <n-button size="small" @click="dedupe">去重</n-button>
      <n-button size="small" @click="sortAsc">升序</n-button>
      <n-button size="small" @click="sortDesc">降序</n-button>
      <n-button size="small" @click="toUpper">大写</n-button>
      <n-button size="small" @click="toLower">小写</n-button>
      <n-button size="small" @click="reverseLines">反转行</n-button>
      <n-button size="small" @click="mergeOne">合并一行</n-button>
      <n-button size="small" @click="resetSource">源=输入</n-button>
      <n-button size="small" @click="clearAll">清空</n-button>
    </ToolToolbar>

    <div class="tb-secondary">
      <span class="tb-label">查找替换</span>
      <n-input v-model:value="findText" placeholder="查找" size="small" class="tb-in" />
      <n-input v-model:value="replaceText" placeholder="替换" size="small" class="tb-in" />
      <n-button size="small" @click="doReplace">替换</n-button>
      <n-divider vertical />
      <span class="tb-label">前后缀</span>
      <n-input v-model:value="prefix" placeholder="前缀" size="small" class="tb-in" />
      <n-input v-model:value="suffix" placeholder="后缀" size="small" class="tb-in" />
      <n-button size="small" @click="applyAffix">应用</n-button>
    </div>

    <div class="tb-body">
      <section class="tb-pane">
        <header class="tb-pane-head">输入（源）</header>
        <EditorPane v-model="input" mono :line-numbers="true" placeholder="在此粘贴待处理文本…" />
      </section>
      <section class="tb-pane">
        <header class="tb-pane-head">输出（{{ outputLineCount }} 行）</header>
        <EditorPane v-model="output" readonly mono :line-numbers="true" placeholder="处理结果将显示在这里…" />
      </section>
    </div>
  </ToolPage>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { NButton, NInput, NDivider } from "naive-ui";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import EditorPane from "@/components/tool/EditorPane.vue";
import { useToolHistory } from "@/composables/useToolHistory";

const input = ref("");
const output = ref("");
const hasOutput = ref(false);
const findText = ref("");
const replaceText = ref("");
const prefix = ref("");
const suffix = ref("");
const history = useToolHistory("text-batch", "文本批量处理", (item) => {
  input.value = item.input;
  output.value = item.output;
  hasOutput.value = !!item.output;
});

const outputLineCount = computed(() => (output.value ? output.value.split("\n").length : 0));

// 链式处理：若输出非空则以输出为源，否则以输入为源
function getSource(): string {
  return hasOutput.value ? output.value : input.value;
}
function setResult(text: string, action: string) {
  const source = getSource();
  output.value = text;
  hasOutput.value = true;
  history.record({ title: action, input: source, output: text });
}
function lines(): string[] {
  return getSource().split(/\r?\n/);
}

function removeEmpty() {
  setResult(lines().filter((l) => l.trim() !== "").join("\n"), "移除空行");
}
function dedupe() {
  setResult([...new Set(lines())].join("\n"), "文本去重");
}
function sortAsc() {
  setResult([...lines()].sort((a, b) => a.localeCompare(b, "zh-CN")).join("\n"), "升序排列");
}
function sortDesc() {
  setResult([...lines()].sort((a, b) => b.localeCompare(a, "zh-CN")).join("\n"), "降序排列");
}
function toUpper() {
  setResult(lines().map((l) => l.toUpperCase()).join("\n"), "转为大写");
}
function toLower() {
  setResult(lines().map((l) => l.toLowerCase()).join("\n"), "转为小写");
}
function reverseLines() {
  setResult([...lines()].reverse().join("\n"), "行序反转");
}
function mergeOne() {
  setResult(lines().join(""), "合并为一行");
}
function doReplace() {
  if (!findText.value) return;
  setResult(getSource().split(findText.value).join(replaceText.value), "查找替换");
}
function applyAffix() {
  setResult(lines().map((l) => prefix.value + l + suffix.value).join("\n"), "添加前后缀");
}
function resetSource() {
  output.value = "";
  hasOutput.value = false;
}
function clearAll() {
  input.value = "";
  output.value = "";
  hasOutput.value = false;
}
</script>

<style scoped>
.tb-page :deep(.tool-page-inner) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
}
.tb-secondary {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 10px;
  background: var(--ktool-surface);
  border: 1px solid var(--ktool-border);
  border-radius: var(--ktool-radius);
}
.tb-label {
  font-size: 12.5px;
  color: var(--ktool-text-soft);
}
.tb-in {
  width: 130px;
}
.tb-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  gap: 12px;
  margin-top: 12px;
}
.tb-pane {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ktool-border);
  border-radius: var(--ktool-radius);
  background: var(--ktool-surface);
  overflow: hidden;
}
.tb-pane-head {
  flex: 0 0 auto;
  padding: 7px 12px;
  border-bottom: 1px solid var(--ktool-border);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ktool-text-soft);
}
.tb-pane :deep(.editor-pane) {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
