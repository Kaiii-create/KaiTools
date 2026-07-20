// 防止 release 模式下出现控制台窗口
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    ktool_lib::run()
}
