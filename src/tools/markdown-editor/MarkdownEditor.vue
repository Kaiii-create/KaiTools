<template>
  <ToolPage>
    <!-- 工具栏 -->
    <ToolToolbar>
      <n-button-group size="small">
        <n-button @click="insertAtCursor('# ')">H1</n-button>
        <n-button @click="insertAtCursor('## ')">H2</n-button>
        <n-button @click="insertAtCursor('### ')">H3</n-button>
      </n-button-group>
      <n-button-group size="small">
        <n-button @click="wrapSelection('**', '**')"><b>B</b></n-button>
        <n-button @click="wrapSelection('*', '*')"><i>I</i></n-button>
        <n-button @click="wrapSelection('~~', '~~')"><s>S</s></n-button>
        <n-button @click="wrapSelection('`', '`')">code</n-button>
      </n-button-group>
      <n-button-group size="small">
        <n-button @click="insertAtCursor('- ')">列表</n-button>
        <n-button @click="insertAtCursor('1. ')">有序</n-button>
        <n-button @click="insertAtCursor('> ')">引用</n-button>
      </n-button-group>
      <n-button size="small" @click="wrapSelection('[', '](url)')">链接</n-button>
      <n-button size="small" @click="insertAtCursor('\n```\n', '\n```\n')">代码块</n-button>
      <n-button size="small" @click="insertAtCursor('\n| 列1 | 列2 |\n| --- | --- |\n| ', ' |  |\n')">表格</n-button>
      <div class="flex-1" />
      <n-button quaternary size="small" @click="onCopyHtml">复制 HTML</n-button>
      <n-button quaternary size="small" @click="onClear">清空</n-button>
      <n-radio-group v-model:value="view" size="small">
        <n-radio-button value="split">分栏</n-radio-button>
        <n-radio-button value="edit">编辑</n-radio-button>
        <n-radio-button value="preview">预览</n-radio-button>
      </n-radio-group>
    </ToolToolbar>

    <!-- 内容区 -->
    <div class="flex-1 flex min-h-0">
      <!-- 编辑区 -->
      <div v-show="view !== 'preview'" class="flex-1 min-w-0 flex flex-col border-r border-gray-200 dark:border-gray-700">
        <div class="px-3 py-1 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800">Markdown</div>
        <textarea
          ref="textareaRef"
          v-model="text"
          class="flex-1 min-w-0 p-3 font-mono text-sm bg-transparent outline-none resize-none"
          placeholder="# 标题&#10;&#10;输入 Markdown 内容..."
          @scroll="syncScroll('edit', $event)"
        />
      </div>
      <!-- 预览区 -->
      <div v-show="view !== 'edit'" class="flex-1 min-w-0 flex flex-col">
        <div class="px-3 py-1 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800">预览</div>
        <div
          ref="previewRef"
          class="flex-1 min-w-0 overflow-auto p-4 markdown-body"
          @scroll="syncScroll('preview', $event)"
          @click="onPreviewClick"
          v-html="html"
        />
      </div>
    </div>
  </ToolPage>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { NButton, NButtonGroup, NRadioGroup, NRadioButton, useMessage } from "naive-ui";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { useToolHistory } from "@/composables/useToolHistory";

const message = useMessage();
const text = ref(`# Markdown 编辑器

支持 **加粗**、*斜体*、~~删除线~~、\`行内代码\` 等。

## 列表

- 第一项
- 第二项
  - 嵌套项

## 代码块

\`\`\`javascript
function hello() {
  console.log("Hello, KTool!");
}
\`\`\`

## 引用

> 这是一段引用文字

## 表格

| 名称 | 版本 |
| --- | --- |
| KTool | 0.1.0 |

## 链接

[GitHub](https://github.com)
`);
const view = ref<"split" | "edit" | "preview">("split");
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const previewRef = ref<HTMLDivElement | null>(null);
const history = useToolHistory("markdown-editor", "Markdown 编辑器", (item) => {
  text.value = item.input;
});

marked.setOptions({
  gfm: true,
  breaks: true,
});

const html = computed(() => {
  try {
    return DOMPurify.sanitize(marked.parse(text.value) as string, {
      USE_PROFILES: { html: true },
    });
  } catch {
    return "<p>解析错误</p>";
  }
});

watch(text, () => {
  if (!text.value.trim()) return;
  history.recordDebounced({
    title: text.value.match(/^#{1,6}\s+(.+)$/m)?.[1]?.slice(0, 48) || "Markdown 文档",
    input: text.value,
    output: html.value,
  }, 1500);
});

function insertAtCursor(before: string, after: string = "") {
  const ta = textareaRef.value;
  if (!ta) return;
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = text.value.substring(start, end);
  const newText = text.value.substring(0, start) + before + selected + after + text.value.substring(end);
  text.value = newText;
  // 恢复光标位置
  requestAnimationFrame(() => {
    ta.focus();
    ta.selectionStart = start + before.length;
    ta.selectionEnd = end + before.length;
  });
}

function wrapSelection(before: string, after: string) {
  insertAtCursor(before, after);
}

function syncScroll(source: "edit" | "preview", e: Event) {
  if (view.value !== "split") return;
  const target = source === "edit" ? previewRef.value : textareaRef.value;
  if (!target) return;
  const src = e.target as HTMLElement;
  const ratio = src.scrollTop / (src.scrollHeight - src.clientHeight || 1);
  target.scrollTop = ratio * (target.scrollHeight - target.clientHeight || 1);
}

async function onPreviewClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const link = target.closest("a");
  if (!link) return;
  e.preventDefault();
  const href = link.getAttribute("href") || "";
  if (!/^https?:\/\//i.test(href)) {
    message.warning("仅支持打开 http/https 链接");
    return;
  }
  try {
    if ("__TAURI_INTERNALS__" in window) {
      const { open } = await import("@tauri-apps/plugin-shell");
      await open(href);
    } else {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  } catch {
    message.error("链接打开失败");
  }
}

async function onCopyHtml() {
  if (!html.value) {
    message.warning("无内容");
    return;
  }
  try {
    await navigator.clipboard.writeText(html.value);
    message.success("HTML 已复制");
  } catch {
    message.error("复制失败");
  }
}

function onClear() {
  text.value = "";
}
</script>

<style>
.markdown-body {
  font-size: 14px;
  line-height: 1.6;
  word-wrap: break-word;
}
.markdown-body h1 { font-size: 1.8em; font-weight: bold; margin: 0.6em 0; padding-bottom: 0.3em; border-bottom: 1px solid #eee; }
.markdown-body h2 { font-size: 1.5em; font-weight: bold; margin: 0.6em 0; padding-bottom: 0.3em; border-bottom: 1px solid #eee; }
.markdown-body h3 { font-size: 1.25em; font-weight: bold; margin: 0.6em 0; }
.markdown-body h4 { font-size: 1em; font-weight: bold; margin: 0.6em 0; }
.markdown-body p { margin: 0.6em 0; }
.markdown-body ul, .markdown-body ol { margin: 0.6em 0; padding-left: 2em; }
.markdown-body li { margin: 0.2em 0; }
.markdown-body blockquote { margin: 0.6em 0; padding: 0.5em 1em; border-left: 4px solid #ddd; color: #666; background: rgba(0,0,0,0.02); }
.markdown-body code { background: rgba(0,0,0,0.06); padding: 2px 6px; border-radius: 3px; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.9em; }
.markdown-body pre { background: rgba(0,0,0,0.06); padding: 12px; border-radius: 4px; overflow-x: auto; margin: 0.6em 0; }
.markdown-body pre code { background: none; padding: 0; }
.markdown-body table { border-collapse: collapse; margin: 0.6em 0; width: 100%; display: block; overflow-x: auto; }
.markdown-body th, .markdown-body td { border: 1px solid #ddd; padding: 6px 12px; text-align: left; }
.markdown-body th { background: rgba(0,0,0,0.04); font-weight: bold; }
.markdown-body a { color: #3b82f6; text-decoration: none; }
.markdown-body a:hover { text-decoration: underline; }
.markdown-body img { max-width: 100%; }
.markdown-body hr { border: none; border-top: 1px solid #eee; margin: 1em 0; }
.dark .markdown-body code { background: rgba(255,255,255,0.1); }
.dark .markdown-body pre { background: rgba(255,255,255,0.05); }
.dark .markdown-body blockquote { border-left-color: #555; color: #aaa; }
.dark .markdown-body th, .dark .markdown-body td { border-color: #444; }
.dark .markdown-body th { background: rgba(255,255,255,0.05); }
</style>
