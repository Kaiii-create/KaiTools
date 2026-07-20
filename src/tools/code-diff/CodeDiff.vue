<template>
  <ToolPage>
    <!-- 工具栏 -->
    <ToolToolbar>
      <n-select v-model:value="mode" :options="modes" size="small" style="width: 140px" />
      <n-button quaternary size="small" @click="onSwap">交换</n-button>
      <n-button quaternary size="small" @click="onClear">清空</n-button>
      <n-button quaternary size="small" @click="onCopyResult">复制结果</n-button>
      <div class="flex-1" />
      <n-tag size="small" round>
        +{{ additions }} / -{{ deletions }}
      </n-tag>
    </ToolToolbar>

    <!-- 输入区 -->
    <div class="flex border-b border-gray-200 dark:border-gray-700" style="height: 40%">
      <div class="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
        <div class="px-3 py-1 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800">原始文本</div>
        <textarea
          v-model="leftText"
          class="flex-1 p-3 font-mono text-sm bg-transparent outline-none resize-none"
          placeholder="粘贴原始文本..."
        />
      </div>
      <div class="flex-1 flex flex-col">
        <div class="px-3 py-1 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800">修改后文本</div>
        <textarea
          v-model="rightText"
          class="flex-1 p-3 font-mono text-sm bg-transparent outline-none resize-none"
          placeholder="粘贴修改后的文本..."
        />
      </div>
    </div>

    <!-- 对比结果 -->
    <div class="flex-1 overflow-auto">
      <div class="px-3 py-1 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 sticky top-0 border-b border-gray-200 dark:border-gray-700">
        对比结果（行级差异）
      </div>
      <table class="w-full text-sm font-mono">
        <tbody>
          <tr v-for="(line, idx) in diffLines" :key="idx">
            <td class="w-10 text-right pr-2 text-gray-400 select-none">{{ idx + 1 }}</td>
            <td class="w-10 text-right pr-2 text-gray-400 select-none">{{ line.type === 'add' ? '+' : line.type === 'del' ? '-' : ' ' }}</td>
            <td
              class="px-2 whitespace-pre-wrap break-all"
              :class="{
                'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300': line.type === 'add',
                'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300': line.type === 'del',
                'bg-blue-50 dark:bg-blue-900/20': line.type === 'same',
              }"
            >{{ line.text }}</td>
          </tr>
          <tr v-if="diffLines.length === 0">
            <td colspan="3" class="text-center text-gray-400 py-8">输入两段文本后自动对比</td>
          </tr>
        </tbody>
      </table>
    </div>
  </ToolPage>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { NSelect, NButton, NTag, useMessage } from "naive-ui";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import { diff_match_patch } from "diff-match-patch";

interface Line {
  type: "add" | "del" | "same";
  text: string;
}

const dmp = new diff_match_patch();

const message = useMessage();
const leftText = ref("");
const rightText = ref("");
const mode = ref<"line" | "char">("line");

const modes = [
  { label: "按行对比", value: "line" },
  { label: "按字符对比", value: "char" },
];

// diff-match-patch: 0=相同, -1=删除, 1=新增
const diffParts = computed<{ type: "add" | "del" | "same"; text: string }[]>(() => {
  if (!leftText.value && !rightText.value) return [];
  let raw: [number, string][];
  if (mode.value === "line") {
    const tmp = dmp.diff_linesToChars_(leftText.value, rightText.value);
    raw = dmp.diff_charsToLines_(tmp);
  } else {
    raw = dmp.diff_main(leftText.value, rightText.value);
    dmp.diff_cleanupSemantic(raw);
  }
  return raw.map(([op, text]) => ({
    type: op === 1 ? "add" : op === -1 ? "del" : "same",
    text,
  }));
});

const diffLines = computed<Line[]>(() => {
  return diffParts.value.map((part) => ({
    type: part.type,
    text: part.text.replace(/\n$/, ""),
  }));
});

const additions = computed(() =>
  diffParts.value
    .filter((p) => p.type === "add")
    .reduce((sum, p) => sum + p.text.split("\n").length - 1, 0)
);
const deletions = computed(() =>
  diffParts.value
    .filter((p) => p.type === "del")
    .reduce((sum, p) => sum + p.text.split("\n").length - 1, 0)
);

watch([leftText, rightText, mode], () => {}, { immediate: true });

function onSwap() {
  const tmp = leftText.value;
  leftText.value = rightText.value;
  rightText.value = tmp;
}

function onClear() {
  leftText.value = "";
  rightText.value = "";
}

async function onCopyResult() {
  const text = diffLines.value.map((l) => `${l.type === "add" ? "+" : l.type === "del" ? "-" : " "} ${l.text}`).join("\n");
  if (!text) {
    message.warning("无内容可复制");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    message.success("已复制");
  } catch {
    message.error("复制失败");
  }
}
</script>
