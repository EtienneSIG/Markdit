//! Rust contract tests, compiled only under `cfg(test)`.
//! See `specs/001-markdit-core/contracts/tauri-commands.md`.

mod document_open;
mod document_save_conflict;
mod updater_signature;

use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

static COUNTER: AtomicU64 = AtomicU64::new(0);

/// Create a unique temporary file path (not created on disk yet) for a test.
pub(crate) fn unique_temp_path(suffix: &str) -> PathBuf {
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let n = COUNTER.fetch_add(1, Ordering::Relaxed);
    let mut p = std::env::temp_dir();
    p.push(format!("markdit-test-{nanos}-{n}-{suffix}"));
    p
}
