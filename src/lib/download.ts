import { useSettingsStore } from "@/stores/settings";

/** 判断当前是否运行在 Tauri 环境 */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** 弹出目录选择器并保存为默认下载目录。 */
export async function chooseDownloadDirectory(title = "选择默认下载目录"): Promise<string | null> {
  if (!isTauri()) return null;

  const settings = useSettingsStore();
  let defaultPath = settings.data.downloadDir ?? undefined;
  if (!defaultPath) {
    try {
      const { downloadDir } = await import("@tauri-apps/api/path");
      defaultPath = await downloadDir();
    } catch {
      // 无法读取系统下载目录时，让系统选择器自行决定初始位置。
    }
  }

  const dialog = await import("@tauri-apps/plugin-dialog");
  const picked = await dialog.open({
    directory: true,
    multiple: false,
    title,
    defaultPath,
  });
  if (!picked || Array.isArray(picked)) return null;

  settings.setDownloadDir(picked);
  return picked;
}

/** 获取默认下载目录；未配置时仅在首次调用时询问并记住。 */
export async function ensureDownloadDirectory(title = "选择文件下载目录"): Promise<string | null> {
  const settings = useSettingsStore();
  return settings.data.downloadDir || chooseDownloadDirectory(title);
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

  const dir = await ensureDownloadDirectory();
  if (!dir) throw new Error("未选择下载目录");

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
