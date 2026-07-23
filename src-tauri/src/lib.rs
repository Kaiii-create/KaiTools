mod commands;

use std::sync::Mutex;

use tauri::menu::{MenuBuilder, MenuItemBuilder};
use tauri::tray::TrayIconBuilder;
use tauri::{Emitter, Manager, WindowEvent};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

/// 关闭主窗口时的行为："ask"（弹窗询问）/ "minimize"（最小化到托盘）/ "quit"（直接退出）
struct CloseMode(Mutex<String>);

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct AppInfo {
    app_name: String,
    app_version: String,
    tauri_version: String,
    os: String,
}

#[tauri::command]
fn get_app_info(app: tauri::AppHandle) -> AppInfo {
    let package = app.package_info();
    AppInfo {
        app_name: package.name.clone(),
        app_version: package.version.to_string(),
        tauri_version: tauri::VERSION.to_string(),
        os: if cfg!(target_os = "windows") {
            "Windows".to_string()
        } else {
            std::env::consts::OS.to_string()
        },
    }
}

#[tauri::command]
fn set_close_mode(app: tauri::AppHandle, mode: String) {
    let m = match mode.as_str() {
        "minimize" | "quit" => mode,
        _ => "ask".to_string(),
    };
    *app.state::<CloseMode>()
        .0
        .lock()
        .unwrap_or_else(|e| e.into_inner()) = m;
}

/// 直接退出应用（绕开 CloseRequested 的拦截）
#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}

fn parse_shortcut(s: &str) -> Option<Shortcut> {
    let s = s.trim();
    if s.is_empty() {
        return None;
    }
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
    // 窗口显隐快捷键（仅该快捷键由 Rust 处理，其余交给前端）
    let window_toggle = parse_shortcut("Alt+Space");
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .manage(CloseMode(Mutex::new("ask".to_string())))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, shortcut, event| {
                    if event.state != ShortcutState::Pressed {
                        return;
                    }
                    // 窗口显隐：Alt+Space
                    if let Some(wt) = window_toggle.as_ref() {
                        if shortcut == wt {
                            if let Some(window) = app.get_webview_window("main") {
                                toggle_window_visibility(&window);
                            }
                            return;
                        }
                    }
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
            commands::http::fetch_image_bytes,
            commands::document::convert_document,
            set_close_mode,
            quit_app,
            get_app_info,
        ])
        .setup(|app| {
            // 注册窗口显隐快捷键 Alt+Space
            let app_handle = app.handle().clone();
            if let Some(shortcut) = parse_shortcut("Alt+Space") {
                let _ = app_handle.global_shortcut().register(shortcut);
            }

            // 关闭窗口行为：尊重设置（ask/minimize 隐藏到托盘，quit 允许退出）
            let main_window = app.get_webview_window("main").unwrap();
            let w = main_window.clone();
            let close_app = app_handle.clone();
            main_window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    let mode = close_app
                        .state::<CloseMode>()
                        .0
                        .lock()
                        .unwrap_or_else(|e| e.into_inner())
                        .clone();
                    if mode == "quit" {
                        // 允许直接退出
                        return;
                    }
                    // ask / minimize：阻止系统关闭；ask 交给前端显示选择框。
                    api.prevent_close();
                    if mode == "ask" {
                        let _ = w.emit("request-close-choice", ());
                    } else {
                        let _ = w.hide();
                    }
                }
            });

            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    window.open_devtools();
                }
            }

            // 托盘图标与菜单（最小化到后台后用于唤出 / 退出）
            if let Some(icon) = app.default_window_icon() {
                let show_item = MenuItemBuilder::with_id("show", "显示 KTool").build(app)?;
                let quit_item = MenuItemBuilder::with_id("quit", "退出 KTool").build(app)?;
                let menu = MenuBuilder::new(app)
                    .items(&[&show_item, &quit_item])
                    .build()?;
                let _ = TrayIconBuilder::new()
                    .icon(icon.clone())
                    .tooltip("KTool")
                    .menu(&menu)
                    .on_menu_event(|app, event| match event.id().as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => app.exit(0),
                        _ => {}
                    })
                    .build(app);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running KTool application");
}
