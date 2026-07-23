import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

const PICKER_LABEL = "color-picker";
let pickerOpening: Promise<void> | null = null;

/** 打开（或聚焦已存在的）屏幕取色 overlay 窗口 */
export function openColorPicker(): Promise<void> {
  // 全局快捷键按住时 Windows 可能连续派发 Pressed。复用同一个创建任务，
  // 避免多个 getByLabel 同时返回空后重复创建同名窗口。
  if (pickerOpening) return pickerOpening;

  pickerOpening = (async () => {
    const existing = await WebviewWindow.getByLabel(PICKER_LABEL);
    if (existing) {
      await existing.show().catch(() => {});
      await existing.setFocus().catch(() => {});
      return;
    }
    const win = new WebviewWindow(PICKER_LABEL, {
      url: "index.html#/color-picker",
      title: "屏幕取色",
      fullscreen: true,
      alwaysOnTop: true,
      decorations: false,
      transparent: true,
      skipTaskbar: true,
      resizable: false,
      focus: true,
    });

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const timeoutId = window.setTimeout(
        () => finish(new Error("取色窗口创建超时")),
        5000,
      );
      const finish = (error?: unknown) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeoutId);
        if (error) reject(error);
        else resolve();
      };
      win.once("tauri://created", () => finish()).catch(finish);
      win.once("tauri://error", (event) => finish(event.payload)).catch(finish);
    });
  })()
    .catch((error) => {
      console.error("[color-picker] 打开失败", error);
    })
    .finally(() => {
      pickerOpening = null;
    });

  return pickerOpening;
}
