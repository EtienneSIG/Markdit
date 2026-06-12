//! T033 [US2] — `document_save` returns `CONFLICT` when the on-disk hash
//! differs from the caller's expected hash (FR-005).

use super::unique_temp_path;
use crate::commands::document::{document_open, document_save};

#[test]
fn document_save_detects_external_change_as_conflict() {
    let path = unique_temp_path("conflict.md");
    let path_str = path.to_string_lossy().to_string();

    // Initial content the editor loaded.
    std::fs::write(&path, "original\n").expect("write initial");
    let loaded = document_open(path_str.clone()).expect("open initial");

    // Someone else changes the file on disk after we loaded it.
    std::fs::write(&path, "changed by another process\n").expect("external write");

    // Saving with the stale hash must be refused.
    let err = document_save(path_str.clone(), "my edits\n".to_string(), loaded.content_hash)
        .expect_err("stale hash must produce a conflict");
    assert_eq!(err.code, "CONFLICT");

    // The on-disk content must remain the external version (no clobber).
    let on_disk = std::fs::read_to_string(&path).expect("read after refused save");
    assert_eq!(on_disk, "changed by another process\n");

    let _ = std::fs::remove_file(&path);
}

#[test]
fn document_save_succeeds_with_matching_hash() {
    let path = unique_temp_path("save-ok.md");
    let path_str = path.to_string_lossy().to_string();

    std::fs::write(&path, "first\n").expect("write initial");
    let loaded = document_open(path_str.clone()).expect("open initial");

    let result = document_save(path_str.clone(), "second\n".to_string(), loaded.content_hash)
        .expect("save with matching hash should succeed");
    assert_eq!(result.content_hash.len(), 64);

    let on_disk = std::fs::read_to_string(&path).expect("read after save");
    assert_eq!(on_disk, "second\n");

    let _ = std::fs::remove_file(&path);
}

#[test]
fn document_save_creates_new_file_when_empty_expected_hash() {
    let path = unique_temp_path("new-file.md");
    let path_str = path.to_string_lossy().to_string();

    // No file exists yet; an empty expected hash means "no prior load".
    let result = document_save(path_str.clone(), "brand new\n".to_string(), String::new())
        .expect("first save of a new file should succeed");
    assert_eq!(result.content_hash.len(), 64);

    let on_disk = std::fs::read_to_string(&path).expect("read after create");
    assert_eq!(on_disk, "brand new\n");

    let _ = std::fs::remove_file(&path);
}
