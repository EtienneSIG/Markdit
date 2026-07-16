//! Document file I/O commands (FR-001, FR-006, FR-007). All reads/writes stay
//! local; conflict detection uses content hashes (Principle III/V).

use super::{CommandError, CommandResult};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::path::Path;

use base64::Engine;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenedDocument {
    pub path: String,
    pub file_name: String,
    pub markdown: String,
    pub size_bytes: u64,
    pub content_hash: String,
}

fn hash(content: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// True when the argument looks like an existing Markdown file we should open.
/// Used to pick the target out of the raw command line passed by Windows when a
/// `.md` file is double-clicked or "Open with Markdit" is used.
pub fn is_markdown_path(arg: &str) -> bool {
    let lower = arg.to_ascii_lowercase();
    let has_ext = lower.ends_with(".md")
        || lower.ends_with(".markdown")
        || lower.ends_with(".mdown")
        || lower.ends_with(".mkd");
    has_ext && Path::new(arg).is_file()
}

/// Return the first Markdown file path passed on the command line (file
/// association / "Open with"), if any. The frontend calls this once on startup
/// so a double-clicked file opens automatically. Never opens a folder.
#[tauri::command]
pub fn document_startup_file() -> Option<String> {
    std::env::args().skip(1).find(|a| is_markdown_path(a))
}

/// Open and read a Markdown file as UTF-8.
#[tauri::command]
pub fn document_open(path: String) -> CommandResult<OpenedDocument> {
    let p = Path::new(&path);
    let markdown = std::fs::read_to_string(p).map_err(|e| match e.kind() {
        std::io::ErrorKind::NotFound => CommandError::not_found(path.clone()),
        std::io::ErrorKind::PermissionDenied => CommandError::permission_denied(path.clone()),
        _ => CommandError::io_error(e.to_string()),
    })?;
    let size_bytes = markdown.len() as u64;
    Ok(OpenedDocument {
        file_name: p.file_name().and_then(|s| s.to_str()).unwrap_or("Untitled.md").to_string(),
        content_hash: hash(&markdown),
        path,
        markdown,
        size_bytes,
    })
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveResult {
    pub content_hash: String,
}
#[tauri::command]
pub fn document_save(
    path: String,
    markdown: String,
    expected_disk_hash: String,
) -> CommandResult<SaveResult> {
    if let Ok(current) = std::fs::read_to_string(&path) {
        if hash(&current) != expected_disk_hash && !expected_disk_hash.is_empty() {
            return Err(CommandError::conflict(
                "File changed on disk since last load.".to_string(),
            ));
        }
    }
    std::fs::write(&path, &markdown).map_err(|e| CommandError::io_error(e.to_string()))?;
    Ok(SaveResult { content_hash: hash(&markdown) })
}

/// Guess an image MIME type from a file extension (best-effort).
fn image_mime(path: &Path) -> &'static str {
    match path
        .extension()
        .and_then(|e| e.to_str())
        .map(|s| s.to_ascii_lowercase())
        .as_deref()
    {
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("gif") => "image/gif",
        Some("webp") => "image/webp",
        Some("svg") => "image/svg+xml",
        Some("bmp") => "image/bmp",
        Some("ico") => "image/x-icon",
        Some("avif") => "image/avif",
        Some("apng") => "image/apng",
        _ => "application/octet-stream",
    }
}

/// Resolve an image referenced by `src` relative to the document at `doc_path`
/// and return it as a base64 data URL. Lets a file-association document display
/// images that the browser File System Access API cannot reach. Reads stay local
/// (Principle III); only the requested file is read.
#[tauri::command]
pub fn read_image_data_url(doc_path: String, src: String) -> CommandResult<String> {
    let base_dir = Path::new(&doc_path)
        .parent()
        .unwrap_or_else(|| Path::new("."));
    let src_path = Path::new(&src);
    let target = if src_path.is_absolute() {
        src_path.to_path_buf()
    } else {
        base_dir.join(src_path)
    };

    if !target.is_file() {
        return Err(CommandError::not_found(target.to_string_lossy().to_string()));
    }
    let bytes = std::fs::read(&target).map_err(|e| match e.kind() {
        std::io::ErrorKind::NotFound => {
            CommandError::not_found(target.to_string_lossy().to_string())
        }
        std::io::ErrorKind::PermissionDenied => {
            CommandError::permission_denied(target.to_string_lossy().to_string())
        }
        _ => CommandError::io_error(e.to_string()),
    })?;
    let encoded = base64::engine::general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:{};base64,{}", image_mime(&target), encoded))
}

/// Registry of active file watchers, keyed by absolute path. Keeping the watcher
/// handle alive keeps the watch running; removing it stops the watch.
#[derive(Default)]
pub struct WatchRegistry(pub std::sync::Mutex<std::collections::HashMap<String, notify::RecommendedWatcher>>);

/// Payload emitted to the frontend when a watched file changes on disk.
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DocumentChanged {
    path: String,
    disk_hash: String,
}

/// Begin watching a file for external modifications (FR-007). Emits a
/// `document://changed` event carrying the new on-disk hash so the frontend can
/// prompt the user to resolve the conflict without clobbering their edits.
#[tauri::command]
pub fn document_watch(
    app: tauri::AppHandle,
    registry: tauri::State<'_, WatchRegistry>,
    path: String,
) -> CommandResult<()> {
    use tauri::Emitter;

    let watch_path = path.clone();
    let watcher = crate::fs_watch::spawn_watcher(&path, move |event| {
        if matches!(
            event.kind,
            notify::EventKind::Modify(_) | notify::EventKind::Create(_)
        ) {
            if let Ok(content) = std::fs::read_to_string(&watch_path) {
                let _ = app.emit(
                    "document://changed",
                    DocumentChanged { path: watch_path.clone(), disk_hash: hash(&content) },
                );
            }
        }
    })
    .map_err(|e| CommandError::io_error(e.to_string()))?;

    registry
        .0
        .lock()
        .map_err(|e| CommandError::io_error(e.to_string()))?
        .insert(path, watcher);
    Ok(())
}

/// Stop watching a previously-watched file.
#[tauri::command]
pub fn document_unwatch(
    registry: tauri::State<'_, WatchRegistry>,
    path: String,
) -> CommandResult<()> {
    registry
        .0
        .lock()
        .map_err(|e| CommandError::io_error(e.to_string()))?
        .remove(&path);
    Ok(())
}
