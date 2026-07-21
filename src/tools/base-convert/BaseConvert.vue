<template>
  <ToolPage class="base-page">
    <ToolToolbar>
      <div class="base-src">
        <n-select v-model:value="fromBase" :options="baseOptions" size="small" class="base-select" />
        <n-input v-model:value="value" placeholder="输入要转换的数值" class="base-input" />
      </div>
      <template #side>
        <n-tag v-if="error" type="error" size="small">{{ error }}</n-tag>
        <n-button v-else size="small" @click="copyDec">复制十进制</n-button>
      </template>
    </ToolToolbar>

    <div class="base-grid">
      <div
        v-for="b in bases"
        :key="b.base"
        class="base-card"
        :class="{ active: b.base === fromBase }"
      >
        <div class="base-card-head">
          <span>{{ b.label }}</span>
          <n-button text size="tiny" @click="copy(b.out)">复制</n-button>
        </div>
        <code class="base-card-val">{{ b.out || "—" }}</code>
      </div>
    </div>
  </ToolPage>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { NButton, NInput, NSelect, NTag, useMessage } from "naive-ui";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";

const message = useMessage();

const DIGITS = "0123456789abcdefghijklmnopqrstuvwxyz";
const fromBase = ref(10);
const value = ref("");

const baseOptions = [
  { label: "二进制 (2)", value: 2 },
  { label: "八进制 (8)", value: 8 },
  { label: "十进制 (10)", value: 10 },
  { label: "十六进制 (16)", value: 16 },
];

function parseBig(str: string, base: number): bigint | null {
  const s = str.trim().toLowerCase().replace(/[\s_]/g, "");
  if (!s) return null;
  let n = 0n;
  let negative = false;
  const body = s.startsWith("-") ? ((negative = true), s.slice(1)) : s;
  for (const ch of body) {
    const d = DIGITS.indexOf(ch);
    if (d < 0 || d >= base) return null;
    n = n * BigInt(base) + BigInt(d);
  }
  return negative ? -n : n;
}

function toBase(n: bigint, base: number): string {
  if (n === 0n) return "0";
  const negative = n < 0n;
  n = negative ? -n : n;
  let s = "";
  while (n > 0n) {
    s = DIGITS[Number(n % BigInt(base))] + s;
    n = n / BigInt(base);
  }
  return negative ? "-" + s : s;
}

const big = computed(() => parseBig(value.value, fromBase.value));

const error = computed(() => {
  if (value.value.trim() && big.value === null) return "无效数值（请检查进制与字符）";
  return "";
});

const bases = computed(() => {
  const n = big.value;
  return [
    { base: 2, label: "二进制", out: n === null ? "" : toBase(n, 2) },
    { base: 8, label: "八进制", out: n === null ? "" : toBase(n, 8) },
    { base: 10, label: "十进制", out: n === null ? "" : toBase(n, 10) },
    { base: 16, label: "十六进制", out: n === null ? "" : toBase(n, 16).toUpperCase() },
  ];
});

const decValue = computed(() => (big.value === null ? "" : toBase(big.value, 10)));

async function copy(text: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    message.success("已复制");
  } catch {
    message.error("复制失败");
  }
}
function copyDec() {
  copy(decValue.value);
}
</script>

<style scoped>
.base-page :deep(.tool-page-inner) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
}
.base-src {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  min-width: 0;
}
.base-select {
  width: 130px;
  flex: 0 0 auto;
}
.base-input {
  flex: 1 1 auto;
  min-width: 0;
}
.base-grid {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 12px;
  align-content: start;
  overflow: auto;
}
.base-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--ktool-border);
  border-radius: var(--ktool-radius);
  background: var(--ktool-surface);
  overflow: hidden;
  min-width: 0;
}
.base-card.active {
  border-color: var(--ktool-brand);
}
.base-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 12px;
  border-bottom: 1px solid var(--ktool-border);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ktool-text-soft);
}
.base-card-val {
  padding: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 14px;
  word-break: break-all;
  white-space: pre-wrap;
}
</style>
