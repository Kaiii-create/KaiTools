<template>
  <ToolPage>
    <!-- 顶部工具栏 -->
    <ToolToolbar>
      <n-select v-model:value="method" :options="methods" size="small" style="width: 100px" />
      <n-input v-model:value="url" placeholder="输入请求 URL（如 https://httpbin.org/get）" class="flex-1" @keydown.enter="onSend" />
      <n-button type="primary" size="small" :loading="loading" @click="onSend">发送</n-button>
      <n-button quaternary size="small" @click="onClear">清空</n-button>
    </ToolToolbar>

    <!-- 中间配置区 -->
    <div class="config-panel border-b border-gray-200 dark:border-gray-700">
      <n-tabs v-model:value="activeTab" type="line" size="small" style="padding: 0 12px">
        <n-tab-pane name="headers" tab="Headers">
          <n-input
            v-model:value="headers"
            type="textarea"
            placeholder="每行一个键值对，格式为 '键: 值'"
            :rows="5"
          />
        </n-tab-pane>
        <n-tab-pane name="cookies" tab="Cookies">
          <n-input
            v-model:value="cookies"
            type="textarea"
            placeholder="输入 Cookies，多个用分号分隔"
            :rows="5"
          />
        </n-tab-pane>
        <n-tab-pane name="body" tab="Body">
          <n-select v-model:value="contentType" :options="contentTypes" size="small" style="margin-bottom: 8px" />
          <n-input
            v-model:value="body"
            type="textarea"
            placeholder="输入请求 Body 内容（JSON/Form 等）"
            :rows="5"
          />
        </n-tab-pane>
      </n-tabs>
    </div>

    <!-- 响应区 -->
    <div class="response-panel flex-1 flex flex-col min-h-0">
      <div class="response-header flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium">响应结果</span>
          <n-tag v-if="responseCode" :type="getResponseType(responseCode)" size="small">
            {{ responseCode }}
          </n-tag>
          <span v-if="responseTime" class="text-xs text-gray-500">{{ responseTime }}ms</span>
          <n-button v-if="responseHeaders.size" quaternary size="tiny" @click="showHeaders = !showHeaders">
            {{ showHeaders ? '隐藏' : '查看' }}响应头
          </n-button>
        </div>
        <div class="flex items-center gap-2">
          <n-button quaternary size="small" @click="onCopyResponse" :disabled="!response">复制</n-button>
        </div>
      </div>
      <div v-if="showHeaders && responseHeaders.size" class="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs max-h-40 overflow-auto">
        <div v-for="[k, v] in Array.from(responseHeaders.entries())" :key="k" class="flex">
          <span class="font-mono text-gray-500 w-40 flex-shrink-0">{{ k }}:</span>
          <span class="font-mono">{{ v }}</span>
        </div>
      </div>
      <div class="response-body flex-1 p-3 overflow-auto">
        <n-input
          v-model:value="response"
          type="textarea"
          readonly
          :placeholder="loading ? '请求中...' : '响应结果将显示在这里'"
          class="h-full"
          :style="{ fontFamily: 'monospace' }"
        />
      </div>
    </div>
  </ToolPage>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { NButton, NInput, NSelect, NTabs, NTabPane, NTag, useMessage } from "naive-ui";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";

const message = useMessage();

const method = ref("GET");
const url = ref("");
const headers = ref("");
const cookies = ref("");
const body = ref("");
const contentType = ref("application/json");
const activeTab = ref("headers");
const response = ref("");
const responseCode = ref("");
const responseTime = ref(0);
const responseHeaders = ref<Map<string, string>>(new Map());
const showHeaders = ref(false);
const loading = ref(false);

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
  response.value = "";
  responseCode.value = "";
  responseTime.value = 0;
  responseHeaders.value = new Map();
  showHeaders.value = false;

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const requestHeaders: Record<string, string> = {
      "Content-Type": contentType.value,
      ...parseHeaders(headers.value),
    };
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
      response.value = `请求失败：${res.error}`;
      message.error("请求失败");
    } else {
      responseCode.value = String(res.status);
      responseTime.value = res.time_ms;
      const headersMap = new Map<string, string>();
      for (const [k, v] of Object.entries(res.headers)) {
        headersMap.set(k, v);
      }
      responseHeaders.value = headersMap;
      // 尝试格式化 JSON
      try {
        response.value = JSON.stringify(JSON.parse(res.body), null, 2);
      } catch {
        response.value = res.body;
      }
      message.success(`请求完成 ${res.status}`);
    }
  } catch (e) {
    response.value = `调用失败：${(e as Error).message}`;
    message.error("调用失败");
  } finally {
    loading.value = false;
  }
}

async function onCopyResponse() {
  if (!response.value) return;
  try {
    await navigator.clipboard.writeText(response.value);
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
  response.value = "";
  responseCode.value = "";
  responseTime.value = 0;
  responseHeaders.value = new Map();
}
</script>
