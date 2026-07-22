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
import { parseHistoryInput, useToolHistory } from "@/composables/useToolHistory";

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
const history = useToolHistory("generator", "生成器", (item) => {
  const saved = parseHistoryInput<{
    mode: "uuid" | "pwd";
    uuidCount?: number;
    uuidDashes?: boolean;
    uuidUpper?: boolean;
    pwdLen?: number;
    pwdCount?: number;
    pwdExcludeSimilar?: boolean;
    opt?: typeof opt;
  }>(item.input);
  if (!saved) return;
  mode.value = saved.mode;
  uuidCount.value = saved.uuidCount ?? uuidCount.value;
  uuidDashes.value = saved.uuidDashes ?? uuidDashes.value;
  uuidUpper.value = saved.uuidUpper ?? uuidUpper.value;
  pwdLen.value = saved.pwdLen ?? pwdLen.value;
  pwdCount.value = saved.pwdCount ?? pwdCount.value;
  pwdExcludeSimilar.value = saved.pwdExcludeSimilar ?? pwdExcludeSimilar.value;
  if (saved.opt) Object.assign(opt, saved.opt);
  output.value = item.output;
});

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
  const groups = [
    opt.upper ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : "",
    opt.lower ? "abcdefghijklmnopqrstuvwxyz" : "",
    opt.digit ? "0123456789" : "",
    opt.symbol ? "!@#$%^&*()-_=+[]{};:,.<>?" : "",
  ]
    .map((group) => pwdExcludeSimilar.value ? group.replace(/[0O1lI]/g, "") : group)
    .filter(Boolean);
  const pool = groups.join("");
  if (!pool) return "";
  const length = Math.max(groups.length, Number(pwdLen.value) || 16);
  const chars = groups.map((group) => group[randomIndex(group.length)]);
  while (chars.length < length) chars.push(pool[randomIndex(pool.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

function randomIndex(max: number): number {
  const range = 0x1_0000_0000;
  const limit = range - (range % max);
  const value = new Uint32Array(1);
  do crypto.getRandomValues(value); while (value[0] >= limit);
  return value[0] % max;
}

function generate() {
  if (mode.value === "uuid") {
    const count = Math.max(1, Number(uuidCount.value) || 1);
    output.value = Array.from({ length: count }, () => genUuid()).join("\n");
  } else {
    if (!opt.upper && !opt.lower && !opt.digit && !opt.symbol) {
      message.warning("请至少选择一种字符类型");
      return;
    }
    const list: string[] = [];
    const count = Math.max(1, Number(pwdCount.value) || 1);
    for (let i = 0; i < count; i++) list.push(genPassword());
    output.value = list.join("\n");
  }
  history.record({
    title: mode.value === "uuid" ? `UUID · ${uuidCount.value} 个` : `随机密码 · ${pwdCount.value} 个`,
    input: JSON.stringify({
      mode: mode.value,
      uuidCount: uuidCount.value,
      uuidDashes: uuidDashes.value,
      uuidUpper: uuidUpper.value,
      pwdLen: pwdLen.value,
      pwdCount: pwdCount.value,
      pwdExcludeSimilar: pwdExcludeSimilar.value,
      opt,
    }),
    output: output.value,
  });
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
