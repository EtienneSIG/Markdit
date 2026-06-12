# Requirement → Artifact Traceability Matrix

**Feature**: 001-markdit-core | Prepared for the compliance hand-off (FR-016,
Principle VI). This matrix maps every functional requirement, success criterion,
and constitutional principle to the implementing artifact(s) and the test(s)
that verify them. It is the entry point for the compliance agents
(`/markdit.compliance.eu`, `/markdit.compliance.na`, `/markdit.compliance.audit`).

> Status legend: **✅ verified** (automated test passes) · **🧪 spec written**
> (E2E exists; runs in CI / against a packaged build) · **📦 packaged-only**
> (requires a signed installer + provisioned runner).

## Functional requirements

| Req | Summary | Implementing artifact(s) | Verifying test(s) | Status |
|-----|---------|---------------------------|-------------------|--------|
| FR-001 | Open & render `.md`/`.markdown` | `src-tauri/src/commands/document.rs`, `src/components/reader/Reader.tsx` | `src-tauri/src/tests/document_open.rs`, `tests/e2e/performance-open.spec.ts` | ✅ |
| FR-002 | Render standard GFM | `src/markdown/parse.ts`, `src/components/reader/Reader.tsx` | `tests/corpus/`, `tests/unit/formatting-mapping.test.ts` | ✅ |
| FR-003 | Sanitize HTML, no remote fetch w/o consent | `src/markdown/` (rehype-sanitize), `src/privacy/consent.ts` | `tests/unit/sanitize.test.ts`, `tests/e2e/remote-content.spec.ts` | ✅ |
| FR-004 | Visual toolbar + shortcuts → portable Markdown | `src/components/toolbar/Toolbar.tsx`, `src/components/editor/Editor.tsx` | `tests/unit/tiptap-bridge.test.ts`, `tests/e2e/toolbar-format.spec.ts` | ✅/🧪 |
| FR-005 | Persist as plain Markdown, integrity on save | `src-tauri/src/commands/document.rs` | `src-tauri/src/tests/document_save_conflict.rs` | ✅ |
| FR-006 | Toggleable raw source view | `src/app/App.tsx` (Read/Edit), `src/lib/i18n.ts` (`view.source`) | `tests/e2e/toolbar-format.spec.ts` (round-trip) | 🧪 |
| FR-007 | Signed installer + clean uninstall | `src-tauri/tauri.conf.json` (bundle/nsis), `.github/workflows/release.yml` | `tests/e2e/installer-signature.spec.ts`, `tests/e2e/install-lifecycle.spec.ts` | 📦 |
| FR-008 | Authenticated, verified updates; fail closed | `src-tauri/src/commands/update.rs` (`verify_update_artifact`) | `src-tauri/src/tests/updater_signature.rs` | ✅ |
| FR-009 | Offline Word `.docx` export | `src/export/docx.ts`, `src/export/exporter.ts`, `src-tauri/src/commands/export.rs` | `tests/unit/docx-export.test.ts`, `tests/e2e/export-word.spec.ts`, `tests/e2e/export-docx-offline.spec.ts` | ✅/🧪 |
| FR-010 | Export to OneNote/Loop; report dropped elements | `src/export/graph/onenote.ts`, `src/export/graph/loop.ts`, `src/components/dialogs/ExportDialog.tsx` | `tests/unit/cloud-export.test.ts` | ✅ |
| FR-011 | Local by default; consent before content leaves | `src/privacy/consent.ts`, `src/export/exporter.ts` | `tests/unit/cloud-export.test.ts`, `tests/e2e/export-consent-gate.spec.ts` | ✅/🧪 |
| FR-012 | Privacy controls (consent mgmt, export/delete) | `src/privacy/consent.ts`, `src-tauri/src/commands/settings.rs` | `tests/unit/cloud-export.test.ts` | ✅ |
| FR-013 | WCAG 2.2 AA / EN 301 549 / Section 508 | `src/components/**` (roles, labels, focus) | `tests/a11y/reader.spec.ts`, `tests/a11y/editor.spec.ts`, `tests/a11y/full-audit.spec.ts` | 🧪 |
| FR-014 | Telemetry opt-in, anonymized, disableable | `src/privacy/telemetry.ts` | `tests/e2e/telemetry-optin.spec.ts` | 🧪 |
| FR-015 | SBOM + vulnerability process | `package.json` (`npm run sbom`), `.github/workflows/ci.yml` (sbom job) | CI `sbom` job | ✅ |
| FR-016 | Compliance agents can audit artifacts | `compliance/backlog/`, this matrix | `/markdit.compliance.audit` | ✅ |

## Success criteria

| SC | Summary | Validation | Status |
|----|---------|-----------|--------|
| SC-001 | 100% GFM corpus renders like Git | `tests/corpus/`, `tests/unit/formatting-mapping.test.ts` | ✅ |
| SC-002 | 1 MB opens & renders < 1 s | `src-tauri/src/tests/document_open.rs` (round-trip), `tests/e2e/performance-open.spec.ts` | ✅/🧪 |
| SC-003 | Lossless toolbar-only round-trip | `tests/corpus/`, `tests/unit/tiptap-bridge.test.ts` | ✅ |
| SC-004 | Format a paragraph via toolbar < 30 s | `tests/e2e/toolbar-format.spec.ts` | 🧪 |
| SC-005 | Validly signed install/uninstall (Win 10/11) | `tests/e2e/installer-signature.spec.ts`, `tests/e2e/install-lifecycle.spec.ts`, `.github/workflows/release.yml` | 📦 |
| SC-006 | Export fidelity ≥ 95%; dropped reported | `tests/unit/docx-export.test.ts`, `tests/unit/cloud-export.test.ts`, `tests/e2e/export-word.spec.ts` | ✅/🧪 |
| SC-007 | All primary flows WCAG 2.2 AA | `tests/a11y/*.spec.ts` | 🧪 |
| SC-008 | Zero content leaves w/o recorded consent | `tests/e2e/remote-content.spec.ts`, `tests/e2e/export-consent-gate.spec.ts`, `tests/e2e/first-run-default-local.spec.ts`, `tests/unit/cloud-export.test.ts` | ✅/🧪 |
| SC-009 | No open CRITICAL compliance findings | `compliance/backlog/consolidated-backlog.md` | pending audit |

## Constitutional principles

| Principle | Summary | Primary evidence |
|-----------|---------|------------------|
| I — Markdown is the source of truth | No proprietary format; bytes written verbatim | `src-tauri/src/commands/document.rs`, `src/markdown/serialize.ts` |
| II — Standard CommonMark/GFM | remark/rehype engine; portable toolbar mappings | `src/markdown/`, `src/components/toolbar/actions.ts` |
| III — Privacy by default | Local-first, opt-in telemetry, consent gates | `src/privacy/`, `tests/e2e/first-run-default-local.spec.ts` |
| IV — Accessibility first | WCAG 2.2 AA across flows | `tests/a11y/`, component roles/labels |
| V — Supply-chain integrity | Signed installers/updates, fail-closed verify, SBOM | `update.rs`, `release.yml`, CI `sbom` |
| VI — Regulatory compliance gate | A-posteriori audit, CRITICAL blocks release | `compliance/backlog/` |

## Hand-off notes

- **Verified now**: Rust contract tests (open/save/updater) and the Vitest unit
  suites (sanitize, docx export, cloud-export consent gate, tiptap bridge,
  formatting) run green locally and in CI.
- **Spec-written E2E** (`🧪`): Playwright specs exist for performance, toolbar
  formatting, editor/full a11y, export (word/offline/consent), first-run-local,
  and telemetry-off. They run in the CI `e2e` job against the Vite harness.
- **Packaged-only** (`📦`): installer signature (T045) and install lifecycle
  (T047) require a signed `.msi`/`.exe` and a provisioned Windows 10/11 runner;
  they are gated behind `MARKDIT_INSTALLER` and executed by the release workflow.
- **Open compliance work**: run the three compliance agents to populate the
  EU/NA/consolidated backlogs; release is blocked while any CRITICAL is open.
