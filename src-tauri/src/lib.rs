//! Markdit desktop core (Tauri 2). Wires the command handlers and plugins.
//! The Markdown engine lives entirely in the frontend; the Rust core handles
//! local file I/O, settings persistence, signed updates and file watching.

mod commands;
mod fs_watch;

use commands::{document, export, settings, update};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            document::document_open,
            document::document_save,
            export::export_docx,
            settings::settings_get,
            settings::settings_set,
            update::updater_check,
            update::updater_install,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Markdit");
}
