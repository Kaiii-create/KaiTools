<template>
  <div class="world-clock flex flex-col h-full">
    <!-- 工具栏 -->
    <div class="toolbar flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
      <n-select
        v-model:value="newCityKey"
        :options="allCities"
        placeholder="选择城市后点击添加"
        size="small"
        filterable
        style="width: 220px"
      />
      <n-button type="primary" size="small" :disabled="!newCityKey" @click="onAddCity">添加</n-button>
      <div class="flex-1" />
      <n-tag size="small" round type="info">本地：{{ localTime }}</n-tag>
    </div>

    <!-- 城市列表 -->
    <div class="flex-1 overflow-auto p-3">
      <n-grid :cols="2" :x-gap="12" :y-gap="12" responsive="screen">
        <n-card v-for="(city, index) in cities" :key="city.name" size="small" class="relative">
          <div class="flex justify-between items-start">
            <div>
              <div class="text-lg font-bold">{{ city.name }}</div>
              <div class="text-xs text-gray-500">{{ city.offset }}</div>
            </div>
            <n-button circle size="tiny" quaternary type="error" @click="onRemoveCity(index)">
              <template #icon>
                <n-icon size="14"><CloseIcon /></n-icon>
              </template>
            </n-button>
          </div>
          <div class="mt-4 text-2xl font-bold tabular-nums">{{ getTime(city.offset) }}</div>
          <div class="text-sm text-gray-500">{{ getDate(city.offset) }}</div>
        </n-card>
      </n-grid>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { NButton, NCard, NGrid, NTag, NSelect, NIcon, useMessage } from "naive-ui";
import { Close as CloseIcon } from "@vicons/ionicons5";

interface City {
  name: string;
  offset: string;
}

const message = useMessage();

// 默认带北京
const cities = ref<City[]>([
  { name: "北京", offset: "UTC+8" },
  { name: "东京", offset: "UTC+9" },
  { name: "纽约", offset: "UTC-5" },
  { name: "伦敦", offset: "UTC+0" },
]);

// 所有可选城市（用 name 作为唯一 value，避免相同 offset 冲突）
const allCities = [
  { label: "北京 (UTC+8)", value: "北京|UTC+8" },
  { label: "上海 (UTC+8)", value: "上海|UTC+8" },
  { label: "香港 (UTC+8)", value: "香港|UTC+8" },
  { label: "台北 (UTC+8)", value: "台北|UTC+8" },
  { label: "东京 (UTC+9)", value: "东京|UTC+9" },
  { label: "首尔 (UTC+9)", value: "首尔|UTC+9" },
  { label: "新加坡 (UTC+8)", value: "新加坡|UTC+8" },
  { label: "悉尼 (UTC+10)", value: "悉尼|UTC+10" },
  { label: "纽约 (UTC-5)", value: "纽约|UTC-5" },
  { label: "洛杉矶 (UTC-8)", value: "洛杉矶|UTC-8" },
  { label: "芝加哥 (UTC-6)", value: "芝加哥|UTC-6" },
  { label: "多伦多 (UTC-5)", value: "多伦多|UTC-5" },
  { label: "伦敦 (UTC+0)", value: "伦敦|UTC+0" },
  { label: "巴黎 (UTC+1)", value: "巴黎|UTC+1" },
  { label: "柏林 (UTC+1)", value: "柏林|UTC+1" },
  { label: "莫斯科 (UTC+3)", value: "莫斯科|UTC+3" },
  { label: "迪拜 (UTC+4)", value: "迪拜|UTC+4" },
  { label: "孟买 (UTC+5:30)", value: "孟买|UTC+5:30" },
];

const newCityKey = ref("");

const localTime = computed(() => {
  return new Date().toLocaleTimeString("zh-CN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
});

let timer: ReturnType<typeof setInterval> | null = null;
const tick = ref(0);

function parseOffset(offset: string): number {
  // 支持 "UTC+8" "UTC-5" "UTC+5:30"
  const m = offset.match(/UTC([+-])(\d+)(?::(\d+))?/);
  if (!m) return 0;
  const sign = m[1] === "+" ? 1 : -1;
  const hours = parseInt(m[2]);
  const minutes = m[3] ? parseInt(m[3]) : 0;
  return sign * (hours + minutes / 60);
}

function getTime(offset: string): string {
  void tick.value; // 触发响应式更新
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const targetTime = new Date(utc + parseOffset(offset) * 3600000);
  return targetTime.toLocaleTimeString("zh-CN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function getDate(offset: string): string {
  void tick.value;
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const targetTime = new Date(utc + parseOffset(offset) * 3600000);
  return targetTime.toLocaleDateString("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
  });
}

function onAddCity() {
  if (!newCityKey.value) return;
  const [name, offset] = newCityKey.value.split("|");
  if (cities.value.some((c) => c.name === name)) {
    message.warning(`${name} 已在列表中`);
    return;
  }
  cities.value.push({ name, offset });
  newCityKey.value = "";
  message.success(`已添加 ${name}`);
}

function onRemoveCity(index: number) {
  cities.value.splice(index, 1);
}

onMounted(() => {
  timer = setInterval(() => { tick.value++; }, 1000);
});
onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>
