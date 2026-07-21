import { defineStore } from "pinia";
import { ref } from "vue";

export type CloseBehavior = "ask" | "minimize" | "quit";

export interface SettingsData {
  /** 文件下载目录（绝对路径），null 表示未配置 */
  downloadDir: string | null;
  /** 被隐藏（不在侧边栏显示）的工具 id 列表 */
  hiddenTools: string[];
  /** 屏幕取色全局快捷键（Tauri 格式，如 "Ctrl+Shift+C"），空表示禁用 */
  pickerShortcut: string;
  /** 点击关闭按钮时的行为 */
  closeBehavior: CloseBehavior;
  /** 是否开机自启 */
  autoStart: boolean;
}

const STORAGE_KEY = "ktool_settings";

function load(): SettingsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SettingsData>;
      return {
        downloadDir: parsed.downloadDir ?? null,
        hiddenTools: parsed.hiddenTools ?? [],
        pickerShortcut: parsed.pickerShortcut ?? "CommandOrControl+Shift+C",
        closeBehavior: parsed.closeBehavior ?? "ask",
        autoStart: parsed.autoStart ?? false,
      };
    }
  } catch {
    // 忽略解析错误
  }
  return {
    downloadDir: null,
    hiddenTools: [],
    pickerShortcut: "CommandOrControl+Shift+C",
    closeBehavior: "ask",
    autoStart: false,
  };
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

  function isToolHidden(id: string): boolean {
    return data.value.hiddenTools.includes(id);
  }

  function setToolHidden(id: string, hidden: boolean) {
    const set = new Set(data.value.hiddenTools);
    if (hidden) set.add(id);
    else set.delete(id);
    data.value.hiddenTools = [...set];
    persist(data.value);
  }

  function toggleToolHidden(id: string) {
    setToolHidden(id, !isToolHidden(id));
  }

  function showAllTools() {
    data.value.hiddenTools = [];
    persist(data.value);
  }

  function setPickerShortcut(shortcut: string) {
    data.value.pickerShortcut = shortcut;
    persist(data.value);
  }

  function setCloseBehavior(behavior: CloseBehavior) {
    data.value.closeBehavior = behavior;
    persist(data.value);
  }

  function setAutoStart(enabled: boolean) {
    data.value.autoStart = enabled;
    persist(data.value);
  }

  return {
    data,
    setDownloadDir,
    clearDownloadDir,
    isToolHidden,
    setToolHidden,
    toggleToolHidden,
    showAllTools,
    setPickerShortcut,
    setCloseBehavior,
    setAutoStart,
  };
});
