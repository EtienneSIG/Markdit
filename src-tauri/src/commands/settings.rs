//! Persisted privacy/settings profile (FR-013/014, Principle III). Stored as a
//! single JSON file in the OS app-config directory; defaults are privacy-first.

use super::{CommandError, CommandResult};
use serde_json::Value;
use std::path::PathBuf;

fn settings_path() -> Option<PathBuf> {
    dirs_next_config().map(|mut p| {
        p.push("Markdit");
        p.push("settings.json");
        p
    })
}

// Minimal config-dir resolver without an extra dependency in the scaffold.
fn dirs_next_config() -> Option<PathBuf> {
    #[cfg(target_os = "windows")]
    {
        std::env::var_os("APPDATA").map(PathBuf::from)
    }
    #[cfg(not(target_os = "windows"))]
    {
        std::env::var_os("XDG_CONFIG_HOME")
            .map(PathBuf::from)
            .or_else(|| std::env::var_os("HOME").map(|h| PathBuf::from(h).join(".config")))
    }
}

fn defaults() -> Value {
    serde_json::json!({
        "telemetryEnabled": false,
        "allowRemoteContent": false,
        "cloudExportConsents": {},
        "signedInAccount": null,
        "locale": "en",
        "theme": "system"
    })
}

/// Read the persisted settings, returning privacy-first defaults if absent.
#[tauri::command]
pub fn settings_get() -> CommandResult<Value> {
    let path = settings_path().ok_or_else(|| CommandError::io_error("No config dir"))?;
    match std::fs::read_to_string(&path) {
        Ok(s) => serde_json::from_str(&s).map_err(|e| CommandError::io_error(e.to_string())),
        Err(_) => Ok(defaults()),
    }
}

/// Merge a partial patch into the settings and persist atomically.
#[tauri::command]
pub fn settings_set(patch: Value) -> CommandResult<Value> {
    let mut current = settings_get()?;
    if let (Some(obj), Some(p)) = (current.as_object_mut(), patch.as_object()) {
        for (k, v) in p {
            obj.insert(k.clone(), v.clone());
        }
    }
    let path = settings_path().ok_or_else(|| CommandError::io_error("No config dir"))?;
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| CommandError::io_error(e.to_string()))?;
    }
    let serialized =
        serde_json::to_string_pretty(&current).map_err(|e| CommandError::io_error(e.to_string()))?;
    std::fs::write(&path, serialized).map_err(|e| CommandError::io_error(e.to_string()))?;
    Ok(current)
}
