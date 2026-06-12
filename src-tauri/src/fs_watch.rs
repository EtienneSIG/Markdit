//! File-system watcher (FR-007 — external change / conflict detection). Provides
//! a non-blocking watcher whose handle is kept alive by the command layer; the
//! frontend is notified through a `document://changed` event.

use notify::{Event, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::Path;

/// Create and start a watcher for a single file. The returned [`RecommendedWatcher`]
/// must be kept alive by the caller; dropping it stops the watch. The callback
/// fires on the watcher's own thread for every filesystem event on `path`.
pub fn spawn_watcher<F>(path: &str, on_event: F) -> notify::Result<RecommendedWatcher>
where
    F: Fn(Event) + Send + 'static,
{
    let mut watcher = notify::recommended_watcher(move |res: notify::Result<Event>| {
        if let Ok(event) = res {
            on_event(event);
        }
    })?;
    watcher.watch(Path::new(path), RecursiveMode::NonRecursive)?;
    Ok(watcher)
}
