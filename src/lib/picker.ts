import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

const PICKER_LABEL = "color-picker";

/** 打开（或聚焦已存在的）屏幕取色 overlay 窗口 */
export async function openColorPicker() {
  try {
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
    win.once("tauri://error", (e) => console.error("[color-picker]", e));
  } catch (e) {
    console.error("openColorPicker", e);
  }
}
