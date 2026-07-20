import { useSettingsStore } from "@/stores/settings";

/** 判断当前是否运行在 Tauri 环境 */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * 保存文件。Tauri 环境下写入已配置的下载目录（首次未配置则弹出目录选择并保存），
 * 浏览器环境下回退为普通下载。
 * @returns 实际保存的路径或位置描述
 */
export async function downloadFile(filename: string, blob: Blob): Promise<string> {
  // 浏览器环境：直接触发下载
  if (!isTauri()) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return "浏览器下载目录";
  }

  const settings = useSettingsStore();
  let dir = settings.data.downloadDir;

  // 首次未配置：提示并弹出目录选择
  if (!dir) {
    const dialog = await import("@tauri-apps/plugin-dialog");
    const picked = await dialog.open({ directory: true, title: "选择文件下载目录" });
    if (!picked || Array.isArray(picked)) {
      throw new Error("未选择下载目录");
    }
    dir = picked as string;
    settings.setDownloadDir(dir);
  }

  const { join } = await import("@tauri-apps/api/path");
  const fullPath = await join(dir, filename);
  const { writeFile } = await import("@tauri-apps/plugin-fs");
  const bytes = new Uint8Array(await blob.arrayBuffer());
  await writeFile(fullPath, bytes);
  return fullPath;
}

/** 将 canvas 转为 Blob */
export function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png"): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("画布导出失败"));
    }, type);
  });
}
