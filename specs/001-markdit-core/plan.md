# Implementation Plan: Markdit Core Editor

**Branch**: `001-markdit-core` | **Date**: 2026-06-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-markdit-core/spec.md`

**Note**: This plan is filled in by the `/speckit.plan` command. It produces design
artifacts only (no application source code).

## Summary

Markdit is a Windows-first, local-first WYSIWYG Markdown editor. The Core Editor
feature delivers four user-facing capabilities: (1) read & render Markdown with
Git-equivalent fidelity (CommonMark + GFM), (2) edit visually via a toolbar and
keyboard shortcuts with no raw Markdown typing required, (3) install/update on
Windows through a signed installer, and (4) export to Word `.docx` (offline) plus
OneNote and Microsoft Loop (cloud, consented).

**Technical approach**: A Tauri 2 desktop shell (Rust core for file I/O, packaging,
signing, and updates) hosts a TypeScript + React + Vite frontend. TipTap
(ProseMirror) provides the visual editing surface; **remark/rehype** (CommonMark +
`remark-gfm`) is the single Markdown source-of-truth engine guaranteeing lossless
round-trip, with `rehype-sanitize` for untrusted HTML and Shiki/highlight.js for
syntax highlighting. Documents persist as plain `.md` text via the Rust layer. Word
export uses an offline JS `docx` generator; OneNote/Loop use Microsoft Graph with
MSAL OAuth2 and explicit consent. Quality is enforced by Vitest + React Testing
Library, Rust unit tests, Playwright E2E, axe-core accessibility scans, and a
golden-file Markdown round-trip corpus. Telemetry is opt-in only.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend), Rust 1.81+ (Tauri core), Node.js
20 LTS (build tooling)

**Primary Dependencies**:
- Shell/packaging: Tauri 2 (`tauri`, `tauri-plugin-updater`, `tauri-plugin-fs`,
  `tauri-plugin-dialog`)
- UI: React 18, Vite 5, TipTap 2 (ProseMirror)
- Markdown engine: `unified`, `remark-parse`, `remark-gfm`, `remark-rehype`,
  `rehype-sanitize`, `rehype-stringify`, `remark-stringify`
- Syntax highlighting: Shiki (preferred) or highlight.js
- Export: `docx` (Word, offline); `@azure/msal-browser` / `@azure/msal-node` +
  Microsoft Graph SDK (OneNote, Loop)
- Accessibility tooling: `@axe-core/playwright`

**Storage**: Local filesystem only. Documents are plain `.md`/`.markdown` UTF-8
text. App settings/consent flags in a local config file managed by the Tauri core.
No database; no cloud storage of document content.

**Testing**: Vitest + React Testing Library (frontend units/components), `cargo
test` (Rust core units), Playwright (E2E across the packaged app), axe-core (WCAG
2.2 AA automated), golden-file round-trip corpus (Markdown fidelity).

**Target Platform**: Windows 10 x64 (22H2+) and Windows 11 x64/ARM64 desktop.

**Project Type**: Desktop application (Tauri shell + web frontend + Rust core).

**Performance Goals**: Open & render `.md` files up to 1 MB in < 1 s (SC-002);
typing/formatting interactions remain responsive (input latency target < 50 ms)
on a typical supported Windows machine.

**Constraints**: Local-first (no network without explicit per-action consent);
lossless Markdown round-trip; signed installer + signed updates; WCAG 2.2 AA / EN
301 549 / Section 508; SBOM maintained; sanitized untrusted HTML; graceful
degradation documented for files > 10 MB.

**Scale/Scope**: Single-user desktop editor. One active document at a time (MVP),
files typically < 1 MB, documented degradation beyond 10 MB. ~4 user stories, 16
functional requirements, 3 export targets.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | How the plan satisfies it | Status |
|---|-----------|---------------------------|--------|
| I | Markdown Fidelity & Open Standards | remark/rehype with `remark-gfm` is the single source of truth; golden-file round-trip corpus enforces lossless edits; native files stay plain `.md`. TipTap state is serialized back through remark, never persisted as a proprietary format. | PASS |
| II | WYSIWYG Without Lock-in | TipTap toolbar + keyboard shortcuts map every action deterministically to standard Markdown; a toggleable raw Markdown source view is provided; non-portable constructs are isolated/reversible. | PASS |
| III | Privacy & Data Protection by Design (NON-NEGOTIABLE) | Local-first storage via Rust core; no document content leaves the device without explicit per-action consent (Graph export gated behind MSAL sign-in + consent); telemetry opt-in/anonymized/disableable; consent, data export, and deletion controls specified. | PASS |
| IV | Accessibility First | WCAG 2.2 AA / EN 301 549 / Section 508 targeted for all primary flows; full keyboard operability, screen-reader semantics, contrast, and OS settings respected; axe-core automated + keyboard-only manual checks gate releases. | PASS |
| V | Security & Supply-Chain Integrity | Tauri signed MSI/NSIS installers and signed updater over integrity-verified channel; `rehype-sanitize` strips untrusted HTML and blocks remote-content fetch without consent; SBOM (CycloneDX) generated for Rust + npm; dependency scanning + coordinated disclosure documented. | PASS |
| VI | Regulatory Compliance Gate (NON-NEGOTIABLE) | Plan produces artifacts that compliance agents audit a posteriori; findings flow to `compliance/backlog/`; no release with open `CRITICAL`. The plan reserves traceability hooks (requirement → artifact) for audits. | PASS |
| VII | Quality & Test-First Discipline | Core behaviors (round-trip, export fidelity, accessibility, privacy) covered by automated tests before "done"; bugs reproduced with failing tests; success criteria are measurable and technology-agnostic. | PASS |

**Initial gate result**: PASS — no violations. No entries required in Complexity
Tracking.

**Post-Design re-check (after Phase 1)**: PASS — the data model, contracts, and
quickstart introduce no proprietary persistence, no unconsented network calls, and
no accessibility/security regressions. Decisions in `research.md` keep remark as the
single source of truth and confine all network access to the consented export path.

## Project Structure

### Documentation (this feature)

```text
specs/001-markdit-core/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── README.md
│   ├── tauri-commands.md
│   ├── markdown-engine.md
│   ├── export-targets.md
│   └── settings-consent.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created here)
```

### Source Code (repository root)

```text
src-tauri/                       # Rust core (Tauri 2)
├── Cargo.toml
├── tauri.conf.json              # Bundle (MSI/NSIS), signing, updater config
├── build.rs
└── src/
    ├── main.rs                  # App entry, plugin/command registration
    ├── commands/                # IPC commands exposed to the frontend
    │   ├── document.rs          # open/save/watch .md files
    │   ├── settings.rs          # consent/telemetry/privacy config persistence
    │   └── export.rs            # offline .docx write to disk
    ├── fs_watch.rs              # external-change detection (save-conflict prompt)
    └── tests/                   # cargo unit/integration tests

src/                             # Frontend (TypeScript + React + Vite)
├── main.tsx
├── app/
│   ├── App.tsx
│   └── routes/
├── components/
│   ├── editor/                  # TipTap editor surface + nodes/marks
│   ├── toolbar/                 # formatting toolbar (a11y-first)
│   ├── source-view/             # toggleable raw Markdown view
│   └── dialogs/                 # consent, export, conflict prompts
├── markdown/                    # remark/rehype pipeline (single source of truth)
│   ├── parse.ts                 # md -> ProseMirror/HTML
│   ├── serialize.ts             # ProseMirror -> md (lossless)
│   ├── sanitize.ts              # rehype-sanitize schema
│   └── highlight.ts             # Shiki/highlight.js integration
├── export/
│   ├── docx.ts                  # offline Word export
│   └── graph/                   # OneNote + Loop via MSAL + Microsoft Graph
│       ├── auth.ts              # MSAL sign-in/consent
│       ├── onenote.ts
│       └── loop.ts
├── privacy/
│   ├── consent.ts               # consent state machine
│   └── telemetry.ts             # opt-in, anonymized, disableable
└── lib/                         # shared utilities, types

tests/
├── unit/                        # Vitest + RTL
├── e2e/                         # Playwright (packaged-app flows)
├── a11y/                        # axe-core scans (WCAG 2.2 AA)
└── corpus/                      # golden-file Markdown round-trip fixtures
    ├── input/                   # source .md files (CommonMark + GFM)
    └── expected/                # expected serialized output
```

**Structure Decision**: Desktop-app layout with a clear split between the Rust
Tauri core (`src-tauri/`, owning file I/O, packaging, signing, updates, and the
only place allowed to touch the OS) and the web frontend (`src/`, owning
rendering, visual editing, and the consented export paths). The `src/markdown/`
module is the single Markdown source-of-truth boundary; all visual edits flow
through it for serialization, ensuring lossless round-trip. Tests are grouped by
discipline (`unit`, `e2e`, `a11y`, `corpus`) to map directly onto the
constitution's quality gates.

## Complexity Tracking

> No constitution violations identified. This section intentionally left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _(none)_  | —          | —                                   |
