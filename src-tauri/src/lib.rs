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
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(document::WatchRegistry::default())
        .invoke_handler(tauri::generate_handler![
            document::document_open,
            document::document_save,
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
