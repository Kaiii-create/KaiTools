<template>
  <ToolPage>
    <!-- 工具栏 -->
    <ToolToolbar>
      <n-select v-model:value="mode" :options="modes" size="small" style="width: 150px" />
      <n-button type="primary" size="small" @click="onExecute">执行</n-button>
      <n-button quaternary size="small" @click="onClear">清空</n-button>
    </ToolToolbar>

    <!-- 内容区 -->
    <div class="flex-1 overflow-auto p-3">
      <n-space vertical :size="16">
        <!-- 输入 -->
        <n-card v-if="needInput" title="输入" size="small">
          <n-input
            v-model:value="input"
            type="textarea"
            placeholder="输入要加密的文本"
            :rows="3"
          />
        </n-card>

        <!-- UUID 生成选项 -->
        <n-card v-if="mode === 'uuid'" title="UUID 选项" size="small">
          <n-space vertical>
            <div class="flex items-center gap-2">
              <span class="text-sm">数量：</span>
              <n-input-number v-model:value="uuidCount" :min="1" :max="20" size="small" />
            </div>
            <div class="flex items-center gap-2">
              <span class="text-sm">去掉连字符：</span>
              <n-switch v-model:value="uuidNoHyphen" size="small" />
            </div>
          </n-space>
        </n-card>

        <!-- MD5 输出 4 种 -->
        <n-card v-if="mode === 'md5'" title="MD5 结果" size="small">
          <n-space vertical :size="12">
            <div v-for="item in md5Results" :key="item.label" class="result-row">
              <div class="result-label">{{ item.label }}</div>
              <n-input :value="item.value" readonly size="small" class="flex-1" />
              <n-button size="small" quaternary @click="onCopy(item.value, item.label)">复制</n-button>
            </div>
          </n-space>
        </n-card>

        <!-- 其他哈希结果 -->
        <n-card v-if="mode !== 'md5' && mode !== 'uuid'" title="结果" size="small">
          <div class="result-row">
            <n-input :value="output" readonly type="textarea" :rows="3" class="flex-1" />
            <n-button size="small" quaternary @click="onCopy(output, '结果')">复制</n-button>
          </div>
        </n-card>

        <!-- UUID 结果 -->
        <n-card v-if="mode === 'uuid'" title="UUID 结果" size="small">
          <div class="result-row">
            <n-input :value="output" readonly type="textarea" :rows="6" class="flex-1" />
            <n-button size="small" quaternary @click="onCopy(output, 'UUID')">复制</n-button>
          </div>
        </n-card>
      </n-space>
    </div>
  </ToolPage>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { NButton, NInput, NSelect, NCard, NSpace, NInputNumber, NSwitch, useMessage } from "naive-ui";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import CryptoJS from "crypto-js";
import { parseHistoryInput, useToolHistory } from "@/composables/useToolHistory";

const message = useMessage();

const mode = ref("md5");
const input = ref("");
const output = ref("");
const uuidCount = ref(5);
const uuidNoHyphen = ref(false);
const history = useToolHistory("crypto", "加密工具", (item) => {
  const saved = parseHistoryInput<{
    mode: string;
    text: string;
    uuidCount?: number;
    uuidNoHyphen?: boolean;
  }>(item.input);
  if (!saved) return;
  mode.value = saved.mode;
  input.value = saved.text;
  uuidCount.value = saved.uuidCount ?? uuidCount.value;
  uuidNoHyphen.value = saved.uuidNoHyphen ?? uuidNoHyphen.value;
  output.value = item.output;
});

const modes = [
  { label: "MD5", value: "md5" },
  { label: "SHA-1", value: "sha1" },
  { label: "SHA-256", value: "sha256" },
  { label: "SHA-512", value: "sha512" },
  { label: "UUID 生成", value: "uuid" },
];

const needInput = computed(() => mode.value !== "uuid");

// MD5 4 种结果
const md5Results = computed(() => {
  if (!input.value) {
    return [
      { label: "32位小写", value: "" },
      { label: "32位大写", value: "" },
      { label: "16位小写", value: "" },
      { label: "16位大写", value: "" },
    ];
  }
  const full = CryptoJS.MD5(input.value).toString();
  const short = full.substring(8, 24);
  return [
    { label: "32位小写", value: full },
    { label: "32位大写", value: full.toUpperCase() },
    { label: "16位小写", value: short },
    { label: "16位大写", value: short.toUpperCase() },
  ];
});

function generateUUID(): string {
  let uuid: string;
  if (typeof crypto.randomUUID === "function") {
    uuid = crypto.randomUUID();
  } else {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    uuid = `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
  }
  if (uuidNoHyphen.value) uuid = uuid.replace(/-/g, "");
  return uuid;
}

function onExecute() {
  if (needInput.value && !input.value.trim()) {
    message.warning("请输入文本");
    return;
  }
  try {
    switch (mode.value) {
      case "md5":
        // 不用 output，结果在 md5Results 里
        output.value = CryptoJS.MD5(input.value).toString();
        break;
      case "sha1":
        output.value = CryptoJS.SHA1(input.value).toString();
        break;
      case "sha256":
        output.value = CryptoJS.SHA256(input.value).toString();
        break;
      case "sha512":
        output.value = CryptoJS.SHA512(input.value).toString();
        break;
      case "uuid": {
        const uuids: string[] = [];
        for (let i = 0; i < uuidCount.value; i++) {
          uuids.push(generateUUID());
        }
        output.value = uuids.join("\n");
        break;
      }
    }
    history.record({
      title: modes.find((item) => item.value === mode.value)?.label ?? mode.value,
      input: JSON.stringify({
        mode: mode.value,
        text: input.value,
        uuidCount: uuidCount.value,
        uuidNoHyphen: uuidNoHyphen.value,
      }),
      output: output.value,
    });
    message.success("执行成功");
  } catch (e) {
    output.value = "";
    message.error((e as Error).message);
  }
}

async function onCopy(text: string, label: string) {
  if (!text) {
    message.warning("无内容可复制");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    message.success(`${label} 已复制`);
  } catch {
    message.error("复制失败");
  }
}

function onClear() {
  input.value = "";
  output.value = "";
}
</script>

<style scoped>
.result-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.result-label {
  font-size: 12px;
  color: #6b7280;
  width: 70px;
  flex-shrink: 0;
}
</style>
