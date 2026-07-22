<template>
  <ToolPage>
    <ToolToolbar>
      <n-button size="small" @click="refreshNow">刷新当前时间</n-button>
      <div class="flex-1" />
      <n-tag size="small" round type="info">实时：{{ currentIso }}</n-tag>
    </ToolToolbar>

    <div class="flex-1 min-h-0 space-y-4">
      <!-- 当前时间显示 -->
      <n-card title="当前时间" size="small">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="copyable" @click="onCopy(currentTs, '时间戳(秒)')">
            <span class="text-[var(--ktool-text-mute)]">时间戳(秒)：</span>{{ currentTs }}
            <n-icon class="copy-icon"><CopyIcon /></n-icon>
          </div>
          <div class="copyable" @click="onCopy(currentTsMs, '时间戳(毫秒)')">
            <span class="text-[var(--ktool-text-mute)]">时间戳(毫秒)：</span>{{ currentTsMs }}
            <n-icon class="copy-icon"><CopyIcon /></n-icon>
          </div>
          <div class="copyable" @click="onCopy(currentLocal, '本地时间')">
            <span class="text-[var(--ktool-text-mute)]">本地：</span>{{ currentLocal }}
            <n-icon class="copy-icon"><CopyIcon /></n-icon>
          </div>
          <div class="copyable" @click="onCopy(currentUtc, 'UTC')">
            <span class="text-[var(--ktool-text-mute)]">UTC：</span>{{ currentUtc }}
            <n-icon class="copy-icon"><CopyIcon /></n-icon>
          </div>
          <div class="copyable col-span-2" @click="onCopy(currentIso, 'ISO')">
            <span class="text-[var(--ktool-text-mute)]">ISO：</span>{{ currentIso }}
            <n-icon class="copy-icon"><CopyIcon /></n-icon>
          </div>
        </div>
      </n-card>

      <!-- 时间戳 → 日期 -->
      <n-card title="时间戳 → 日期" size="small">
        <div class="flex gap-2 items-center mb-3">
          <n-input v-model:value="tsInput" placeholder="输入时间戳，秒或毫秒均可" @input="onTsInput" />
          <n-radio-group v-model:value="tsUnit" size="small" @update:value="onTsInput">
            <n-radio-button value="auto">自动</n-radio-button>
            <n-radio-button value="s">秒</n-radio-button>
            <n-radio-button value="ms">毫秒</n-radio-button>
          </n-radio-group>
        </div>
        <div v-if="tsLines.length" class="space-y-1 text-sm">
          <div
            v-for="line in tsLines"
            :key="line.label"
            class="copyable"
            @click="onCopy(line.value, line.label)"
          >
            <span class="text-[var(--ktool-text-mute)]">{{ line.label }}：</span>{{ line.value }}
            <n-icon class="copy-icon"><CopyIcon /></n-icon>
          </div>
        </div>
        <div v-else-if="tsError" class="text-[var(--ktool-danger)] text-sm">{{ tsError }}</div>
        <div v-else class="text-[var(--ktool-text-mute)] text-sm">输入时间戳后自动转换</div>
      </n-card>

      <!-- 日期 → 时间戳 -->
      <n-card title="日期 → 时间戳" size="small">
        <div class="flex gap-2 items-center mb-3">
          <n-date-picker v-model:value="dateInput" type="datetime" clearable style="flex: 1" @update:value="onDateInput" />
        </div>
        <div v-if="dateLines.length" class="space-y-1 text-sm">
          <div
            v-for="line in dateLines"
            :key="line.label"
            class="copyable"
            @click="onCopy(line.value, line.label)"
          >
            <span class="text-[var(--ktool-text-mute)]">{{ line.label }}：</span>{{ line.value }}
            <n-icon class="copy-icon"><CopyIcon /></n-icon>
          </div>
        </div>
        <div v-else class="text-[var(--ktool-text-mute)] text-sm">选择日期后自动转换</div>
      </n-card>
    </div>
  </ToolPage>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { NButton, NInput, NCard, NTag, NIcon, NRadioGroup, NRadioButton, NDatePicker, useMessage } from "naive-ui";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import { CopyOutline as CopyIcon } from "@vicons/ionicons5";
import { parseHistoryInput, useToolHistory } from "@/composables/useToolHistory";

interface Line { label: string; value: string }

const message = useMessage();
const currentTs = ref(""); const currentTsMs = ref("");
const currentLocal = ref(""); const currentUtc = ref(""); const currentIso = ref("");

const tsInput = ref(""); const tsUnit = ref<"auto" | "s" | "ms">("auto");
const tsLines = ref<Line[]>([]); const tsError = ref("");

const dateInput = ref<number | null>(null);
const dateLines = ref<Line[]>([]);
const history = useToolHistory("timestamp", "时间戳转换", (item) => {
  const saved = parseHistoryInput<{ kind: "timestamp" | "date"; value: string | number; unit?: "auto" | "s" | "ms" }>(item.input);
  if (!saved) return;
  if (saved.kind === "timestamp") {
    tsInput.value = String(saved.value);
    tsUnit.value = saved.unit ?? "auto";
    onTsInput();
  } else {
    dateInput.value = Number(saved.value);
    onDateInput();
  }
});

let timer: ReturnType<typeof setInterval> | null = null;

function pad(n: number): string { return n < 10 ? "0" + n : String(n); }

function formatLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function refreshNow() {
  const now = new Date();
  currentTs.value = String(Math.floor(now.getTime() / 1000));
  currentTsMs.value = String(now.getTime());
  currentLocal.value = formatLocal(now);
  currentUtc.value = now.toUTCString();
  currentIso.value = now.toISOString();
}

function onTsInput() {
  tsError.value = "";
  const raw = tsInput.value.trim();
  if (!raw) { tsLines.value = []; return; }
  const num = Number(raw);
  if (!Number.isFinite(num)) { tsLines.value = []; tsError.value = "请输入有限数字"; return; }
  let ms: number;
  if (tsUnit.value === "s") ms = num * 1000;
  else if (tsUnit.value === "ms") ms = num;
  else ms = Math.abs(num) < 100_000_000_000 ? num * 1000 : num;
  const d = new Date(ms);
  if (isNaN(d.getTime())) { tsLines.value = []; tsError.value = "无效时间戳"; return; }
  tsLines.value = [
    { label: "本地", value: formatLocal(d) },
    { label: "UTC", value: d.toUTCString() },
    { label: "ISO", value: d.toISOString() },
    { label: "时间戳(秒)", value: String(Math.floor(d.getTime() / 1000)) },
    { label: "时间戳(毫秒)", value: String(d.getTime()) },
    { label: "星期", value: `星期${["日","一","二","三","四","五","六"][d.getDay()]}` },
  ];
  history.recordDebounced({
    title: `时间戳 ${raw}`,
    input: JSON.stringify({ kind: "timestamp", value: raw, unit: tsUnit.value }),
    output: tsLines.value.map((line) => `${line.label}: ${line.value}`).join("\n"),
  });
}

function onDateInput() {
  if (dateInput.value == null) { dateLines.value = []; return; }
  const d = new Date(dateInput.value);
  dateLines.value = [
    { label: "时间戳(秒)", value: String(Math.floor(d.getTime() / 1000)) },
    { label: "时间戳(毫秒)", value: String(d.getTime()) },
    { label: "ISO", value: d.toISOString() },
    { label: "UTC", value: d.toUTCString() },
  ];
  history.record({
    title: formatLocal(d),
    input: JSON.stringify({ kind: "date", value: dateInput.value }),
    output: dateLines.value.map((line) => `${line.label}: ${line.value}`).join("\n"),
  });
}

async function onCopy(text: string, label: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    message.success(`${label} 已复制`);
  } catch {
    message.error("复制失败");
  }
}

onMounted(() => { refreshNow(); timer = setInterval(refreshNow, 1000); });
onUnmounted(() => { if (timer) clearInterval(timer); });
</script>

<style scoped>
.copyable {
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 4px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}
.copyable:hover {
  background: var(--ktool-brand-soft);
}
.copy-icon {
  opacity: 0;
  transition: opacity 0.2s;
  font-size: 14px;
  color: var(--ktool-brand);
}
.copyable:hover .copy-icon {
  opacity: 1;
}
</style>
