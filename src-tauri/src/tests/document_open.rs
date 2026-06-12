//! T020 [US1] — `document_open` round-trips bytes unchanged (FR-001).
//! Verifies that opening a Markdown file returns the exact content stored on
//! disk and a stable content hash.

use super::unique_temp_path;
use crate::commands::document::document_open;

/// A small corpus exercising CommonMark + GFM constructs and tricky bytes.
fn corpus() -> Vec<(&'static str, &'static str)> {
    vec![
        ("empty", ""),
        ("simple", "# Title\n\nA paragraph.\n"),
        (
            "gfm",
            "- [ ] todo\n- [x] done\n\n| a | b |\n|---|---|\n| 1 | 2 |\n\n~~strike~~\n",
        ),
        (
            "code-fence",
            "```rust\nfn main() {\n    println!(\"hi\");\n}\n```\n",
        ),
        ("unicode", "Café — naïve — 日本語 — 😀\r\nMixed CRLF line.\n"),
        ("trailing-ws", "line with spaces   \nno-trailing\n"),
    ]
}

#[test]
fn document_open_round_trips_corpus_unchanged() {
    for (name, content) in corpus() {
        let path = unique_temp_path(&format!("{name}.md"));
        std::fs::write(&path, content).expect("write fixture");

        let opened = document_open(path.to_string_lossy().to_string())
            .expect("document_open should succeed for an existing file");

        assert_eq!(
            opened.markdown, content,
            "markdown bytes must round-trip unchanged for case '{name}'"
        );
        assert_eq!(
            opened.size_bytes as usize,
            content.len(),
            "size_bytes must equal byte length for case '{name}'"
        );
        assert_eq!(
            opened.content_hash.len(),
            64,
            "content_hash must be a 64-char SHA-256 hex digest for case '{name}'"
        );
        assert_eq!(
            opened.file_name,
            path.file_name().unwrap().to_string_lossy(),
            "file_name must match the opened path for case '{name}'"
        );

        let _ = std::fs::remove_file(&path);
    }
}

#[test]
fn document_open_missing_file_reports_not_found() {
    let path = unique_temp_path("does-not-exist.md");
    let err = document_open(path.to_string_lossy().to_string())
        .expect_err("opening a missing file must fail");
    assert_eq!(err.code, "NOT_FOUND");
}
