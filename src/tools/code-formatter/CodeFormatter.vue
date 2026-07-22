<template>
  <ToolPage class="code-page">
    <ToolToolbar :bordered="false" variant="subtle" class="code-toolbar">
      <span class="toolbar-field-label">代码语言</span>
      <n-select v-model:value="language" :options="languages" size="small" style="width: 120px" />
      <n-button type="primary" size="small" @click="onFormat">格式化</n-button>
      <n-button secondary size="small" :disabled="!canMinify" @click="onMinify">
        压缩
      </n-button>
      <template #side>
        <span class="language-hint">{{ canMinify ? '支持格式化与压缩' : '当前语言仅支持格式化' }}</span>
      </template>
    </ToolToolbar>

    <SplitWorkspace
      v-model="splitPct"
      class="code-workspace"
      input-label="源代码"
      input-variant="surface"
      output-label="处理结果"
    >
      <template #input-actions>
        <n-button text size="tiny" :disabled="!input" @click="input = ''">清空</n-button>
      </template>
      <template #input>
        <EditorPane
          v-model="input"
          mono
          variant="surface"
          :line-numbers="true"
          placeholder="在这里粘贴或输入代码…"
        />
      </template>
      <template #output-actions>
        <n-button text size="tiny" :disabled="!output" @click="onCopyOutput">复制</n-button>
        <n-button text size="tiny" :disabled="!input && !output" @click="onClear">全部清空</n-button>
      </template>
      <template #output>
        <EditorPane
          v-model="output"
          readonly
          mono
          variant="surface"
          :line-numbers="true"
          placeholder="格式化或压缩结果将显示在这里…"
        />
      </template>
    </SplitWorkspace>

    <StatusBar class="code-status" :tone="statusTone">
      {{ statusText }}
      <template #right>
        <span>输入 {{ input.length }} 字符</span>
        <span>输出 {{ output.length }} 字符</span>
        <span>{{ outputLineCount }} 行</span>
      </template>
    </StatusBar>
  </ToolPage>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { NButton, NSelect, useMessage } from "naive-ui";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import EditorPane from "@/components/tool/EditorPane.vue";
import SplitWorkspace from "@/components/tool/SplitWorkspace.vue";
import StatusBar from "@/components/tool/StatusBar.vue";
import { parseHistoryInput, useToolHistory } from "@/composables/useToolHistory";
import prettier from "prettier/standalone";
import parserHtml from "prettier/plugins/html";
import parserCss from "prettier/plugins/postcss";
import parserBabel from "prettier/plugins/babel";
import parserTypescript from "prettier/plugins/typescript";
import parserMarkdown from "prettier/plugins/markdown";
import parserYaml from "prettier/plugins/yaml";

const message = useMessage();

const language = ref("html");
const splitPct = ref(44);
const input = ref("");
const output = ref("");
const status = ref("");
const statusType = ref<"success" | "error" | "default">("default");
const history = useToolHistory("code-formatter", "代码格式化", (item) => {
  const saved = parseHistoryInput<{ language: string; source: string }>(item.input);
  if (!saved) return;
  language.value = saved.language;
  input.value = saved.source;
  output.value = item.output;
  status.value = "已从历史记录恢复";
  statusType.value = "success";
});

function recordHistory(action: "格式化" | "压缩") {
  history.record({
    title: `${language.value.toUpperCase()} ${action}`,
    input: JSON.stringify({ language: language.value, source: input.value }),
    output: output.value,
  });
}

const languages = [
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "SCSS", value: "scss" },
  { label: "Less", value: "less" },
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "JSON", value: "json" },
  { label: "Markdown", value: "markdown" },
  { label: "YAML", value: "yaml" },
  { label: "SQL", value: "sql" },
];

const minifiableLanguages = new Set(["html", "css", "javascript", "json"]);
const canMinify = computed(() => minifiableLanguages.has(language.value));
const outputLineCount = computed(() => (output.value ? output.value.split("\n").length : 0));
const statusTone = computed(() => statusType.value);
const statusText = computed(() => status.value || "等待输入");

const plugins = [
  parserHtml,
  parserCss,
  parserBabel,
  parserTypescript,
  parserMarkdown,
  parserYaml,
];

const parserMap: Record<string, string> = {
  html: "html",
  css: "css",
  scss: "scss",
  less: "less",
  javascript: "babel",
  typescript: "typescript",
  json: "json",
  markdown: "markdown",
  yaml: "yaml",
};

function getParser(lang: string): string {
  return parserMap[lang] ?? "babel";
}

function minifyJsonSource(source: string): string {
  JSON.parse(source);
  let output = "";
  let inString = false;
  let escaped = false;
  for (const ch of source) {
    if (inString) {
      output += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
    } else if (ch === '"') {
      inString = true;
      output += ch;
    } else if (!/\s/.test(ch)) {
      output += ch;
    }
  }
  return output;
}

async function onFormat() {
  if (!input.value.trim()) {
    message.warning("请输入代码");
    return;
  }
  try {
    if (language.value === "sql") {
      const { format } = await import("sql-formatter");
      output.value = format(input.value, { language: "sql", keywordCase: "upper" });
    } else {
      output.value = await prettier.format(input.value, {
          parser: getParser(language.value),
          plugins,
          semi: true,
          singleQuote: true,
          tabWidth: 2,
        });
    }
    status.value = "格式化成功";
    statusType.value = "success";
    recordHistory("格式化");
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
  if (!canMinify.value) {
    message.warning("该语言暂不支持安全压缩");
    return;
  }
  try {
    switch (language.value) {
      case "html":
        output.value = await (await import("html-minifier-terser/dist/htmlminifier.esm.bundle")).minify(input.value, {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeEmptyAttributes: false,
          minifyCSS: false,
          minifyJS: false,
        });
        break;
      case "css": {
        const { minify } = await import("csso");
        output.value = minify(input.value).css;
        break;
      }
      case "javascript": {
        const { minify } = await import("terser");
        const result = await minify(input.value, {
          compress: true,
          mangle: true,
          format: { comments: false },
        });
        if (!result.code) throw new Error("未生成压缩结果");
        output.value = result.code;
        break;
      }
      case "json":
        output.value = minifyJsonSource(input.value);
        break;
    }
    status.value = "压缩成功";
    statusType.value = "success";
    recordHistory("压缩");
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

<style scoped>
.code-page {
  overflow: hidden;
}
.code-page :deep(.tool-page-inner) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
}
.code-toolbar {
  flex: 0 0 auto;
}
.toolbar-field-label {
  color: var(--ktool-text-soft);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
.language-hint {
  color: var(--ktool-text-mute);
  font-size: 13px;
  white-space: nowrap;
}
.code-workspace {
  margin-top: 12px;
}
.code-status {
  flex: 0 0 auto;
  margin-top: 12px;
}
</style>
