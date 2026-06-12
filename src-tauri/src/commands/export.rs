//! Export commands. The Word (.docx) bytes are produced on the frontend by the
//! engine and handed to the core only to write the file the user chooses
//! (FR-009). No content leaves the device for offline export (Principle III).

use super::{CommandError, CommandResult};
use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportDocxResult {
    pub output_path: String,
}

/// Persist pre-rendered .docx bytes to a user-selected path.
#[tauri::command]
pub fn export_docx(docx_bytes: Vec<u8>, output_path: String) -> CommandResult<ExportDocxResult> {
    if docx_bytes.is_empty() {
        return Err(CommandError::invalid_argument("Empty document bytes"));
    }
    std::fs::write(&output_path, &docx_bytes)
        .map_err(|e| CommandError::io_error(e.to_string()))?;
    Ok(ExportDocxResult { output_path })
}
