# Tasks: Markdit Core Editor

**Input**: Design documents from `/specs/001-markdit-core/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test tasks ARE included. Constitution Principle VII (Quality &
Test-First Discipline) mandates that core behaviors — Markdown round-trip, export
fidelity, accessibility, privacy controls — are covered by automated tests written
**before** implementation. Test-first ordering is enforced within every user story.

**Organization**: Tasks are grouped by user story (from spec.md) so each story can
be implemented, tested, and delivered as an independent increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story the task belongs to (US1, US2, US3, US4)
- Exact file paths are included in every task

## Path Conventions

Desktop app layout (per plan.md):

- **Rust core**: `src-tauri/` (file I/O, packaging, signing, updater, offline `.docx` write)
- **Frontend**: `src/` (React + Vite: editor, toolbar, markdown engine, export, privacy)
- **Tests**: `tests/unit/`, `tests/e2e/`, `tests/a11y/`, `tests/corpus/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create the repository structure per plan.md: `src-tauri/src/commands/`, `src/{app,components,markdown,export,privacy,lib}/`, and `tests/{unit,e2e,a11y,corpus/input,corpus/expected}/`
- [ ] T002 Initialize the Tauri 2 Rust core in `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, `src-tauri/build.rs`, and `src-tauri/src/main.rs` with `tauri`, `tauri-plugin-fs`, `tauri-plugin-dialog`, `tauri-plugin-updater`
- [ ] T003 Initialize the frontend in `package.json` with React 18, Vite 5, TypeScript 5, TipTap 2, `unified`, `remark-parse`, `remark-gfm`, `remark-rehype`, `remark-stringify`, `rehype-sanitize`, `rehype-stringify`, Shiki, `docx`, `@azure/msal-browser`, Microsoft Graph SDK
- [ ] T004 [P] Configure linting/formatting: ESLint + Prettier for `src/` and `rustfmt` + `clippy` for `src-tauri/` (config files at repo root)
- [ ] T005 [P] Configure test runners in `vitest.config.ts`, `playwright.config.ts`, and `@axe-core/playwright`; wire `cargo test` for `src-tauri/src/tests/`
- [ ] T006 [P] Create the CI skeleton in `.github/workflows/ci.yml` running lint, `cargo test`, Vitest, Playwright, axe-core, and the corpus suite

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Define shared TypeScript types (`Document`, `DocumentState`, `FormattingAction`, `ExportTarget`, `ExportResult`, `PrivacySettings`, `ConsentRecord`, `CommandError`) in `src/lib/types.ts` per data-model.md
- [ ] T008 Implement the typed Tauri IPC bridge and `CommandError` mapping in `src/lib/ipc.ts` (errors returned, never thrown opaquely) per contracts/tauri-commands.md
- [ ] T009 Scaffold the Markdown engine module in `src/markdown/{parse,serialize,sanitize,highlight}.ts` wiring the `unified` + `remark` + `rehype` pipeline (stubs + exported signatures) per contracts/markdown-engine.md
- [ ] T010 [P] Scaffold Rust document commands (`document_open`, `document_save`, `document_save_as`, `document_watch`, `document_unwatch`) in `src-tauri/src/commands/document.rs` with content-hash + `CommandError` plumbing
- [ ] T011 [P] Implement the local settings/consent store with default-local profile (telemetry off, remote content off, no consents) in `src-tauri/src/commands/settings.rs` per contracts/settings-consent.md
- [ ] T012 [P] Build the app shell (`src/main.tsx`, `src/app/App.tsx`, base layout/routes) with keyboard-navigable scaffolding
- [ ] T013 [P] Configure PII-free logging and error-handling infrastructure in `src/lib/logging.ts` and `src-tauri/src/lib.rs`
- [ ] T014 [P] Build the golden-file round-trip corpus harness (loader + comparator) in `tests/corpus/runner.ts` reading `tests/corpus/input/` vs `tests/corpus/expected/`
- [ ] T015 [P] Build the axe-core accessibility scan harness in `tests/a11y/axe-setup.ts` for reuse across all primary flows

**Checkpoint**: Foundation ready — user stories can now begin

---

## Phase 3: User Story 1 - Read & render Markdown like on Git (Priority: P1) 🎯 MVP

**Goal**: Open an existing `.md` file and see it rendered with Git-equivalent
fidelity (headings, lists, tables, fenced code with highlighting, task lists,
links, images, blockquotes), sanitized, with no remote content fetched without
consent.

**Independent Test**: Open a representative GFM file and confirm all standard
elements render correctly versus a Git-platform reference rendering; delivers
value as a Markdown viewer before editing exists.

### Tests for User Story 1 (write FIRST, ensure they FAIL) ⚠️

- [ ] T016 [P] [US1] Golden-file render test comparing `renderHtml(parse(md))` to reference fixtures in `tests/corpus/` (SC-001, FR-002)
- [ ] T017 [P] [US1] Sanitization unit tests asserting `<script>`, `onerror=`, and `javascript:` URLs are stripped in `tests/unit/sanitize.test.ts` (FR-003)
- [ ] T018 [P] [US1] Remote-content gate test: no network when `allowRemoteContent:false` in `tests/e2e/remote-content.spec.ts` (FR-003, SC-008)
- [ ] T019 [P] [US1] Performance test: a 1 MB fixture opens and renders in < 1 s in `tests/e2e/performance-open.spec.ts` (SC-002)
- [ ] T020 [P] [US1] Rust contract test: `document_open` round-trips bytes unchanged for the corpus in `src-tauri/src/tests/document_open.rs`
- [ ] T021 [P] [US1] axe-core scan of the reader/render view in `tests/a11y/reader.spec.ts` (WCAG 2.2 AA, FR-013)

### Implementation for User Story 1

- [ ] T022 [US1] Implement `parse()` (CommonMark + `remark-gfm` → mdast) in `src/markdown/parse.ts` (FR-001)
- [ ] T023 [P] [US1] Implement the `rehype-sanitize` schema in `src/markdown/sanitize.ts` (FR-003, Principle V)
- [ ] T024 [P] [US1] Implement fenced-code syntax highlighting (Shiki) in `src/markdown/highlight.ts` (FR-002)
- [ ] T025 [US1] Implement `renderHtml(tree, opts)` with consent-gated remote content in `src/markdown/render.ts` (depends on T022–T024)
- [ ] T026 [US1] Implement the `document_open` Rust command (read `.md`, `contentHash`, `sizeBytes`, fail-soft on missing/malformed) in `src-tauri/src/commands/document.rs`
- [ ] T027 [US1] Build the reader/render React component (rich content, not raw syntax) in `src/components/editor/Reader.tsx`
- [ ] T028 [US1] Add malformed-file best-effort rendering with a clear non-crashing notice in `src/components/dialogs/RenderNotice.tsx` (Edge Case)
- [ ] T029 [US1] Add documented graceful degradation for files > 10 MB in `src/components/editor/Reader.tsx` (Edge Case)
- [ ] T030 [US1] Add reader accessibility semantics (keyboard, screen-reader landmarks/labels, contrast) in `src/components/editor/Reader.tsx` (FR-013)

**Checkpoint**: User Story 1 is fully functional and independently testable (MVP viewer)

---

## Phase 4: User Story 2 - Edit visually without writing Markdown (Priority: P2)

**Goal**: Apply formatting (bold, italic, headings, lists, links, tables, styles)
via a visual toolbar and keyboard shortcuts with no Markdown typed; saved files
remain clean, portable, losslessly round-tripping Markdown; a raw source view is
available.

**Independent Test**: Create a new document, apply each toolbar action, save, and
verify the resulting `.md` is valid standard Markdown that re-renders identically.

### Tests for User Story 2 (write FIRST, ensure they FAIL) ⚠️

- [ ] T031 [P] [US2] Golden-file round-trip test: `serialize(parse(md))` equals expected with `normalize:false` for all corpus fixtures in `tests/corpus/roundtrip.test.ts` (FR-005, SC-003)
- [ ] T032 [P] [US2] Toolbar mapping tests: every `FormattingAction` → its expected standard Markdown construct in `tests/unit/formatting-mapping.test.ts` (FR-004, Principle II)
- [ ] T033 [P] [US2] Rust contract test: `document_save` returns `CONFLICT` when on-disk hash differs in `src-tauri/src/tests/document_save_conflict.rs` (FR-005)
- [ ] T034 [P] [US2] E2E: format a paragraph (bold/heading/list/link) via toolbar only in < 30 s in `tests/e2e/toolbar-format.spec.ts` (SC-004)
- [ ] T035 [P] [US2] axe-core + keyboard-only test of the editor and toolbar in `tests/a11y/editor.spec.ts` (FR-013, SC-007)

### Implementation for User Story 2

- [ ] T036 [US2] Implement deterministic `serialize()` (`remark-stringify`, stable markers) in `src/markdown/serialize.ts` (FR-005, SC-003)
- [ ] T037 [US2] Implement `mdastToProseMirror()` and `proseMirrorToMdast()` in `src/markdown/tiptap-bridge.ts` (engine stays authoritative; depends on T036)
- [ ] T038 [US2] Build the TipTap editor surface with nodes/marks for GFM in `src/components/editor/Editor.tsx`
- [ ] T039 [US2] Build the accessibility-first formatting toolbar wiring `FormattingAction`s in `src/components/toolbar/Toolbar.tsx` (FR-004)
- [ ] T040 [US2] Wire keyboard shortcuts for all formatting actions in `src/components/editor/shortcuts.ts` (FR-004)
- [ ] T041 [US2] Implement the toggleable raw Markdown source view in `src/components/source-view/SourceView.tsx` (FR-006)
- [ ] T042 [US2] Implement the `document_save` and `document_save_as` Rust commands with hash-based conflict detection in `src-tauri/src/commands/document.rs` (FR-005)
- [ ] T043 [US2] Implement external-change detection (`fs_watch`) and the save-conflict prompt in `src-tauri/src/fs_watch.rs` and `src/components/dialogs/ConflictDialog.tsx` (Edge Case)
- [ ] T044 [US2] Isolate and make reversible any non-portable constructs during editing in `src/markdown/tiptap-bridge.ts` (Principle II)

**Checkpoint**: User Stories 1 AND 2 both work independently

---

## Phase 5: User Story 3 - Install and run on Windows (Priority: P2)

**Goal**: A signed Windows installer installs/launches/uninstalls cleanly on
supported Windows versions and supports authenticated, integrity-verified updates.

**Independent Test**: Run the signed installer on a clean supported Windows
machine; confirm install, launch, open a file, update, and clean uninstall while
preserving user documents.

### Tests for User Story 3 (write FIRST, ensure they FAIL) ⚠️

- [ ] T045 [P] [US3] Installer signature verification test in `tests/e2e/installer-signature.spec.ts` (SC-005, FR-007)
- [ ] T046 [P] [US3] Rust test: `updater_install` rejects an unsigned/altered artifact (fail-closed) in `src-tauri/src/tests/updater_signature.rs` (FR-008, Principle V)
- [ ] T047 [US3] Install/launch/open/uninstall E2E flow on Windows 10 & 11 in `tests/e2e/install-lifecycle.spec.ts` (SC-005)

### Implementation for User Story 3

- [ ] T048 [US3] Configure the MSI/NSIS bundle, Start menu and desktop entries in `src-tauri/tauri.conf.json` (FR-007)
- [ ] T049 [US3] Configure code-signing (certificate via CI secrets) for installer artifacts in `src-tauri/tauri.conf.json` and `.github/workflows/release.yml` (FR-007, Principle V)
- [ ] T050 [US3] Configure `tauri-plugin-updater` with a signed, integrity-verified update channel in `src-tauri/tauri.conf.json` (FR-008)
- [ ] T051 [US3] Implement `updater_check` and `updater_install` Rust commands that fail closed on signature mismatch in `src-tauri/src/commands/update.rs` (FR-008)
- [ ] T052 [US3] Ensure clean uninstall that preserves user documents in `src-tauri/tauri.conf.json` bundle config (Acceptance Scenario US3-4)
- [ ] T053 [US3] Configure build targets for Windows 10 x64 (22H2+) and Windows 11 x64/ARM64 in `src-tauri/tauri.conf.json` and CI matrix (FR-007)

**Checkpoint**: A distributable, signed, updatable Windows product

---

## Phase 6: User Story 4 - Export to other formats (Word, OneNote, Loop) (Priority: P3)

**Goal**: Export the active document to Word (`.docx`, offline) and to OneNote and
Loop (cloud, consented), preserving structure and reporting any non-representable
elements; no content leaves the device without explicit consent.

**Independent Test**: Export a full-feature document to each target and verify
structure/formatting fidelity in the destination, with dropped elements reported.

### Tests for User Story 4 (write FIRST, ensure they FAIL) ⚠️

- [ ] T054 [P] [US4] E2E: Word export produces a valid `.docx` with no network access in `tests/e2e/export-word.spec.ts` (FR-009, SC-006)
- [ ] T055 [P] [US4] E2E: cloud export with no consent returns `cancelled` and performs zero requests in `tests/e2e/export-consent-gate.spec.ts` (FR-011, SC-008)
- [ ] T056 [P] [US4] Test: consent + mocked Graph returns `success`/`partial` and populates `droppedElements` in `tests/unit/cloud-export.test.ts` (FR-010, SC-006)
- [ ] T057 [P] [US4] E2E: `export_docx` never opens a network socket in `tests/e2e/export-docx-offline.spec.ts` (FR-009)

### Implementation for User Story 4

- [ ] T058 [US4] Define the `Exporter` interface and `capabilities()` (supported/unsupported elements) in `src/export/exporter.ts` per contracts/export-targets.md
- [ ] T059 [US4] Implement the offline `wordExporter` (`docx` lib) and the `export_docx` Rust write in `src/export/docx.ts` and `src-tauri/src/commands/export.rs` (FR-009)
- [ ] T060 [US4] Implement MSAL sign-in/consent with least-privilege Graph scopes in `src/export/graph/auth.ts` (FR-010, FR-011)
- [ ] T061 [US4] Implement `grantConsent`/`revokeConsent` lifecycle clearing the MSAL token cache in `src/privacy/consent.ts` (FR-011, SC-008)
- [ ] T062 [US4] Implement the `oneNoteExporter` via Microsoft Graph (`Notes.Create`) in `src/export/graph/onenote.ts` (FR-010)
- [ ] T063 [US4] Implement the `loopExporter` via Graph with transparent degradation + `droppedElements` reporting in `src/export/graph/loop.ts` (FR-010)
- [ ] T064 [US4] Build the export dialog reporting `droppedElements` and prompting for consent in `src/components/dialogs/ExportDialog.tsx` (FR-010)
- [ ] T065 [US4] Add accessibility (keyboard, screen-reader) to the export and consent dialogs in `src/components/dialogs/ExportDialog.tsx` (FR-013)

**Checkpoint**: All four user stories are independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Constitution-mandated cross-cutting concerns spanning all stories —
privacy/consent, opt-in telemetry, security/supply-chain, accessibility, and
compliance hand-off

- [ ] T066 [P] Implement the consent state machine governing remote content and cloud export in `src/privacy/consent.ts` (Principle III)
- [ ] T067 [P] Implement opt-in, anonymized, instantly-disableable telemetry with clear disclosure in `src/privacy/telemetry.ts` (FR-014, Principle III)
- [ ] T068 [P] Implement data-subject rights `exportPersonalData()` (excludes document content) and `deletePersonalData()` (clears settings + token cache) in `src/privacy/data-rights.ts` (FR-012)
- [ ] T069 [P] E2E: first-run profile is fully local (telemetry off, remote content off, no consents) in `tests/e2e/first-run-default-local.spec.ts` (SC-008, Invariant)
- [ ] T070 [P] E2E: `telemetryEnabled=false` ⇒ zero telemetry requests in `tests/e2e/telemetry-optin.spec.ts` (FR-014)
- [ ] T071 [P] Generate the CycloneDX SBOM for Rust + npm via an `npm run sbom` script in `package.json` and `scripts/sbom.mjs` (FR-015, Principle V)
- [ ] T072 [P] Add dependency vulnerability scanning to CI and document the coordinated vulnerability disclosure + patch-window process in `SECURITY.md` (FR-015, CRA)
- [ ] T073 Full WCAG 2.2 AA audit (axe-core automated + keyboard-only manual) across all primary flows with results in `tests/a11y/full-audit.spec.ts` (FR-013, SC-007)
- [ ] T074 [P] Implement themes (`system`/`light`/`dark`/`high-contrast`) respecting OS high-contrast and reduced-motion settings in `src/app/theme.ts` (FR-013)
- [ ] T075 [P] Add localization scaffolding honoring the `locale` setting in `src/lib/i18n.ts` (FR-013)
- [ ] T076 Run the quickstart.md validation walkthrough and confirm every success-criterion mapping (SC-001…SC-009)
- [ ] T077 [P] Add requirement → artifact traceability notes and prepare the compliance hand-off in `compliance/backlog/` (FR-016, Principle VI)
- [ ] T078 [P] Update `README.md` and developer docs with build, signing, SBOM, and privacy/accessibility notes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3–6)**: All depend on Foundational completion
  - US1 (P1) is the MVP and should be delivered first
  - US2, US3, US4 can then proceed in parallel (if staffed) or by priority
- **Polish (Phase 7)**: Depends on the targeted user stories being complete

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational. No dependency on other stories.
- **US2 (P2)**: Depends on Foundational; reuses the engine and `document_open`
  from US1 but is independently testable (new doc → edit → save).
- **US3 (P2)**: Depends on Foundational; packaging is largely independent of
  US1/US2 content and independently testable on a clean machine.
- **US4 (P3)**: Depends on Foundational; consumes the engine's mdast output but is
  independently testable per export target.

### Within Each User Story

- Tests are written and MUST FAIL before implementation (test-first)
- Engine/parsing primitives before rendering/serialization
- Rust commands before the UI components that invoke them
- Story complete and validated before moving to the next priority

### Parallel Opportunities

- All Setup tasks marked [P] (T004–T006) can run together
- All Foundational tasks marked [P] (T010–T015) can run together after T007–T009
- Once Foundational completes, US1/US2/US3/US4 can be staffed in parallel
- All `[P]` test tasks within a story can run together before its implementation
- Polish tasks marked [P] are largely independent and can run together

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tests together (they must fail first):
Task: "Golden-file render test in tests/corpus/"
Task: "Sanitization unit tests in tests/unit/sanitize.test.ts"
Task: "Remote-content gate test in tests/e2e/remote-content.spec.ts"
Task: "Performance test (1 MB < 1 s) in tests/e2e/performance-open.spec.ts"
Task: "Rust document_open round-trip test in src-tauri/src/tests/document_open.rs"
Task: "axe-core reader scan in tests/a11y/reader.spec.ts"

# Then launch independent US1 implementation pieces together:
Task: "Implement sanitize.ts in src/markdown/sanitize.ts"
Task: "Implement highlight.ts in src/markdown/highlight.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (read & render)
4. **STOP and VALIDATE**: open GFM fixtures, confirm Git-equivalent rendering
5. Ship/demo as a Markdown viewer

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → validate → demo (MVP viewer)
3. US2 → validate → demo (WYSIWYG editor)
4. US3 → validate → demo (signed Windows installer)
5. US4 → validate → demo (exports)
6. Polish → privacy/telemetry, SBOM, full a11y audit, compliance hand-off

### Parallel Team Strategy

After Foundational completes: Developer A → US1, Developer B → US2,
Developer C → US3, Developer D → US4. Cross-cutting (Phase 7) is shared near the end.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps each task to a user story for traceability
- Verify every test fails before implementing (Principle VII)
- Commit after each task or logical group
- Constitution gates for release: green tests, WCAG 2.2 AA passing, signed
  artifacts, up-to-date SBOM, and zero open `CRITICAL` compliance findings (SC-009)
