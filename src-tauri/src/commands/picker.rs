use serde::Serialize;
use tauri::command;
use windows::Win32::Foundation::POINT;
use windows::Win32::Graphics::Gdi::{GetDC, GetPixel, ReleaseDC};
use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;

/// 单次屏幕取色返回的结构
#[derive(Serialize)]
pub struct ScreenColor {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    /// 光标在屏幕坐标系下的位置
    pub x: i32,
    pub y: i32,
}

/// 以光标为中心采样一小块屏幕像素（用于放大镜显示）
#[derive(Serialize)]
pub struct PickerSample {
    /// 光标位置（屏幕坐标系）
    pub x: i32,
    pub y: i32,
    /// 网格宽（像素数）
    pub w: i32,
    /// 网格高（像素数）
    pub h: i32,
    /// 扁平化的 RGB 数组，长度 = w * h * 3
    pub grid: Vec<u8>,
}

/// 读取光标下方单个像素的颜色
#[command]
pub fn sample_screen_color() -> Result<ScreenColor, String> {
    unsafe {
        let mut pt = POINT { x: 0, y: 0 };
        GetCursorPos(&mut pt).map_err(|e| e.to_string())?;
        let hdc = GetDC(None);
        let c = GetPixel(hdc, pt.x, pt.y).0;
        let _ = ReleaseDC(None, hdc);
        if c == 0xFFFF_FFFF {
            return Ok(ScreenColor {
                r: 0,
                g: 0,
                b: 0,
                x: pt.x,
                y: pt.y,
            });
        }
        Ok(ScreenColor {
            r: (c & 0xFF) as u8,
            g: ((c >> 8) & 0xFF) as u8,
            b: ((c >> 16) & 0xFF) as u8,
            x: pt.x,
            y: pt.y,
        })
    }
}

/// 以光标为中心采样 (2*radius+1) x (2*radius+1) 的像素网格，用于放大镜
#[command]
pub fn sample_screen_grid(radius: i32) -> Result<PickerSample, String> {
    let radius = radius.clamp(1, 60);
    let w = radius * 2 + 1;
    let h = radius * 2 + 1;
    unsafe {
        let mut pt = POINT { x: 0, y: 0 };
        GetCursorPos(&mut pt).map_err(|e| e.to_string())?;
        let hdc = GetDC(None);
        let mut grid: Vec<u8> = Vec::with_capacity((w * h) as usize * 3);
        for dy in -radius..=radius {
            for dx in -radius..=radius {
                let x = pt.x + dx;
                let y = pt.y + dy;
                let c = GetPixel(hdc, x, y).0;
                if c == 0xFFFF_FFFF {
                    grid.extend_from_slice(&[0, 0, 0]);
                } else {
                    grid.push((c & 0xFF) as u8);
                    grid.push(((c >> 8) & 0xFF) as u8);
                    grid.push(((c >> 16) & 0xFF) as u8);
                }
            }
        }
        let _ = ReleaseDC(None, hdc);
        Ok(PickerSample {
            x: pt.x,
            y: pt.y,
            w,
            h,
            grid,
        })
    }
}
