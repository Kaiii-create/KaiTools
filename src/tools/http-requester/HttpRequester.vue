<template>
  <ToolPage class="http-page">
    <!-- 顶部工具栏 -->
    <ToolToolbar class="http-toolbar">
      <n-select v-model:value="method" :options="methods" size="small" class="method-select" />
      <n-input
        v-model:value="url"
        placeholder="输入请求 URL，例如 https://httpbin.org/get"
        size="small"
        class="url-input"
        @keydown.enter="onSend"
      />
      <template #side>
        <n-button type="primary" size="small" :loading="loading" @click="onSend">发送</n-button>
        <n-button quaternary size="small" @click="onClear">清空</n-button>
      </template>
    </ToolToolbar>

    <!-- 中间配置区 -->
    <section class="request-options">
      <n-tabs v-model:value="activeTab" type="line" size="small" class="request-tabs">
        <n-tab-pane name="headers" tab="Headers">
          <EditorPane v-model="headers" mono variant="surface" placeholder="每行一个请求头，格式为：键: 值" />
        </n-tab-pane>
        <n-tab-pane name="cookies" tab="Cookies">
          <EditorPane v-model="cookies" mono variant="surface" placeholder="输入 Cookies，多个用分号分隔" />
        </n-tab-pane>
        <n-tab-pane name="body" tab="Body">
          <div class="body-options">
            <span>Content-Type</span>
            <n-select v-model:value="contentType" :options="contentTypes" size="small" class="content-type-select" />
          </div>
          <EditorPane v-model="body" mono variant="surface" placeholder="输入请求 Body 内容（JSON、Form 或文本）" />
        </n-tab-pane>
      </n-tabs>
    </section>

    <!-- 响应区 -->
    <section class="response-panel">
      <header class="response-header">
        <div class="response-summary">
          <span class="response-title">响应结果</span>
          <n-radio-group v-model:value="responseView" size="small" type="button">
            <n-radio-button value="pretty">美化响应</n-radio-button>
            <n-radio-button value="raw">原始响应</n-radio-button>
          </n-radio-group>
          <n-tag v-if="responseCode" :type="getResponseType(responseCode)" size="small">
            {{ responseCode }}
          </n-tag>
          <span v-if="responseTime" class="response-time">{{ responseTime }} ms</span>
          <n-button v-if="responseHeaders.size" quaternary size="tiny" @click="showHeaders = !showHeaders">
            {{ showHeaders ? '隐藏' : '查看' }}响应头
          </n-button>
        </div>
        <n-button quaternary size="small" :disabled="!displayResponse" @click="onCopyResponse">复制</n-button>
      </header>
      <div v-if="showHeaders && responseHeaders.size" class="response-headers ktool-scroll">
        <div v-for="[k, v] in Array.from(responseHeaders.entries())" :key="k" class="response-header-row">
          <span class="response-header-key">{{ k }}:</span>
          <span>{{ v }}</span>
        </div>
      </div>
      <div class="response-body">
        <EditorPane
          :model-value="displayResponse"
          readonly
          mono
          variant="surface"
          :line-numbers="Boolean(displayResponse)"
          :placeholder="loading ? '请求中...' : '响应结果将显示在这里'"
        />
      </div>
    </section>
  </ToolPage>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { NButton, NInput, NRadioGroup, NRadioButton, NSelect, NTabs, NTabPane, NTag, useMessage } from "naive-ui";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import EditorPane from "@/components/tool/EditorPane.vue";
import { parseHistoryInput, useToolHistory } from "@/composables/useToolHistory";

const message = useMessage();

const method = ref("GET");
const url = ref("");
const headers = ref("");
const cookies = ref("");
const body = ref("");
const contentType = ref("application/json");
const activeTab = ref("headers");
const rawBody = ref("");
const prettyBody = ref("");
const responseView = ref<"pretty" | "raw">("pretty");
const displayResponse = computed(() => (responseView.value === "pretty" ? prettyBody.value : rawBody.value));
const responseCode = ref("");
const responseTime = ref(0);
const responseHeaders = ref<Map<string, string>>(new Map());
const showHeaders = ref(false);
const loading = ref(false);
const history = useToolHistory("http-requester", "HTTP 请求", (item) => {
  const saved = parseHistoryInput<{
    method: string;
    url: string;
    headers: string;
    cookies: string;
    body: string;
    contentType: string;
    status?: string;
  }>(item.input);
  if (!saved) return;
  method.value = saved.method;
  url.value = saved.url;
  headers.value = saved.headers;
  cookies.value = saved.cookies;
  body.value = saved.body;
  contentType.value = saved.contentType;
  responseCode.value = saved.status ?? "";
  rawBody.value = item.output;
  try {
    prettyBody.value = JSON.stringify(JSON.parse(item.output), null, 2);
  } catch {
    prettyBody.value = item.output;
  }
});

const methods = [
  { label: "GET", value: "GET" },
  { label: "POST", value: "POST" },
  { label: "PUT", value: "PUT" },
  { label: "DELETE", value: "DELETE" },
  { label: "PATCH", value: "PATCH" },
  { label: "HEAD", value: "HEAD" },
  { label: "OPTIONS", value: "OPTIONS" },
];

const contentTypes = [
  { label: "application/json", value: "application/json" },
  { label: "application/x-www-form-urlencoded", value: "application/x-www-form-urlencoded" },
  { label: "text/plain", value: "text/plain" },
  { label: "text/html", value: "text/html" },
];

function parseHeaders(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  text.split("\n").forEach((line) => {
    const parts = line.split(":");
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join(":").trim();
      if (key) result[key] = value;
    }
  });
  return result;
}

function getResponseType(code: string): "success" | "warning" | "error" | "default" {
  const num = parseInt(code);
  if (num >= 200 && num < 300) return "success";
  if (num >= 300 && num < 400) return "warning";
  if (num >= 400) return "error";
  return "default";
}

// 归一化 URL：去除首尾空白/不可见字符，转换全角冒号与斜杠，缺省协议时补 https://
function normalizeUrl(raw: string): string {
  let u = raw
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // 零宽字符
    .trim();
  // 全角字符转半角（冒号、斜杠、字母数字常见误输入）
  u = u
    .replace(/：/g, ":")
    .replace(/／/g, "/")
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
  // 去掉中间的换行/多余空白
  u = u.replace(/\s+/g, "");
  // 若没有协议，默认补 https://
  if (u && !/^https?:\/\//i.test(u)) {
    u = "https://" + u;
  }
  return u;
}

async function onSend() {
  const normalized = normalizeUrl(url.value);
  if (!normalized) {
    message.warning("请输入请求 URL");
    return;
  }
  if (!/^https?:\/\//i.test(normalized)) {
    message.warning("URL 必须以 http:// 或 https:// 开头");
    return;
  }
  // 回填归一化后的 URL，方便用户看到实际请求地址
  url.value = normalized;

  loading.value = true;
  rawBody.value = "";
  prettyBody.value = "";
  responseView.value = "pretty";
  responseCode.value = "";
  responseTime.value = 0;
  responseHeaders.value = new Map();
  showHeaders.value = false;

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const requestHeaders: Record<string, string> = parseHeaders(headers.value);
    if (!["GET", "HEAD"].includes(method.value) && body.value) {
      requestHeaders["Content-Type"] ??= contentType.value;
    }
    if (cookies.value) {
      requestHeaders["Cookie"] = cookies.value;
    }

    const res = await invoke<{
      status: number;
      headers: Record<string, string>;
      body: string;
      time_ms: number;
      error: string | null;
    }>("http_request", {
      args: {
        method: method.value,
        url: url.value,
        headers: requestHeaders,
        body: method.value === "GET" || method.value === "HEAD" ? null : body.value,
      },
    });

    if (res.error) {
      rawBody.value = `请求失败：${res.error}`;
      prettyBody.value = rawBody.value;
      message.error("请求失败");
    } else {
      responseCode.value = String(res.status);
      responseTime.value = res.time_ms;
      const headersMap = new Map<string, string>();
      for (const [k, v] of Object.entries(res.headers)) {
        headersMap.set(k, v);
      }
      responseHeaders.value = headersMap;
      rawBody.value = res.body;
      // 美化：尝试格式化 JSON，失败则保留原始文本
      try {
        prettyBody.value = JSON.stringify(JSON.parse(res.body), null, 2);
      } catch {
        prettyBody.value = res.body;
      }
      history.record({
        title: `${method.value} ${url.value.slice(0, 72)} · ${res.status}`,
        input: JSON.stringify({
          method: method.value,
          url: url.value,
          headers: headers.value,
          cookies: cookies.value,
          body: body.value,
          contentType: contentType.value,
          status: String(res.status),
        }),
        output: res.body.slice(0, 200_000),
      });
      message.success(`请求完成 ${res.status}`);
    }
  } catch (e) {
    rawBody.value = `调用失败：${(e as Error).message}`;
    prettyBody.value = rawBody.value;
    message.error("调用失败");
  } finally {
    loading.value = false;
  }
}

async function onCopyResponse() {
  if (!displayResponse.value) return;
  try {
    await navigator.clipboard.writeText(displayResponse.value);
    message.success("已复制");
  } catch {
    message.error("复制失败");
  }
}

function onClear() {
  url.value = "";
  headers.value = "";
  cookies.value = "";
  body.value = "";
  rawBody.value = "";
  prettyBody.value = "";
  responseView.value = "pretty";
  responseCode.value = "";
  responseTime.value = 0;
  responseHeaders.value = new Map();
}
</script>

<style scoped>
.http-page {
  overflow: hidden;
}
.http-page :deep(.tool-page-inner) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
}
.http-toolbar {
  flex: 0 0 auto;
}
.method-select {
  width: 120px;
  flex: 0 0 120px;
}
.url-input {
  flex: 1 1 auto;
  min-width: 160px;
}
.request-options,
.response-panel {
  min-width: 0;
  overflow: hidden;
  border-radius: var(--ktool-radius-md);
  background: var(--ktool-surface);
  box-shadow: var(--ktool-shadow-sm);
}
.request-options {
  flex: 0 0 180px;
  margin-top: 12px;
  padding: 0 12px 12px;
}
.request-tabs {
  height: 100%;
}
.request-tabs :deep(.n-tabs-pane-wrapper),
.request-tabs :deep(.n-tab-pane) {
  height: 100%;
  min-height: 0;
}
.request-tabs :deep(.n-tab-pane) {
  display: flex;
  flex-direction: column;
}
.request-tabs :deep(.editor-pane) {
  flex: 1 1 auto;
  min-height: 0;
}
.request-tabs :deep(.editor-pane-body) {
  border-radius: var(--ktool-radius);
}
.body-options {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: var(--ktool-text-soft);
  font-size: 13px;
}
.content-type-select {
  width: 240px;
}
.response-panel {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  margin-top: 12px;
}
.response-header {
  flex: 0 0 auto;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--ktool-border);
}
.response-summary {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.response-title {
  color: var(--ktool-text);
  font-size: 13px;
  font-weight: 600;
}
.response-time {
  color: var(--ktool-text-mute);
  font-size: 13px;
}
.response-headers {
  flex: 0 0 auto;
  max-height: 160px;
  overflow: auto;
  padding: 8px 12px;
  border-bottom: 1px solid var(--ktool-border);
  background: var(--ktool-surface-2);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 11px;
}
.response-header-row {
  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  gap: 12px;
}
.response-header-key {
  color: var(--ktool-text-mute);
}
.response-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
}
.response-body :deep(.editor-pane) {
  flex: 1 1 auto;
  min-height: 0;
}
.response-body :deep(.editor-pane-body) {
  border-radius: 0;
}
</style>
