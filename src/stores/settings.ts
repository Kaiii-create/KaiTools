import { defineStore } from "pinia";
import { ref } from "vue";

export interface SettingsData {
  /** 文件下载目录（绝对路径），null 表示未配置 */
  downloadDir: string | null;
}

const STORAGE_KEY = "ktool_settings";

function load(): SettingsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SettingsData;
  } catch {
    // 忽略解析错误
  }
  return { downloadDir: null };
}

function persist(data: SettingsData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // 忽略写入错误
  }
}

export const useSettingsStore = defineStore("settings", () => {
  const data = ref<SettingsData>(load());

  function setDownloadDir(dir: string) {
    data.value.downloadDir = dir;
    persist(data.value);
  }

  function clearDownloadDir() {
    data.value.downloadDir = null;
    persist(data.value);
  }

  return { data, setDownloadDir, clearDownloadDir };
});
