//! Markdit desktop core (Tauri 2). Wires the command handlers and plugins.
//! The Markdown engine lives entirely in the frontend; the Rust core handles
//! local file I/O, settings persistence, signed updates and file watching.

mod commands;
mod fs_watch;

#[cfg(test)]
mod tests;

use commands::{document, settings, update};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            // A second launch (e.g. double-clicking another .md while Markdit is
            // already open) routes the file to the existing window instead of
            // starting a new process. Reads the file path off the new instance's
            // command line, hands it to the frontend and focuses the window.
            use tauri::Manager;
            let win = app.get_webview_window("main");
            if let Some(path) = argv.iter().skip(1).find(|a| document::is_markdown_path(a)) {
                if let Some(win) = &win {
                    let json = serde_json::to_string(path).unwrap_or_else(|_| "\"\"".into());
                    let _ = win.eval(&format!(
                        "window.__markditOpenFile ? window.__markditOpenFile({json}) : ((window.__markditPendingOpen = window.__markditPendingOpen || []).push({json}))"
                    ));
                }
            }
            if let Some(win) = &win {
                let _ = win.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(document::WatchRegistry::default())
        .invoke_handler(tauri::generate_handler![
            document::document_open,
            document::document_save,
            document::document_startup_file,
            document::document_watch,
            document::document_unwatch,
            settings::settings_get,
            settings::settings_set,
            update::updater_check,
            update::updater_install,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Markdit");
}
