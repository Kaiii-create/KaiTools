use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Mutex;
use std::time::Duration;

use tauri::{AppHandle, Emitter};
use windows::Win32::Foundation::{HINSTANCE, LPARAM, LRESULT, WPARAM};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::System::Threading::GetCurrentThreadId;
use windows::Win32::UI::Input::KeyboardAndMouse::{
    GetAsyncKeyState, VK_0, VK_9, VK_A, VK_ADD, VK_BACK, VK_CAPITAL, VK_CONTROL, VK_DECIMAL,
    VK_DELETE, VK_DIVIDE, VK_DOWN, VK_END, VK_ESCAPE, VK_F1, VK_F10, VK_F11, VK_F12, VK_F2, VK_F3,
    VK_F4, VK_F5, VK_F6, VK_F7, VK_F8, VK_F9, VK_HOME, VK_INSERT, VK_LEFT, VK_LWIN, VK_MENU,
    VK_MULTIPLY, VK_NEXT, VK_NUMLOCK, VK_NUMPAD0, VK_NUMPAD1, VK_NUMPAD2, VK_NUMPAD3, VK_NUMPAD4,
    VK_NUMPAD5, VK_NUMPAD6, VK_NUMPAD7, VK_NUMPAD8, VK_NUMPAD9, VK_OEM_1, VK_OEM_2, VK_OEM_3,
    VK_OEM_4, VK_OEM_5, VK_OEM_6, VK_OEM_7, VK_OEM_COMMA, VK_OEM_MINUS, VK_OEM_PERIOD, VK_OEM_PLUS,
    VK_PAUSE, VK_PRIOR, VK_RETURN, VK_RIGHT, VK_RWIN, VK_SCROLL, VK_SEPARATOR, VK_SHIFT,
    VK_SNAPSHOT, VK_SPACE, VK_SUBTRACT, VK_TAB, VK_UP, VK_Z,
};
use windows::Win32::UI::WindowsAndMessaging::{
    CallNextHookEx, DispatchMessageW, GetMessageW, PostThreadMessageW, SetWindowsHookExW,
    TranslateMessage, UnhookWindowsHookEx, HHOOK, KBDLLHOOKSTRUCT, MSG, WH_KEYBOARD_LL, WM_KEYDOWN,
    WM_QUIT, WM_SYSKEYDOWN,
};

static HOOK_INSTALLED: AtomicBool = AtomicBool::new(false);
static HOOK_THREAD_ID: AtomicU32 = AtomicU32::new(0);
static HOOK_HANDLE: Mutex<Option<HHOOK>> = Mutex::new(None);
static APP_HANDLE: Mutex<Option<AppHandle>> = Mutex::new(None);

/// 把虚拟键码映射为稳定的按键 token（需与前端布局 code 保持一致）。
/// 未识别的键返回 vk{code}，保证任何按键都会被统计到。
fn vk_to_token(vk_code: u32) -> String {
    let vk = vk_code as u16;
    if (VK_0.0..=VK_9.0).contains(&vk) {
        return (vk - VK_0.0).to_string();
    }
    if (VK_A.0..=VK_Z.0).contains(&vk) {
        return char::from(b'a' + (vk - VK_A.0) as u8).to_string();
    }
    if (0x7C..=0x87).contains(&vk) {
        return format!("f{}", vk - 0x6F);
    }
    let token = match vk {
        v if v == VK_SPACE.0 => "space",
        v if v == VK_RETURN.0 => "enter",
        v if v == VK_TAB.0 => "tab",
        v if v == VK_BACK.0 => "backspace",
        v if v == VK_CAPITAL.0 => "capslock",
        v if v == VK_ESCAPE.0 => "escape",
        v if v == VK_SHIFT.0 => "shift",
        0xA0 | 0xA1 => "shift",
        v if v == VK_CONTROL.0 => "ctrl",
        0xA2 | 0xA3 => "ctrl",
        v if v == VK_MENU.0 => "alt",
        0xA4 | 0xA5 => "alt",
        v if v == VK_LWIN.0 => "win",
        v if v == VK_RWIN.0 => "win",
        v if v == VK_PRIOR.0 => "pageup",
        v if v == VK_NEXT.0 => "pagedown",
        v if v == VK_END.0 => "end",
        v if v == VK_HOME.0 => "home",
        v if v == VK_LEFT.0 => "arrowleft",
        v if v == VK_UP.0 => "arrowup",
        v if v == VK_RIGHT.0 => "arrowright",
        v if v == VK_DOWN.0 => "arrowdown",
        v if v == VK_INSERT.0 => "insert",
        v if v == VK_DELETE.0 => "delete",
        v if v == VK_MULTIPLY.0 => "numpadmul",
        v if v == VK_ADD.0 => "numpadadd",
        v if v == VK_SUBTRACT.0 => "numpadsub",
        v if v == VK_DECIMAL.0 => "numpaddot",
        v if v == VK_DIVIDE.0 => "numpaddiv",
        v if v == VK_SEPARATOR.0 => "numpadsep",
        v if v == VK_NUMPAD0.0 => "numpad0",
        v if v == VK_NUMPAD1.0 => "numpad1",
        v if v == VK_NUMPAD2.0 => "numpad2",
        v if v == VK_NUMPAD3.0 => "numpad3",
        v if v == VK_NUMPAD4.0 => "numpad4",
        v if v == VK_NUMPAD5.0 => "numpad5",
        v if v == VK_NUMPAD6.0 => "numpad6",
        v if v == VK_NUMPAD7.0 => "numpad7",
        v if v == VK_NUMPAD8.0 => "numpad8",
        v if v == VK_NUMPAD9.0 => "numpad9",
        v if v == VK_F1.0 => "f1",
        v if v == VK_F2.0 => "f2",
        v if v == VK_F3.0 => "f3",
        v if v == VK_F4.0 => "f4",
        v if v == VK_F5.0 => "f5",
        v if v == VK_F6.0 => "f6",
        v if v == VK_F7.0 => "f7",
        v if v == VK_F8.0 => "f8",
        v if v == VK_F9.0 => "f9",
        v if v == VK_F10.0 => "f10",
        v if v == VK_F11.0 => "f11",
        v if v == VK_F12.0 => "f12",
        v if v == VK_NUMLOCK.0 => "numlock",
        v if v == VK_SCROLL.0 => "scrolllock",
        v if v == VK_SNAPSHOT.0 => "printscreen",
        v if v == VK_PAUSE.0 => "pause",
        0x5D => "menu",
        0x0C => "clear",
        0xA6 => "browserback",
        0xA7 => "browserforward",
        0xA8 => "browserrefresh",
        0xA9 => "browserstop",
        0xAA => "browsersearch",
        0xAB => "browserfavorites",
        0xAC => "browserhome",
        0xAD => "volumemute",
        0xAE => "volumedown",
        0xAF => "volumeup",
        0xB0 => "medianext",
        0xB1 => "mediaprevious",
        0xB2 => "mediastop",
        0xB3 => "mediaplaypause",
        0xB4 => "launchmail",
        0xB5 => "launchmedia",
        0xB6 => "launchapp1",
        0xB7 => "launchapp2",
        0xE2 => "oem102",
        v if v == VK_OEM_3.0 => "`",
        v if v == VK_OEM_MINUS.0 => "-",
        v if v == VK_OEM_PLUS.0 => "=",
        v if v == VK_OEM_4.0 => "[",
        v if v == VK_OEM_6.0 => "]",
        v if v == VK_OEM_5.0 => "\\",
        v if v == VK_OEM_1.0 => ";",
        v if v == VK_OEM_7.0 => "'",
        v if v == VK_OEM_COMMA.0 => ",",
        v if v == VK_OEM_PERIOD.0 => ".",
        v if v == VK_OEM_2.0 => "/",
        _ => return format!("vk{vk_code}"),
    };
    token.to_string()
}

unsafe extern "system" fn keyboard_proc(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    if code < 0 {
        return CallNextHookEx(None, code, wparam, lparam);
    }
    let msg = wparam.0 as u32;
    if msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN {
        let kb = *(lparam.0 as *const KBDLLHOOKSTRUCT);
        let mut key = vk_to_token(kb.vkCode);
        // Windows 把主键盘 Enter 与数字小键盘 Enter 都报告为 VK_RETURN，
        // 小键盘 Enter 会携带 extended 标志，可据此精确区分。
        if kb.vkCode == VK_RETURN.0 as u32 && (kb.flags.0 & 0x01) != 0 {
            key = "numpadenter".to_string();
        }

        let ctrl = GetAsyncKeyState(VK_CONTROL.0 as i32) < 0;
        let alt = GetAsyncKeyState(VK_MENU.0 as i32) < 0;
        let shift = GetAsyncKeyState(VK_SHIFT.0 as i32) < 0;
        let win = GetAsyncKeyState(VK_LWIN.0 as i32) < 0 || GetAsyncKeyState(VK_RWIN.0 as i32) < 0;

        // 组合键：修饰符作为前缀，但若当前按键本身就是该修饰符则不重复前缀
        let mut combo = String::new();
        if ctrl && key != "ctrl" {
            combo.push_str("Ctrl+");
        }
        if alt && key != "alt" {
            combo.push_str("Alt+");
        }
        if shift && key != "shift" {
            combo.push_str("Shift+");
        }
        if win && key != "win" {
            combo.push_str("Win+");
        }
        combo.push_str(&key);

        if !combo.is_empty() {
            if let Some(app) = APP_HANDLE.lock().unwrap().as_ref() {
                let _ = app.emit("keyboard-event", &combo);
            }
        }
    }
    CallNextHookEx(None, code, wparam, lparam)
}

#[tauri::command]
pub fn start_keyboard_hook(app: AppHandle) -> Result<(), String> {
    if HOOK_INSTALLED
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return Ok(());
    }
    *APP_HANDLE.lock().unwrap() = Some(app);
    let (ready_tx, ready_rx) = std::sync::mpsc::sync_channel(1);

    std::thread::spawn(move || unsafe {
        let hinst: HINSTANCE = match GetModuleHandleW(None) {
            Ok(module) => module.into(),
            Err(error) => {
                eprintln!("[keyboard] 获取模块句柄失败：{error}");
                HOOK_INSTALLED.store(false, Ordering::SeqCst);
                let _ = ready_tx.send(Err(format!("获取模块句柄失败：{error}")));
                return;
            }
        };
        let hook = match SetWindowsHookExW(WH_KEYBOARD_LL, Some(keyboard_proc), hinst, 0) {
            Ok(hook) => hook,
            Err(error) => {
                eprintln!("[keyboard] 安装全局键盘钩子失败：{error}");
                HOOK_INSTALLED.store(false, Ordering::SeqCst);
                let _ = ready_tx.send(Err(format!("安装全局键盘钩子失败：{error}")));
                return;
            }
        };
        *HOOK_HANDLE.lock().unwrap() = Some(hook);

        // 记录当前线程 ID（用于 stop）
        let thread_id = GetCurrentThreadId();
        HOOK_THREAD_ID.store(thread_id, Ordering::SeqCst);
        let _ = ready_tx.send(Ok(()));

        let mut msg = MSG::default();
        while GetMessageW(&mut msg, None, 0, 0).into() {
            let _ = TranslateMessage(&msg);
            let _ = DispatchMessageW(&msg);
        }

        let _ = UnhookWindowsHookEx(hook);
        *HOOK_HANDLE.lock().unwrap() = None;
        HOOK_INSTALLED.store(false, Ordering::SeqCst);
        HOOK_THREAD_ID.store(0, Ordering::SeqCst);
        *APP_HANDLE.lock().unwrap() = None;
    });
    ready_rx
        .recv_timeout(Duration::from_secs(2))
        .map_err(|_| "启动全局键盘监听超时".to_string())?
}

#[tauri::command]
pub fn stop_keyboard_hook() -> Result<(), String> {
    if !HOOK_INSTALLED.load(Ordering::SeqCst) {
        return Ok(());
    }
    let thread_id = HOOK_THREAD_ID.load(Ordering::SeqCst);
    if thread_id != 0 {
        unsafe {
            let _ = PostThreadMessageW(thread_id, WM_QUIT, WPARAM::default(), LPARAM::default());
        }
    }
    for _ in 0..50 {
        if !HOOK_INSTALLED.load(Ordering::SeqCst) {
            break;
        }
        std::thread::sleep(Duration::from_millis(10));
    }
    Ok(())
}
