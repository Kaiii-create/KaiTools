import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

// Tauri 期望前端 dev server 跑在固定端口 1420
const port = 1420;

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  clearScreen: false,
  server: {
    port,
    strictPort: true,
    host: "127.0.0.1",
    // Tauri 需要能访问，关掉 hmr 的 ws 限制
    hmr: {
      protocol: "ws",
      host: "127.0.0.1",
      port,
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
  build: {
    target: "es2021",
    minify: "esbuild",
    sourcemap: false,
  },
});
