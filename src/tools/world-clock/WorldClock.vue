<template>
  <ToolPage>
    <!-- 工具栏 -->
    <ToolToolbar>
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
    </ToolToolbar>

    <!-- 城市列表 -->
    <div class="flex-1 overflow-auto p-3">
      <n-empty v-if="cities.length === 0" description="暂无城市，从上方添加" class="mt-10" />
      <n-grid v-else :cols="2" :x-gap="12" :y-gap="12" responsive="screen">
        <n-gi v-for="(city, index) in cities" :key="city.name">
          <n-card size="small" class="relative">
            <div class="flex justify-between items-start">
              <div>
                <div class="text-lg font-bold">{{ city.name }}</div>
                <div class="text-xs text-gray-500">{{ city.zone }}</div>
              </div>
              <n-button circle size="tiny" quaternary type="error" @click="onRemoveCity(index)">
                <template #icon>
                  <n-icon size="14"><CloseIcon /></n-icon>
                </template>
              </n-button>
            </div>
            <div class="mt-4 text-2xl font-bold tabular-nums">{{ getTime(city.zone) }}</div>
            <div class="text-sm text-gray-500">{{ getDate(city.zone) }}</div>
          </n-card>
        </n-gi>
      </n-grid>
    </div>
  </ToolPage>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { NButton, NCard, NGrid, NGi, NTag, NSelect, NIcon, NEmpty, useMessage } from "naive-ui";
import ToolPage from "@/components/tool/ToolPage.vue";
import ToolToolbar from "@/components/tool/ToolToolbar.vue";
import { Close as CloseIcon } from "@vicons/ionicons5";

interface City {
  name: string;
  zone: string;
}

const message = useMessage();

// 默认带北京
const cities = ref<City[]>([
  { name: "北京", zone: "Asia/Shanghai" },
  { name: "东京", zone: "Asia/Tokyo" },
  { name: "纽约", zone: "America/New_York" },
  { name: "伦敦", zone: "Europe/London" },
]);

// 所有可选城市（用 name 作为唯一 value，避免相同 offset 冲突）
const allCities = [
  { label: "北京", value: "北京|Asia/Shanghai" },
  { label: "上海", value: "上海|Asia/Shanghai" },
  { label: "香港", value: "香港|Asia/Hong_Kong" },
  { label: "台北", value: "台北|Asia/Taipei" },
  { label: "东京", value: "东京|Asia/Tokyo" },
  { label: "首尔", value: "首尔|Asia/Seoul" },
  { label: "新加坡", value: "新加坡|Asia/Singapore" },
  { label: "悉尼", value: "悉尼|Australia/Sydney" },
  { label: "纽约", value: "纽约|America/New_York" },
  { label: "洛杉矶", value: "洛杉矶|America/Los_Angeles" },
  { label: "芝加哥", value: "芝加哥|America/Chicago" },
  { label: "多伦多", value: "多伦多|America/Toronto" },
  { label: "伦敦", value: "伦敦|Europe/London" },
  { label: "巴黎", value: "巴黎|Europe/Paris" },
  { label: "柏林", value: "柏林|Europe/Berlin" },
  { label: "莫斯科", value: "莫斯科|Europe/Moscow" },
  { label: "迪拜", value: "迪拜|Asia/Dubai" },
  { label: "孟买", value: "孟买|Asia/Kolkata" },
];

const newCityKey = ref("");

const localTime = computed(() => {
  void tick.value;
  return new Date().toLocaleTimeString("zh-CN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
});

let timer: ReturnType<typeof setInterval> | null = null;
const tick = ref(0);

function getTime(zone: string): string {
  void tick.value; // 触发响应式更新
  return new Date().toLocaleTimeString("zh-CN", {
    timeZone: zone,
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
}

function getDate(zone: string): string {
  void tick.value;
  return new Date().toLocaleDateString("zh-CN", {
    timeZone: zone,
    year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
  });
}

function onAddCity() {
  if (!newCityKey.value) return;
  const [name, zone] = newCityKey.value.split("|");
  if (cities.value.some((c) => c.name === name)) {
    message.warning(`${name} 已在列表中`);
    return;
  }
  cities.value.push({ name, zone });
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
