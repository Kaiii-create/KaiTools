<template>
  <ToolPage class="gen-page">
    <ToolToolbar>
      <n-radio-group v-model:value="mode" size="small">
        <n-radio-button value="uuid">UUID</n-radio-button>
        <n-radio-button value="pwd">随机密码</n-radio-button>
      </n-radio-group>
      <template #side>
        <n-button size="small" type="primary" @click="generate">生成</n-button>
        <n-button size="small" :disabled="!output" @click="copyOutput">复制</n-button>
      </template>
    </ToolToolbar>

    <div class="gen-body">
      <div class="gen-form">
        <template v-if="mode === 'uuid'">
          <div class="gen-field">
            <label>数量</label>
            <n-input-number v-model:value="uuidCount" :min="1" :max="500" />
          </div>
          <div class="gen-field">
            <label>包含连字符</label>
            <n-switch v-model:value="uuidDashes" />
          </div>
          <div class="gen-field">
            <label>大写字母</label>
            <n-switch v-model:value="uuidUpper" />
          </div>
        </template>
        <template v-else>
          <div class="gen-field">
            <label>长度</label>
            <n-input-number v-model:value="pwdLen" :min="4" :max="128" />
          </div>
          <div class="gen-field">
            <label>数量</label>
            <n-input-number v-model:value="pwdCount" :min="1" :max="500" />
          </div>
          <n-checkbox v-model:checked="opt.upper">大写 A-Z</n-checkbox>
          <n-checkbox v-model:checked="opt.lower">小写 a-z</n-checkbox>
          <n-checkbox v-model:checked="opt.digit">数字 0-9</n-checkbox>
          <n-checkbox v-model:checked="opt.symbol">符号 !@#$%^&*</n-checkbox>
          <n-checkbox v-model:checked="pwdExcludeSimilar">排除易混字符 (0/O/1/l/I)</n-checkbox>
        </template>
        <n-button class="gen-go" type="primary" @click="generate">生成</n-button>
      </div>

      <section class="gen-output">
        <EditorPane v-model="output" readonly mono :line-numbers="true" placeholder="生成结果将显示在这里…" />
      </section>
    </div>
  </ToolPage>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { NButton, NInputNumber, NSwitch, NRadioGroup, NRadioButton, NCheckbox, useMessage } from "naive-ui";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import EditorPane from "@/components/tool/EditorPane.vue";

const message = useMessage();

const mode = ref<"uuid" | "pwd">("uuid");
const output = ref("");

const uuidCount = ref(5);
const uuidDashes = ref(true);
const uuidUpper = ref(false);

const pwdLen = ref(16);
const pwdCount = ref(5);
const pwdExcludeSimilar = ref(true);
const opt = reactive({ upper: true, lower: true, digit: true, symbol: true });

function uuidV4(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = (n: number) => n.toString(16).padStart(2, "0");
  const parts = [b.slice(0, 4), b.slice(4, 6), b.slice(6, 8), b.slice(8, 10), b.slice(10, 16)];
  return parts.map((p) => Array.from(p).map(h).join("")).join("-");
}

function genUuid(): string {
  let s = uuidV4();
  if (!uuidDashes.value) s = s.replace(/-/g, "");
  if (uuidUpper.value) s = s.toUpperCase();
  return s;
}

function genPassword(): string {
  let pool = "";
  if (opt.upper) pool += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (opt.lower) pool += "abcdefghijklmnopqrstuvwxyz";
  if (opt.digit) pool += "0123456789";
  if (opt.symbol) pool += "!@#$%^&*()-_=+[]{};:,.<>?";
  if (pwdExcludeSimilar.value) pool = pool.replace(/[0O1lI]/g, "");
  if (!pool) return "";
  const arr = new Uint32Array(pwdLen.value);
  crypto.getRandomValues(arr);
  let out = "";
  for (let i = 0; i < pwdLen.value; i++) out += pool[arr[i] % pool.length];
  return out;
}

function generate() {
  if (mode.value === "uuid") {
    output.value = Array.from({ length: uuidCount.value }, () => genUuid()).join("\n");
  } else {
    if (!opt.upper && !opt.lower && !opt.digit && !opt.symbol) {
      message.warning("请至少选择一种字符类型");
      return;
    }
    const list: string[] = [];
    for (let i = 0; i < pwdCount.value; i++) list.push(genPassword());
    output.value = list.join("\n");
  }
}

async function copyOutput() {
  if (!output.value) return;
  try {
    await navigator.clipboard.writeText(output.value);
    message.success("已复制");
  } catch {
    message.error("复制失败");
  }
}
</script>

<style scoped>
.gen-page :deep(.tool-page-inner) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
}
.gen-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  gap: 12px;
  margin-top: 12px;
}
.gen-form {
  flex: 0 0 220px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--ktool-border);
  border-radius: var(--ktool-radius);
  background: var(--ktool-surface);
  align-self: flex-start;
}
.gen-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.gen-field label {
  font-size: 13px;
  color: var(--ktool-text-soft);
}
.gen-go {
  margin-top: 4px;
}
.gen-output {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  border: 1px solid var(--ktool-border);
  border-radius: var(--ktool-radius);
  background: var(--ktool-surface);
  overflow: hidden;
}
.gen-output :deep(.editor-pane) {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
