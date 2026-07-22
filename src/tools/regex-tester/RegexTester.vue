<template>
  <ToolPage class="regex-page">
    <ToolToolbar>
      <div class="regex-row">
        <span class="regex-slash">/</span>
        <n-input v-model:value="pattern" placeholder="正则表达式" class="regex-input" />
        <span class="regex-slash">/</span>
        <n-checkbox-group v-model:value="flagArr" class="regex-flags">
          <n-checkbox value="g" label="g" />
          <n-checkbox value="i" label="i" />
          <n-checkbox value="m" label="m" />
          <n-checkbox value="s" label="s" />
        </n-checkbox-group>
      </div>
      <template #side>
        <n-tag v-if="errorMsg" type="error" size="small">{{ errorMsg }}</n-tag>
        <n-tag v-else type="success" size="small">匹配 {{ matches.length }} 处</n-tag>
      </template>
    </ToolToolbar>

    <div class="regex-body">
      <section class="regex-pane">
        <header class="regex-pane-head">测试文本</header>
        <EditorPane v-model="text" mono :line-numbers="true" placeholder="在此输入待匹配的文本…" />
      </section>
      <section class="regex-pane">
        <header class="regex-pane-head">高亮结果</header>
        <pre class="regex-highlight" v-html="highlighted"></pre>
      </section>
    </div>

    <div class="regex-matches" v-if="matches.length">
      <div class="regex-matches-head">匹配详情（共 {{ matches.length }} 处）</div>
      <div v-for="(m, i) in matches" :key="i" class="regex-match-item">
        <span class="regex-match-idx">#{{ i + 1 }}</span>
        <code class="regex-match-val">{{ m.value }}</code>
        <span class="regex-match-pos">@{{ m.index }}</span>
        <span v-if="m.groups.length" class="regex-match-groups">
          <code v-for="g in m.groups" :key="g.i" class="regex-group">${{ g.i + 1 }}={{ g.v === undefined ? "未匹配" : g.v === "" ? "空字符串" : g.v }}</code>
        </span>
      </div>
    </div>
  </ToolPage>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { NInput, NCheckbox, NCheckboxGroup, NTag } from "naive-ui";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import EditorPane from "@/components/tool/EditorPane.vue";
import { parseHistoryInput, useToolHistory } from "@/composables/useToolHistory";

const pattern = ref("");
const flagArr = ref<string[]>(["g"]);
const text = ref("");
const history = useToolHistory("regex-tester", "正则测试器", (item) => {
  const saved = parseHistoryInput<{ pattern: string; flags: string[]; text: string }>(item.input);
  if (!saved) return;
  pattern.value = saved.pattern;
  flagArr.value = saved.flags;
  text.value = saved.text;
});

const flags = computed(() => flagArr.value.join(""));

const errorMsg = computed(() => {
  if (!pattern.value) return "";
  try {
    new RegExp(pattern.value, flags.value);
    return "";
  } catch (e) {
    return (e as Error).message;
  }
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface MatchItem {
  index: number;
  value: string;
  groups: { i: number; v: string | undefined }[];
}

const rawMatches = computed<RegExpExecArray[]>(() => {
  if (!pattern.value || errorMsg.value) return [];
  let re: RegExp;
  try {
    re = new RegExp(pattern.value, flags.value);
  } catch {
    return [];
  }
  if (re.global) return Array.from(text.value.matchAll(re));
  const match = re.exec(text.value);
  return match ? [match] : [];
});

const matches = computed<MatchItem[]>(() => {
  const out: MatchItem[] = [];
  for (const m of rawMatches.value) {
    out.push({
      index: m.index ?? 0,
      value: m[0],
      groups: Array.from(m.slice(1)).map((g, i) => ({ i, v: g })),
    });
  }
  return out;
});

const highlighted = computed(() => {
  if (!pattern.value || errorMsg.value) return escapeHtml(text.value);
  let result = "";
  let last = 0;
  for (const m of rawMatches.value) {
    const start = m.index ?? 0;
    result += escapeHtml(text.value.slice(last, start));
    result += `<mark>${escapeHtml(m[0])}</mark>`;
    last = start + m[0].length;
  }
  result += escapeHtml(text.value.slice(last));
  return result;
});

watch([pattern, flagArr, text], () => {
  if (!pattern.value || !text.value || errorMsg.value) return;
  history.recordDebounced({
    title: `/${pattern.value.slice(0, 36)}/${flags.value} · ${matches.value.length} 处`,
    input: JSON.stringify({ pattern: pattern.value, flags: flagArr.value, text: text.value }),
    output: matches.value.map((match) => `${match.index}: ${match.value}`).join("\n"),
  }, 1200);
}, { deep: true });
</script>

<style scoped>
.regex-page :deep(.tool-page-inner) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
}
.regex-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1 1 auto;
  min-width: 0;
}
.regex-slash {
  color: var(--ktool-text-faint);
  font-family: ui-monospace, monospace;
}
.regex-input {
  width: 280px;
  max-width: 50vw;
}
.regex-flags {
  margin-left: 4px;
}
.regex-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  gap: 12px;
  margin-top: 12px;
}
.regex-pane {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ktool-border);
  border-radius: var(--ktool-radius);
  background: var(--ktool-surface);
  overflow: hidden;
}
.regex-pane-head {
  flex: 0 0 auto;
  padding: 7px 12px;
  border-bottom: 1px solid var(--ktool-border);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ktool-text-soft);
}
.regex-pane :deep(.editor-pane) {
  flex: 1 1 auto;
  min-height: 0;
}
.regex-highlight {
  flex: 1 1 auto;
  margin: 0;
  padding: 12px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  line-height: 1.6;
}
.regex-highlight :deep(mark) {
  background: #fde68a;
  color: #1f2937;
  border-radius: 3px;
  padding: 0 1px;
}
.regex-matches {
  flex: 0 0 auto;
  max-height: 180px;
  overflow: auto;
  margin-top: 12px;
  border: 1px solid var(--ktool-border);
  border-radius: var(--ktool-radius);
  background: var(--ktool-surface);
}
.regex-matches-head {
  padding: 7px 12px;
  border-bottom: 1px solid var(--ktool-border);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ktool-text-soft);
  position: sticky;
  top: 0;
  background: var(--ktool-surface);
}
.regex-match-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-bottom: 1px solid var(--ktool-border);
  font-size: 12.5px;
}
.regex-match-idx {
  color: var(--ktool-brand);
  font-weight: 600;
}
.regex-match-val {
  font-family: ui-monospace, monospace;
}
.regex-match-pos {
  color: var(--ktool-text-faint);
}
.regex-group {
  font-family: ui-monospace, monospace;
  background: var(--ktool-surface-hover);
  padding: 1px 5px;
  border-radius: 4px;
  margin-right: 6px;
}
</style>
