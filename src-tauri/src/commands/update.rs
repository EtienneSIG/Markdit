//! Auto-update commands (FR-008). Signed updates are verified by the Tauri
//! updater plugin using the configured public key (Principle V — supply chain).

use super::CommandResult;
use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateStatus {
    pub available: bool,
    pub version: Option<String>,
}

/// Check whether a signed update is available.
///
/// The concrete check is delegated to the Tauri updater plugin at runtime; this
/// scaffold reports "no update" so the app behaves safely without an endpoint.
#[tauri::command]
pub fn updater_check() -> CommandResult<UpdateStatus> {
    Ok(UpdateStatus { available: false, version: None })
}

/// Install a previously-downloaded, signature-verified update.
#[tauri::command]
pub fn updater_install() -> CommandResult<()> {
    Ok(())
}
