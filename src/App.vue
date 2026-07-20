<template>
  <n-config-provider :theme="theme" :locale="zhCN" :date-locale="dateZhCN">
    <n-message-provider>
      <n-dialog-provider>
        <AppShell />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  NConfigProvider,
  NMessageProvider,
  NDialogProvider,
  darkTheme,
  zhCN,
  dateZhCN,
  type GlobalTheme,
} from "naive-ui";
import AppShell from "@/components/AppShell.vue";
import { useThemeStore } from "@/stores/theme";

const themeStore = useThemeStore();
const theme = computed<GlobalTheme | null>(() =>
  themeStore.isDark ? darkTheme : null
);
</script>
