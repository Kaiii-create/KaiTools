<template>
  <ToolPage class="diff-page">
    <ToolToolbar class="diff-toolbar">
      <span class="toolbar-field-label">对比方式</span>
      <n-select v-model:value="mode" :options="modes" size="small" class="mode-select" />

      <template #side>
        <n-button size="small" secondary @click="onSwap">交换</n-button>
        <n-button size="small" quaternary @click="onClear">清空</n-button>
        <n-button size="small" secondary :disabled="!diffLines.length" @click="onCopyResult">
          复制结果
        </n-button>
      </template>
    </ToolToolbar>

    <div class="diff-inputs">
      <section class="diff-pane">
        <header class="diff-pane-head">
          <span>原始文本</span>
          <span class="diff-count">{{ countLines(leftText) }} 行</span>
        </header>
        <EditorPane
          v-model="leftText"
          mono
          variant="surface"
          :line-numbers="true"
          placeholder="粘贴原始文本…"
        />
      </section>

      <section class="diff-pane">
        <header class="diff-pane-head">
          <span>修改后文本</span>
          <span class="diff-count">{{ countLines(rightText) }} 行</span>
        </header>
        <EditorPane
          v-model="rightText"
          mono
          variant="surface"
          :line-numbers="true"
          placeholder="粘贴修改后的文本…"
        />
      </section>
    </div>

    <section class="diff-result">
      <header class="diff-result-head">
        <span>对比结果</span>
        <div class="diff-stats">
          <span class="diff-stat diff-stat--add">+{{ additions }}</span>
          <span class="diff-stat diff-stat--del">-{{ deletions }}</span>
          <span>{{ mode === 'line' ? '行' : '字符' }}</span>
        </div>
      </header>

      <div v-if="diffLines.length" class="diff-table ktool-scroll">
        <div class="diff-table-head" aria-hidden="true">
          <span>旧</span>
          <span>新</span>
          <span></span>
          <span>内容</span>
        </div>
        <div
          v-for="(line, idx) in diffLines"
          :key="idx"
          class="diff-row"
          :class="`diff-row--${line.type}`"
        >
          <span class="diff-line-number">{{ line.oldLine ?? '' }}</span>
          <span class="diff-line-number">{{ line.newLine ?? '' }}</span>
          <span class="diff-marker">{{ line.type === 'add' ? '+' : line.type === 'del' ? '−' : '' }}</span>
          <code class="diff-content">{{ line.text || ' ' }}</code>
        </div>
      </div>

      <div v-else class="diff-empty">
        <span class="diff-empty-mark">±</span>
        <span>输入两段文本后自动显示差异</span>
      </div>
    </section>
  </ToolPage>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { NSelect, NButton, useMessage } from "naive-ui";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import EditorPane from "@/components/tool/EditorPane.vue";
import { diff_match_patch } from "diff-match-patch";
import { parseHistoryInput, useToolHistory } from "@/composables/useToolHistory";

interface Line {
  type: "add" | "del" | "same";
  text: string;
  oldLine: number | null;
  newLine: number | null;
}

const dmp = new diff_match_patch();

const message = useMessage();
const leftText = ref("");
const rightText = ref("");
const mode = ref<"line" | "char">("line");
const history = useToolHistory("code-diff", "代码对比", (item) => {
  const saved = parseHistoryInput<{ mode: "line" | "char"; left: string; right: string }>(item.input);
  if (!saved) return;
  mode.value = saved.mode;
  leftText.value = saved.left;
  rightText.value = saved.right;
});

const modes = [
  { label: "按行对比", value: "line" },
  { label: "按字符对比", value: "char" },
];

// diff-match-patch: 0=相同, -1=删除, 1=新增
const diffParts = computed<{ type: "add" | "del" | "same"; text: string }[]>(() => {
  if (!leftText.value && !rightText.value) return [];
  let raw: [number, string][];
  if (mode.value === "line") {
    const tmp = dmp.diff_linesToChars_(leftText.value, rightText.value);
    raw = dmp.diff_main(tmp.chars1, tmp.chars2, false);
    dmp.diff_cleanupSemantic(raw);
    // 注意：@types 将该方法声明为单参数，但运行时需要 lineArray
    (dmp.diff_charsToLines_ as unknown as (diffs: [number, string][], lineArray: string[]) => void)(
      raw,
      tmp.lineArray
    );
  } else {
    raw = dmp.diff_main(leftText.value, rightText.value);
    dmp.diff_cleanupSemantic(raw);
  }
  return raw.map(([op, text]) => ({
    type: op === 1 ? "add" : op === -1 ? "del" : "same",
    text,
  }));
});

const diffLines = computed<Line[]>(() => {
  if (mode.value === "char") {
    return diffParts.value.map((part) => ({
      type: part.type,
      text: part.text,
      oldLine: null,
      newLine: null,
    }));
  }

  const rows: Line[] = [];
  let oldLine = 1;
  let newLine = 1;
  for (const part of diffParts.value) {
    const lines = part.text.split("\n");
    if (lines[lines.length - 1] === "") lines.pop();
    for (const text of lines) {
      rows.push({
        type: part.type,
        text,
        oldLine: part.type === "add" ? null : oldLine,
        newLine: part.type === "del" ? null : newLine,
      });
      if (part.type !== "add") oldLine++;
      if (part.type !== "del") newLine++;
    }
  }
  return rows;
});

function countLines(text: string): number {
  if (!text) return 0;
  const count = text.split("\n").length;
  return text.endsWith("\n") ? count - 1 : count;
}

const additions = computed(() => diffParts.value
  .filter((p) => p.type === "add")
  .reduce((sum, p) => sum + (mode.value === "line" ? countLines(p.text) : Array.from(p.text).length), 0));
const deletions = computed(() => diffParts.value
  .filter((p) => p.type === "del")
  .reduce((sum, p) => sum + (mode.value === "line" ? countLines(p.text) : Array.from(p.text).length), 0));

watch([leftText, rightText, mode], () => {
  if (!leftText.value || !rightText.value) return;
  history.recordDebounced({
    title: `${mode.value === "line" ? "行" : "字符"}对比 · +${additions.value} / -${deletions.value}`,
    input: JSON.stringify({ mode: mode.value, left: leftText.value, right: rightText.value }),
    output: diffLines.value
      .map((line) => `${line.type === "add" ? "+" : line.type === "del" ? "-" : " "} ${line.text}`)
      .join("\n"),
  }, 1200);
});
function onSwap() {
  const tmp = leftText.value;
  leftText.value = rightText.value;
  rightText.value = tmp;
}

function onClear() {
  leftText.value = "";
  rightText.value = "";
}

async function onCopyResult() {
  const text = diffLines.value.map((l) => `${l.type === "add" ? "+" : l.type === "del" ? "-" : " "} ${l.text}`).join("\n");
  if (!text) {
    message.warning("无内容可复制");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    message.success("已复制");
  } catch {
    message.error("复制失败");
  }
}
</script>

<style scoped>
.diff-page {
  overflow: hidden;
}
.diff-page :deep(.tool-page-inner) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
}
.diff-toolbar {
  flex: 0 0 auto;
}
.toolbar-field-label {
  color: var(--ktool-text-soft);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
.mode-select {
  width: 140px;
}
.diff-inputs {
  flex: 0 0 42%;
  min-height: 180px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.diff-pane,
.diff-result {
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--ktool-radius-md);
  background: var(--ktool-surface);
  box-shadow: var(--ktool-shadow-sm);
}
.diff-pane-head,
.diff-result-head {
  flex: 0 0 auto;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  color: var(--ktool-text);
  font-size: 13px;
  font-weight: 600;
}
.diff-count,
.diff-stats {
  color: var(--ktool-text-mute);
  font-size: 11px;
  font-weight: 400;
}
.diff-pane :deep(.editor-pane) {
  flex: 1 1 auto;
  min-height: 0;
  margin: 0 8px 8px;
}
.diff-pane :deep(.editor-pane-body) {
  border-radius: var(--ktool-radius-md);
}
.diff-result {
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 12px;
}
.diff-result-head {
  border-bottom: 1px solid var(--ktool-border);
}
.diff-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}
.diff-stat {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}
.diff-stat--add {
  color: var(--ktool-success);
}
.diff-stat--del {
  color: var(--ktool-danger);
}
.diff-table {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 13px;
}
.diff-table-head,
.diff-row {
  display: grid;
  grid-template-columns: 42px 42px 32px minmax(0, 1fr);
}
.diff-table-head {
  position: sticky;
  top: 0;
  z-index: 1;
  color: var(--ktool-text-mute);
  background: var(--ktool-surface-2);
  font-size: 11px;
}
.diff-table-head span,
.diff-row > span,
.diff-content {
  min-width: 0;
  padding: 4px 8px;
}
.diff-line-number,
.diff-marker {
  color: var(--ktool-text-mute);
  text-align: right;
  user-select: none;
}
.diff-content {
  display: block;
  color: var(--ktool-text);
  white-space: pre-wrap;
  word-break: break-all;
}
.diff-row--add .diff-marker {
  color: var(--ktool-success);
}
.diff-row--add .diff-content {
  background: color-mix(in srgb, var(--ktool-success) 10%, transparent);
}
.diff-row--del .diff-marker {
  color: var(--ktool-danger);
}
.diff-row--del .diff-content {
  background: color-mix(in srgb, var(--ktool-danger) 10%, transparent);
}
.diff-empty {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--ktool-text-mute);
  font-size: 13px;
}
.diff-empty-mark {
  color: var(--ktool-text-mute);
  font-family: "SFMono-Regular", Consolas, monospace;
  font-size: 20px;
}
</style>
