<template>
  <n-config-provider
    :theme="naiveTheme"
    :theme-overrides="themeOverrides"
    :locale="zhCN"
    :date-locale="dateZhCN"
    abstract
  >
    <n-message-provider>
      <n-dialog-provider>
        <AppShell />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  darkTheme,
  lightTheme,
  zhCN,
  dateZhCN,
} from "naive-ui";
import AppShell from "@/components/AppShell.vue";
import { useThemeStore } from "@/stores/theme";
import { getThemeOverrides } from "@/lib/theme";

const themeStore = useThemeStore();

const naiveTheme = computed(() => (themeStore.isDark ? darkTheme : lightTheme));
const themeOverrides = computed(() =>
  getThemeOverrides(themeStore.isDark, themeStore.accentColor)
);

// 注入设置信息供设置弹窗读取
async function getAppInfo() {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const info = await invoke<{
      appName: string;
      appVersion: string;
      tauriVersion: string;
      os: string;
    }>("get_app_info");
    (window as any).__KTOOL_APP_INFO__ = info;
  } catch {
    (window as any).__KTOOL_APP_INFO__ = {
      appName: "KTool",
      appVersion: "",
      tauriVersion: "",
      os: "Windows",
    };
  }
  window.dispatchEvent(new Event("ktool-app-info"));
}

onMounted(async () => {
  themeStore.init();
  await getAppInfo();
});
</script>
