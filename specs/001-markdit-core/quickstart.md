# Quickstart: Markdit Core Editor

**Feature**: 001-markdit-core | **Date**: 2026-06-12

This quickstart describes how a developer sets up the project and how the design
is validated against the spec's success criteria. It is a planning artifact — no
application source code is created by `/speckit.plan`.

## Prerequisites

- Windows 10 x64 (22H2+) or Windows 11 x64/ARM64
- Node.js 20 LTS + npm
- Rust 1.81+ (`rustup`) with the MSVC toolchain
- WebView2 runtime (preinstalled on Windows 11; evergreen installer on Windows 10)
- Tauri 2 prerequisites (Visual Studio Build Tools — Desktop C++)

## Project layout (created during implementation)

```text
src-tauri/   # Rust core: file I/O, packaging, signing, updater, offline .docx write
src/         # React + Vite frontend: editor, toolbar, markdown engine, export, privacy
tests/       # unit (Vitest), e2e (Playwright), a11y (axe-core), corpus (round-trip)
```

## First-time setup (planned commands)

```powershell
# Install frontend deps
npm install

# Run the app in development (Tauri shell + Vite HMR)
npm run tauri dev

# Build a signed Windows installer (MSI/NSIS)
npm run tauri build

# Generate the SBOM (CycloneDX) for Rust + npm
npm run sbom
```

> Code-signing certificates and the updater signing key are provided via CI
> secrets; local dev builds are unsigned.

## Validating the design against success criteria

| Success criterion | How it is validated | Test location |
|-------------------|---------------------|---------------|
| SC-001 GFM renders like Git | Golden render comparison over the corpus | `tests/corpus/`, `tests/unit/` |
| SC-002 1 MB opens < 1 s | Performance test opening a 1 MB fixture | `tests/e2e/` |
| SC-003 Lossless round-trip | `serialize(parse(md))` equals expected | `tests/corpus/` |
| SC-004 Format via toolbar < 30 s | Keyboard/toolbar E2E flow | `tests/e2e/` |
| SC-005 Signed install/uninstall | Signature check + install/uninstall E2E on supported Windows | CI + manual |
| SC-006 Export fidelity ≥ 95% | Per-target export fidelity checks | `tests/unit/`, `tests/e2e/` |
| SC-007 WCAG 2.2 AA | axe-core automated + keyboard-only manual | `tests/a11y/` |
| SC-008 No content leaves w/o consent | Network assertions; consent log audit | `tests/e2e/` |
| SC-009 No open CRITICAL findings | Compliance backlog review at release | `compliance/backlog/` |

## Smoke walkthrough (maps to user stories)

1. **US1 — Read/render**: open a GFM fixture → renders as rich content (headings,
   tables, task lists, fenced code with highlighting) within 1 s; raw HTML is
   sanitized; remote content not fetched without consent.
2. **US2 — Visual edit**: create a new doc → apply Bold/Heading/List/Link/Table
   from the toolbar (no Markdown typed) → save → reopen → content is unchanged
   (lossless). Toggle the raw Markdown source view.
3. **US3 — Install/update**: run the signed installer on a clean machine →
   launches, opens a file, updates via the verified channel, uninstalls cleanly
   while preserving user documents.
4. **US4 — Export**: export a full-feature doc to Word (offline) → opens in Word
   with structure preserved; export to OneNote/Loop after explicit sign-in +
   consent → content created, non-representable elements reported.

## Privacy & accessibility checks (always on)

- First run is fully local: telemetry off, remote content off, no consents.
- All primary flows operable by keyboard with visible focus and screen-reader
  labels; theme respects OS high-contrast/reduced-motion.
- Telemetry, if enabled, is anonymized and can be disabled instantly.

## Compliance hand-off

After `/speckit.tasks` and/or implementation, the compliance agents
(`/markdit.compliance.eu`, `/markdit.compliance.na`, `/markdit.compliance.audit`)
audit the artifacts a posteriori and write findings to `compliance/backlog/`.
Release requires zero open `CRITICAL` items (SC-009).
