# Contracts: Markdit Core Editor

**Feature**: 001-markdit-core | **Date**: 2026-06-12

Markdit is a desktop application, not a web service, so its "contracts" are the
internal boundaries that other parts of the system (and tests) depend on:

| Contract | File | Boundary |
|----------|------|----------|
| Tauri IPC commands | [tauri-commands.md](tauri-commands.md) | Rust core ⇄ React frontend |
| Markdown engine | [markdown-engine.md](markdown-engine.md) | remark/rehype single source of truth |
| Export targets | [export-targets.md](export-targets.md) | Word (offline) / OneNote / Loop (Graph) |
| Settings & consent | [settings-consent.md](settings-consent.md) | Local privacy/consent persistence |

These contracts are stable interfaces: changes require a version note and updated
tests. They are technology-agnostic at the signature level (TypeScript shapes for
the frontend boundary; equivalent Rust types in `src-tauri`).

Each contract is paired with the test discipline that verifies it:

- Tauri commands → Rust `cargo test` + Playwright E2E.
- Markdown engine → golden-file round-trip corpus (`tests/corpus/`).
- Export targets → Vitest unit + Playwright E2E (cloud mocked, consent enforced).
- Settings & consent → Vitest unit + E2E (default-local invariant).
