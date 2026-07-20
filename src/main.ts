import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { useThemeStore } from "./stores/theme";
import "./styles/main.css";

// 根据 URL hash 判断挂载哪个根组件（用于多窗口：主窗口 / 桌面小插件）
const hash = window.location.hash;

if (hash.startsWith("#/kbd-widget")) {
  // 桌面小插件窗口：极简根，透明背景
  import("./tools/keyboard-stats/WidgetRoot.vue").then(({ default: WidgetRoot }) => {
    const app = createApp(WidgetRoot);
    app.use(createPinia());
    document.documentElement.classList.add("kbd-widget-mode");
    app.mount("#app");
  });
} else {
  const app = createApp(App);
  app.use(createPinia());
  // 初始化主题（在挂载前应用，避免闪烁）
  const themeStore = useThemeStore();
  themeStore.init();
  app.mount("#app");
}
