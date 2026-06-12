# Phase 0 Research: Markdit Core Editor

**Feature**: 001-markdit-core | **Date**: 2026-06-12

This document consolidates the technology decisions for the Core Editor. The tech
stack was decided up front; the research below records the rationale and the
alternatives rejected, and resolves every item that would otherwise be marked
`NEEDS CLARIFICATION`. **Result: no open `NEEDS CLARIFICATION` items remain.**

---

## 1. Desktop application shell

- **Decision**: Tauri 2 (Rust core) producing signed MSI and NSIS installers.
- **Rationale**: Small binary footprint and low memory vs. a bundled Chromium;
  Rust core gives a strong security boundary for file I/O and OS access; native
  code-signing and an integrity-verified auto-updater satisfy Constitution
  Principle V and the Cyber Resilience Act. Targets Windows 10 x64 (22H2+) and
  Windows 11 x64/ARM64 (uses the OS WebView2 runtime).
- **Alternatives considered**:
  - *Electron*: largest ecosystem, but heavier footprint, larger attack surface,
    and bundles its own Chromium (more CVEs to track for the SBOM/CRA process).
  - *.NET MAUI / WPF*: native Windows, but weaker fit for a React + TipTap web
    editor and more rework to reach the desired WYSIWYG stack.
  - *Flutter desktop*: strong UI, but no first-class ProseMirror/TipTap path and
    immature Markdown tooling.

## 2. Frontend framework & build

- **Decision**: TypeScript + React 18 + Vite 5.
- **Rationale**: TipTap is built for React; Vite gives fast HMR and clean Tauri
  integration; TypeScript improves correctness for the Markdown<->editor mapping.
- **Alternatives considered**: Svelte (smaller, but less mature TipTap binding);
  vanilla ProseMirror (more control, far more boilerplate).

## 3. Visual (WYSIWYG) editor

- **Decision**: TipTap 2 (ProseMirror) with a formatting toolbar and keyboard
  shortcuts; no raw Markdown typing required.
- **Rationale**: ProseMirror's schema-based document model maps cleanly and
  deterministically onto standard Markdown nodes (Constitution Principle II);
  rich extension ecosystem (tables, task lists, code blocks); supports a
  toggleable raw source view.
- **Alternatives considered**: Lexical (Meta) — capable but younger Markdown
  serialization story; Slate — flexible but requires building much of the schema
  and serialization by hand.
- **Open implementation note**: TipTap's bundled Markdown serializer is not used
  as the source of truth; serialization goes through the remark pipeline (see §4)
  to guarantee fidelity. The editor document is converted to a remark/mdast tree
  for output.

## 4. Markdown engine (single source of truth)

- **Decision**: unified ecosystem — `remark-parse` + `remark-gfm` for parsing,
  `remark-rehype` + `rehype-sanitize` + `rehype-stringify` for safe rendering,
  and `remark-stringify` for serialization. CommonMark + GitHub Flavored Markdown.
- **Rationale**: remark/mdast is the de-facto standard for spec-compliant,
  lossless Markdown manipulation and is what GitHub-class renderers build on.
  Keeping a single engine for parse, render, and serialize is the cleanest way to
  guarantee lossless round-trip (Constitution Principle I) and is enforced by the
  golden-file corpus.
- **Round-trip strategy**: maintain a stable mdast representation; visual edits
  mutate an in-memory ProseMirror doc that is mapped back to mdast and serialized
  with deterministic `remark-stringify` options (consistent bullet, emphasis, and
  fence markers). Cosmetic normalization is opt-in only.
- **Alternatives considered**: `markdown-it` (fast renderer but weaker AST
  round-trip story); `marked` (render-focused, not round-trip safe).

## 5. HTML sanitization & remote content

- **Decision**: `rehype-sanitize` with a strict, documented allow-list schema;
  remote images/links are not fetched without explicit consent.
- **Rationale**: Directly satisfies FR-003 and Constitution Principle V
  (injection / remote-content exfiltration prevention). The Tauri Content
  Security Policy further blocks unsanctioned network/script access.
- **Alternatives considered**: DOMPurify (DOM-based; less natural inside the
  unified pipeline).

## 6. Syntax highlighting

- **Decision**: Shiki (preferred) with highlight.js as fallback.
- **Rationale**: Shiki produces accurate, theme-accurate highlighting matching
  Git-platform rendering (SC-001) and works offline with precompiled grammars.
  highlight.js is a lighter fallback if bundle size becomes a concern.
- **Alternatives considered**: Prism (smaller, but less faithful to GitHub themes).

## 7. File I/O & local-first storage

- **Decision**: All reads/writes through the Rust/Tauri core (`tauri-plugin-fs`,
  `tauri-plugin-dialog`); documents stored as plain UTF-8 `.md`/`.markdown`.
  External-change detection prompts on save conflicts.
- **Rationale**: Confines OS access to the audited Rust boundary; satisfies
  local-first privacy (Principle III) and the no-silent-overwrite edge case.
- **Alternatives considered**: Browser File System Access API (not available in
  the WebView context and weaker control than the Rust layer).

## 8. Word (.docx) export — offline

- **Decision**: JS `docx` library, generating the file in-memory and writing to
  disk via the Rust core. No network.
- **Rationale**: Fully offline (FR-009, clarification: Word works offline);
  preserves structure/formatting "as faithfully as the format allows" (SC-006);
  unrepresentable elements reported to the user.
- **Alternatives considered**: Pandoc sidecar (powerful but adds a native binary
  to package, sign, and track in the SBOM); server-side conversion (violates
  local-first).

## 9. OneNote & Loop export — cloud, consented

- **Decision**: Microsoft Graph API via MSAL (`@azure/msal-browser` /
  `@azure/msal-node`) with OAuth2; explicit user sign-in and consent required
  before any content leaves the device.
- **Rationale**: OneNote and Loop are Microsoft 365 services reachable only
  through Graph; MSAL is the supported auth path. Consent gating satisfies
  FR-010, FR-011, and Principle III. Non-representable elements are surfaced.
- **Open items resolved**: Loop has no general document-import API; the plan
  targets Loop components/pages where the Graph surface allows and transparently
  degrades otherwise (spec assumption acknowledged). Least-privilege scopes
  (`Notes.Create`, and the minimal Loop/SharePoint embedded scopes) only.
- **Alternatives considered**: Unofficial endpoints (rejected — unsupported,
  compliance risk).

## 10. Updates

- **Decision**: Tauri updater plugin over an authenticated, integrity-verified
  channel with signature verification of update artifacts.
- **Rationale**: FR-008 and Principle V / CRA update obligations.
- **Alternatives considered**: Custom updater (more code, more risk); MS Store
  only (limits distribution flexibility for the MVP).

## 11. Testing strategy

- **Decision**: Vitest + React Testing Library (frontend), `cargo test` (Rust),
  Playwright (E2E on the packaged app), `@axe-core/playwright` (WCAG 2.2 AA),
  and a golden-file Markdown round-trip corpus under `tests/corpus/`.
- **Rationale**: Maps one-to-one onto the constitution's quality gates and the
  measurable success criteria (SC-001..SC-008). Round-trip corpus is the
  objective gate for Markdown fidelity (Principle I, VII).
- **Alternatives considered**: Jest (heavier than Vitest for a Vite project);
  WebdriverIO (Playwright has better Tauri/WebView2 ergonomics).

## 12. Accessibility approach

- **Decision**: Build to WCAG 2.2 AA / EN 301 549 / Section 508 from the start —
  semantic roles on toolbar/editor, full keyboard operability, visible focus,
  contrast tokens, and respect for OS reduced-motion/high-contrast settings.
- **Rationale**: FR-013, SC-007, Principle IV — accessibility regressions are
  release blockers. axe-core automates a baseline; keyboard-only manual scripts
  cover the rest.

## 13. Telemetry & privacy controls

- **Decision**: Telemetry off by default; opt-in, anonymized, disableable, with
  clear disclosure. Privacy controls (consent management, personal-data export,
  deletion) exposed in settings.
- **Rationale**: FR-011, FR-012, FR-014; Principle III; GDPR/CCPA-CPRA/ePrivacy.
- **Alternatives considered**: Always-on anonymous metrics (rejected — violates
  opt-in requirement).

## 14. Supply-chain / SBOM

- **Decision**: Generate a CycloneDX SBOM covering both Rust (`cargo`) and npm
  dependency trees; run vulnerability scanning in CI; document a coordinated
  vulnerability disclosure process and support/patch window.
- **Rationale**: FR-015, Principle V, EU Cyber Resilience Act.
- **Alternatives considered**: SPDX (also acceptable; CycloneDX chosen for
  tooling breadth across Rust + npm).

---

## Resolved unknowns summary

| Topic | Status |
|-------|--------|
| Windows versions | Resolved (Win10 x64 22H2+, Win11 x64/ARM64) — from spec clarifications |
| Markdown baseline | Resolved (CommonMark + GFM) — from spec clarifications |
| Offline vs cloud export split | Resolved (Word offline; OneNote/Loop via Graph + consent) |
| Data handling default | Resolved (local-first, opt-in telemetry) |
| Round-trip engine | Resolved (remark single source of truth + golden corpus) |
| Loop import surface | Resolved (Graph where available; transparent degradation) |

No `NEEDS CLARIFICATION` markers remain. Ready for Phase 1.
