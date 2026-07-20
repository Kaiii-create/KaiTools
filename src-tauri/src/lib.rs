mod commands;

use tauri::{Manager, WindowEvent};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

fn parse_shortcut(s: &str) -> Option<Shortcut> {
    s.parse::<Shortcut>().ok()
}

fn toggle_window_visibility(window: &tauri::WebviewWindow) {
    if window.is_visible().unwrap_or(false) {
        let _ = window.hide();
    } else {
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, shortcut, event| {
                    if event.state != ShortcutState::Pressed {
                        return;
                    }
                    // 默认快捷键 Alt+Space 切换窗口
                    if let Some(window) = app.get_webview_window("main") {
                        toggle_window_visibility(&window);
                    }
                    let _ = shortcut;
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            commands::json::format_json,
            commands::json::minify_json,
            commands::json::validate_json,
            commands::keyboard::start_keyboard_hook,
            commands::keyboard::stop_keyboard_hook,
            commands::http::http_request,
        ])
        .setup(|app| {
            // 注册全局快捷键 Alt+Space
            let app_handle = app.handle().clone();
            if let Some(shortcut) = parse_shortcut("Alt+Space") {
                let _ = app_handle.global_shortcut().register(shortcut);
            }

            // 关闭窗口时询问（最小化到托盘）
            let main_window = app.get_webview_window("main").unwrap();
            let w = main_window.clone();
            main_window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    // 阻止关闭，改为隐藏
                    api.prevent_close();
                    let _ = w.hide();
                }
            });

            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running KTool application");
}
