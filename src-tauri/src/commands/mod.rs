//! Typed command errors crossing the IPC boundary (contracts/tauri-commands.md).
//! Errors are serialized as `{ code, message }` values, never panics.

use serde::Serialize;

/// Canonical error codes. The wire shape is `{ code, message }` produced by
/// [`CommandError`]; this enum documents the closed set of codes.
#[allow(dead_code)]
#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE", tag = "code", content = "message")]
pub enum ErrorCode {
    NotFound(String),
    PermissionDenied(String),
    IoError(String),
    Conflict(String),
    InvalidArgument(String),
    Cancelled(String),
}

/// Error shape matching the frontend `CommandError` type.
#[derive(Debug, Serialize, Clone)]
pub struct CommandError {
    pub code: String,
    pub message: String,
}

impl CommandError {
    pub fn not_found(msg: impl Into<String>) -> Self {
        Self { code: "NOT_FOUND".into(), message: msg.into() }
    }
    pub fn permission_denied(msg: impl Into<String>) -> Self {
        Self { code: "PERMISSION_DENIED".into(), message: msg.into() }
    }
    pub fn io_error(msg: impl Into<String>) -> Self {
        Self { code: "IO_ERROR".into(), message: msg.into() }
    }
    pub fn conflict(msg: impl Into<String>) -> Self {
        Self { code: "CONFLICT".into(), message: msg.into() }
    }
    pub fn invalid_argument(msg: impl Into<String>) -> Self {
        Self { code: "INVALID_ARGUMENT".into(), message: msg.into() }
    }
    #[allow(dead_code)] // Part of the closed error API; used by forthcoming command paths.
    pub fn cancelled(msg: impl Into<String>) -> Self {
        Self { code: "CANCELLED".into(), message: msg.into() }
    }
}

pub type CommandResult<T> = Result<T, CommandError>;

pub mod document;
pub mod export;
pub mod settings;
pub mod update;
