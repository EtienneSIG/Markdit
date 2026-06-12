//! File-system watcher (FR-007 — external change / conflict detection). Emits
//! `document:changed` events to the frontend when a watched file changes on disk.

use notify::{Event, RecursiveMode, Watcher};
use std::path::Path;
use std::sync::mpsc::channel;

/// Watch a file for external modifications. Blocks; intended to run on a
/// dedicated thread spawned by the command layer.
pub fn watch_file<F: Fn(Event) + Send + 'static>(path: &str, on_event: F) -> notify::Result<()> {
    let (tx, rx) = channel();
    let mut watcher = notify::recommended_watcher(move |res| {
        if let Ok(event) = res {
            let _ = tx.send(event);
        }
    })?;
    watcher.watch(Path::new(path), RecursiveMode::NonRecursive)?;
    for event in rx {
        on_event(event);
    }
    Ok(())
}
