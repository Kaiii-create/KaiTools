import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { useThemeStore } from "./stores/theme";
import "./styles/main.css";

const app = createApp(App);
app.use(createPinia());

// 初始化主题（在挂载前应用，避免闪烁）
const themeStore = useThemeStore();
themeStore.init();

app.mount("#app");
