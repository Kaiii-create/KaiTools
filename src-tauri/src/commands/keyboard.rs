use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter};
use windows::Win32::Foundation::HINSTANCE;
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::System::Threading::PostThreadMessageW;
use windows::Win32::UI::Input::KeyboardAndMouse::{
    GetAsyncKeyState, KBDLLHOOKSTRUCT, VK_0, VK_1, VK_2, VK_3, VK_4, VK_5, VK_6, VK_7, VK_8, VK_9,
    VK_A, VK_B, VK_C, VK_D, VK_E, VK_F, VK_G, VK_H, VK_I, VK_J, VK_K, VK_L, VK_M, VK_N, VK_O,
    VK_P, VK_Q, VK_R, VK_S, VK_T, VK_U, VK_V, VK_W, VK_X, VK_Y, VK_Z, VK_SPACE, VK_RETURN,
    VK_BACK, VK_TAB, VK_SHIFT, VK_CONTROL, VK_MENU, VK_LWIN, VK_RWIN, VK_ESCAPE, VK_CAPITAL,
};
use windows::Win32::UI::WindowsAndMessaging::{
    CallNextHookEx, DispatchMessageW, GetMessageW, SetWindowsHookExW, TranslateMessage, UnhookWindowsHookEx,
    HHOOK, MSG, WH_KEYBOARD_LL, WM_KEYDOWN, WM_QUIT, WM_SYSKEYDOWN,
};

static HOOK_INSTALLED: AtomicBool = AtomicBool::new(false);
static HOOK_THREAD_ID: AtomicU32 = AtomicU32::new(0);
static HOOK_HANDLE: Mutex<Option<HHOOK>> = Mutex::new(None);
static APP_HANDLE: Mutex<Option<AppHandle>> = Mutex::new(None);

fn vk_to_string(vk_code: u32) -> String {
    if (VK_0.0..=VK_9.0).contains(&vk_code) {
        return char::from_digit(vk_code - VK_0.0, 10).unwrap_or('?').to_string();
    }
    let letter = match vk_code {
        x if x == VK_A.0 => Some('a'),
        x if x == VK_B.0 => Some('b'),
        x if x == VK_C.0 => Some('c'),
        x if x == VK_D.0 => Some('d'),
        x if x == VK_E.0 => Some('e'),
        x if x == VK_F.0 => Some('f'),
        x if x == VK_G.0 => Some('g'),
        x if x == VK_H.0 => Some('h'),
        x if x == VK_I.0 => Some('i'),
        x if x == VK_J.0 => Some('j'),
        x if x == VK_K.0 => Some('k'),
        x if x == VK_L.0 => Some('l'),
        x if x == VK_M.0 => Some('m'),
        x if x == VK_N.0 => Some('n'),
        x if x == VK_O.0 => Some('o'),
        x if x == VK_P.0 => Some('p'),
        x if x == VK_Q.0 => Some('q'),
        x if x == VK_R.0 => Some('r'),
        x if x == VK_S.0 => Some('s'),
        x if x == VK_T.0 => Some('t'),
        x if x == VK_U.0 => Some('u'),
        x if x == VK_V.0 => Some('v'),
        x if x == VK_W.0 => Some('w'),
        x if x == VK_X.0 => Some('x'),
        x if x == VK_Y.0 => Some('y'),
        x if x == VK_Z.0 => Some('z'),
        _ => None,
    };
    if let Some(c) = letter {
        return c.to_string();
    }
    match vk_code {
        x if x == VK_SPACE.0 => "Space".to_string(),
        x if x == VK_RETURN.0 => "Enter".to_string(),
        x if x == VK_BACK.0 => "Backspace".to_string(),
        x if x == VK_TAB.0 => "Tab".to_string(),
        x if x == VK_SHIFT.0 => "Shift".to_string(),
        x if x == VK_CONTROL.0 => "Ctrl".to_string(),
        x if x == VK_MENU.0 => "Alt".to_string(),
        x if x == VK_LWIN.0 || x == VK_RWIN.0 => "Win".to_string(),
        x if x == VK_ESCAPE.0 => "Esc".to_string(),
        x if x == VK_CAPITAL.0 => "CapsLock".to_string(),
        _ => format!("VK_{}", vk_code),
    }
}

unsafe extern "system" fn keyboard_proc(_code: i32, wparam: usize, lparam: isize) -> isize {
    if _code < 0 {
        return CallNextHookEx(None, _code, wparam, lparam);
    }
    let msg = wparam as u32;
    if msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN {
        let kb = *(lparam as *const KBDLLHOOKSTRUCT);
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
        combo.push_str(&key);

        if let Some(app) = APP_HANDLE.lock().unwrap().as_ref() {
            let _ = app.emit("keyboard-event", &combo);
        }
    }
    CallNextHookEx(None, _code, wparam, lparam)
}

#[tauri::command]
pub fn start_keyboard_hook(app: AppHandle) -> Result<(), String> {
    if HOOK_INSTALLED.load(Ordering::SeqCst) {
        return Ok(());
    }
    *APP_HANDLE.lock().unwrap() = Some(app);

    std::thread::spawn(|| unsafe {
        let hinst: HINSTANCE = GetModuleHandleW(None).map_err(|e| e.to_string()).unwrap();
        let hook = SetWindowsHookExW(WH_KEYBOARD_LL, Some(keyboard_proc), Some(hinst), 0)
            .map_err(|e| e.to_string())
            .unwrap();
        *HOOK_HANDLE.lock().unwrap() = Some(hook);
        HOOK_INSTALLED.store(true, Ordering::SeqCst);

        // 记录当前线程 ID（用于 stop）
        let thread_id = windows::Win32::System::Threading::GetCurrentThreadId();
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
            let _ = PostThreadMessageW(thread_id, WM_QUIT, None, None);
        }
    }
    Ok(())
}
