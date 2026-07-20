use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Mutex;

use tauri::{AppHandle, Emitter};
use windows::Win32::Foundation::{HINSTANCE, LRESULT, LPARAM, WPARAM};
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::System::Threading::GetCurrentThreadId;
use windows::Win32::UI::Input::KeyboardAndMouse::{
    GetAsyncKeyState, VK_0, VK_9, VK_A, VK_B, VK_C,
    VK_D, VK_E, VK_F, VK_G, VK_H, VK_I, VK_J, VK_K, VK_L, VK_M, VK_N, VK_O, VK_P, VK_Q, VK_R, VK_S,
    VK_T, VK_U, VK_V, VK_W, VK_X, VK_Y, VK_Z,     VK_SPACE, VK_RETURN, VK_BACK, VK_TAB, VK_SHIFT,
    VK_CONTROL, VK_MENU, VK_LWIN, VK_RWIN,
};
use windows::Win32::UI::WindowsAndMessaging::{
    CallNextHookEx, DispatchMessageW, GetMessageW, KBDLLHOOKSTRUCT, PostThreadMessageW,
    SetWindowsHookExW, TranslateMessage, UnhookWindowsHookEx, HHOOK, MSG, WH_KEYBOARD_LL, WM_KEYDOWN,
    WM_QUIT, WM_SYSKEYDOWN,
};

static HOOK_INSTALLED: AtomicBool = AtomicBool::new(false);
static HOOK_THREAD_ID: AtomicU32 = AtomicU32::new(0);
static HOOK_HANDLE: Mutex<Option<HHOOK>> = Mutex::new(None);
static APP_HANDLE: Mutex<Option<AppHandle>> = Mutex::new(None);

fn vk_to_string(vk_code: u32) -> String {
    let vk = vk_code as u16;
    if (VK_0.0..=VK_9.0).contains(&vk) {
        return char::from_digit((vk - VK_0.0) as u32, 10)
            .unwrap_or('?')
            .to_string();
    }
    let ch = match vk {
        v if v == VK_A.0 => 'a',
        v if v == VK_B.0 => 'b',
        v if v == VK_C.0 => 'c',
        v if v == VK_D.0 => 'd',
        v if v == VK_E.0 => 'e',
        v if v == VK_F.0 => 'f',
        v if v == VK_G.0 => 'g',
        v if v == VK_H.0 => 'h',
        v if v == VK_I.0 => 'i',
        v if v == VK_J.0 => 'j',
        v if v == VK_K.0 => 'k',
        v if v == VK_L.0 => 'l',
        v if v == VK_M.0 => 'm',
        v if v == VK_N.0 => 'n',
        v if v == VK_O.0 => 'o',
        v if v == VK_P.0 => 'p',
        v if v == VK_Q.0 => 'q',
        v if v == VK_R.0 => 'r',
        v if v == VK_S.0 => 's',
        v if v == VK_T.0 => 't',
        v if v == VK_U.0 => 'u',
        v if v == VK_V.0 => 'v',
        v if v == VK_W.0 => 'w',
        v if v == VK_X.0 => 'x',
        v if v == VK_Y.0 => 'y',
        v if v == VK_Z.0 => 'z',
        v if v == VK_SPACE.0 => ' ',
        v if v == VK_RETURN.0 => '\n',
        v if v == VK_TAB.0 => '\t',
        v if v == VK_BACK.0 => '\u{8}',
        _ => return String::new(),
    };
    ch.to_string()
}

unsafe extern "system" fn keyboard_proc(
    code: i32,
    wparam: WPARAM,
    lparam: LPARAM,
) -> LRESULT {
    if code < 0 {
        return CallNextHookEx(None, code, wparam, lparam);
    }
    let msg = wparam.0 as u32;
    if msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN {
        let kb = *(lparam.0 as *const KBDLLHOOKSTRUCT);
        let key = vk_to_string(kb.vkCode);
        let mut combo = String::new();
        if GetAsyncKeyState(VK_CONTROL.0 as i32) < 0 {
            combo.push_str("Ctrl+");
        }
        if GetAsyncKeyState(VK_MENU.0 as i32) < 0 {
            combo.push_str("Alt+");
        }
        if GetAsyncKeyState(VK_SHIFT.0 as i32) < 0 {
            combo.push_str("Shift+");
        }
        if GetAsyncKeyState(VK_LWIN.0 as i32) < 0 || GetAsyncKeyState(VK_RWIN.0 as i32) < 0 {
            combo.push_str("Win+");
        }
        if !key.is_empty() {
            combo.push_str(&key);
        }
        if let Some(app) = APP_HANDLE.lock().unwrap().as_ref() {
            let _ = app.emit("keyboard-event", &combo);
        }
    }
    CallNextHookEx(None, code, wparam, lparam)
}

#[tauri::command]
pub fn start_keyboard_hook(app: AppHandle) -> Result<(), String> {
    if HOOK_INSTALLED.load(Ordering::SeqCst) {
        return Ok(());
    }
    *APP_HANDLE.lock().unwrap() = Some(app);

    std::thread::spawn(|| unsafe {
        let hinst: HINSTANCE = GetModuleHandleW(None)
            .map_err(|e| e.to_string())
            .unwrap()
            .into();
        let hook = SetWindowsHookExW(WH_KEYBOARD_LL, Some(keyboard_proc), hinst, 0)
            .map_err(|e| e.to_string())
            .unwrap();
        *HOOK_HANDLE.lock().unwrap() = Some(hook);
        HOOK_INSTALLED.store(true, Ordering::SeqCst);

        // 记录当前线程 ID（用于 stop）
        let thread_id = GetCurrentThreadId();
        HOOK_THREAD_ID.store(thread_id, Ordering::SeqCst);

        let mut msg = MSG::default();
        while GetMessageW(&mut msg, None, 0, 0).into() {
            let _ = TranslateMessage(&msg);
            let _ = DispatchMessageW(&msg);
        }

        let _ = UnhookWindowsHookEx(hook);
        *HOOK_HANDLE.lock().unwrap() = None;
        HOOK_INSTALLED.store(false, Ordering::SeqCst);
        HOOK_THREAD_ID.store(0, Ordering::SeqCst);
    });
    Ok(())
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
    Ok(())
}
