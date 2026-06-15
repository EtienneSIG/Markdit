# Feature Specification: Markdit Core Editor

**Feature Branch**: `001-markdit-core`

**Created**: 2026-06-12

**Status**: Clarified

**Input**: User description: "Éditeur de Markdown : (1) lire les fichiers
markdown comme sur Git, (2) édition visuelle sans écrire de markdown (barre de
style, police…), (3) installable sur Windows, (4) export vers différents formats
(Word, OneNote, Loop…). Conformité aux réglementations européennes et
nord-américaines, vérifiée a posteriori par des agents dédiés qui créent des
backlogs."

## Clarifications

### Session 2026-06-12

- Q: Minimum supported Windows versions? → A: Windows 10 (x64, 22H2+) and
  Windows 11 (x64 and ARM64).
- Q: Markdown baseline? → A: CommonMark + GitHub Flavored Markdown.
- Q: Primary offline export target vs. cloud targets? → A: Word `.docx` works
  fully offline; OneNote and Loop require Microsoft 365 sign-in and consent.
- Q: Default data handling? → A: Local-first; no document content leaves the
  device without explicit per-action consent; telemetry is opt-in.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read & render Markdown like on Git (Priority: P1)

A user opens an existing `.md` file and sees it rendered with the same visual
fidelity they would expect on a Git hosting platform (headings, lists, tables,
code blocks with syntax highlighting, task lists, links, images, blockquotes).

**Why this priority**: Reading/rendering is the foundational capability and the
minimum viable product — without trustworthy rendering, nothing else matters.

**Independent Test**: Open a representative GitHub-Flavored Markdown file and
confirm all standard elements render correctly and match a reference rendering;
delivers immediate value as a Markdown viewer even before editing exists.

**Acceptance Scenarios**:

1. **Given** a valid `.md` file on disk, **When** the user opens it, **Then** the
   document is displayed as formatted rich content (not raw syntax) within 1
   second for files up to 1 MB.
2. **Given** a Markdown file containing GFM tables, task lists, fenced code, and
   images, **When** it is rendered, **Then** each element appears with correct
   formatting equivalent to a Git platform reference rendering.
3. **Given** a file with embedded raw HTML or external links, **When** it is
   rendered, **Then** content is sanitized and no remote content is loaded
   without user consent.

---

### User Story 2 - Edit visually without writing Markdown (Priority: P2)

A user applies formatting (bold, italic, headings, lists, links, tables, fonts,
text styles) using a visual toolbar and keyboard shortcuts, never needing to
type Markdown syntax. The saved file remains clean, portable Markdown.

**Why this priority**: This is the core differentiator — WYSIWYG editing that
keeps Markdown as the source of truth.

**Independent Test**: Create a new document, apply each toolbar action, save,
and verify the resulting `.md` is valid, standard Markdown that re-renders
identically; delivers value as a no-syntax authoring tool.

**Acceptance Scenarios**:

1. **Given** the editor is open, **When** the user selects text and clicks
   "Bold", **Then** the text appears bold and the saved Markdown uses standard
   emphasis markers.
2. **Given** the user applies a heading, list, link, or table via the toolbar,
   **When** the document is saved, **Then** the output is valid standard Markdown
   with no proprietary markers.
3. **Given** a document edited visually, **When** it is saved and reopened,
   **Then** content round-trips losslessly (no meaningful content change).
4. **Given** the user wants the raw view, **When** they toggle "Markdown source",
   **Then** the underlying Markdown is shown and remains editable.

---

### User Story 3 - Install and run on Windows (Priority: P2)

A Windows user downloads and installs Markdit through a standard, signed Windows
installer and launches it like any native desktop application.

**Why this priority**: Distribution on Windows is an explicit product
requirement; without an installable build the product cannot reach users.

**Independent Test**: Run the signed installer on a clean supported Windows
machine, confirm the app installs, launches, opens a file, and uninstalls
cleanly; delivers a distributable product.

**Acceptance Scenarios**:

1. **Given** a supported Windows version, **When** the user runs the installer,
   **Then** the application installs without administrator errors and creates the
   expected Start menu / desktop entries.
2. **Given** the installer package, **When** its signature is inspected, **Then**
   it is validly code-signed by the publisher.
3. **Given** an installed instance, **When** a newer version is released,
   **Then** the user can update via an authenticated, integrity-verified channel.
4. **Given** an installed instance, **When** the user uninstalls, **Then** the
   application is removed cleanly and user documents are preserved.

---

### User Story 4 - Export to other formats (Word, OneNote, Loop, …) (Priority: P3) — REMOVED / DESCOPED

> **Status (descoped):** This story was implemented and then removed. Cloud and
> Word `.docx` export proved too complex for the target users. The lighter
> **copy-to-clipboard** capability (rich HTML + Markdown, User Story 6) replaces
> it: users paste directly into OneNote, Word or Loop. The slide generator
> (User Story 5) covers presentation reach. The original scenarios below are kept
> for historical context only and are no longer part of the product.

A user exports the current document to an external format — Microsoft Word
(`.docx`), OneNote, and Microsoft Loop — preserving structure and formatting as
faithfully as the target format allows.

**Why this priority**: Export extends reach into existing workflows but depends
on reliable rendering and editing first.

**Independent Test**: Take a document exercising all supported elements, export
to each target, and verify structure/formatting fidelity in the destination
application; delivers interoperability value.

**Acceptance Scenarios**:

1. **Given** a document with headings, lists, tables, code, and links, **When**
   the user exports to Word, **Then** a valid `.docx` opens in Word with
   structure and formatting preserved as faithfully as the format allows.
2. **Given** the same document, **When** the user exports to OneNote and to Loop,
   **Then** the content is created in the target with structure preserved and the
   user is informed of any elements that cannot be represented.
3. **Given** an export that requires authentication to a cloud service, **When**
   the user initiates it, **Then** consent is explicit and credentials/content
   are handled per the privacy principles.

---

### User Story 5 - Generate a slide deck from the document (Priority: P3)

A user turns the current document into a slide deck with a single action. The
output is itself standard Markdown, with slides separated by a `---` break (the
convention understood by Marp, reveal.js and remark.js), so it can be previewed,
copied, or saved without any new proprietary format.

**Why this priority**: Slide generation reuses the existing Markdown engine to
extend reach into presentation workflows; it depends on reliable parsing but is
independent of editing and cloud export.

**Independent Test**: Open a document with several headings, generate slides, and
confirm each top-level section becomes its own slide separated by `---`, with the
result re-rendering as valid Markdown; delivers value as a deck authoring tool.

**Acceptance Scenarios**:

1. **Given** a document with multiple top-level headings, **When** the user
   clicks "Slides", **Then** a Markdown deck is produced where each section
   becomes a slide separated by a `---` break.
2. **Given** a document with no headings, **When** the user generates slides,
   **Then** the whole document is presented as a single slide.
3. **Given** generated slides, **When** the user copies, downloads, or saves
   them, **Then** the output stays on the device and is valid standard Markdown.

---

### User Story 6 - Copy the document to the clipboard (Priority: P2)

A user copies the active document to the system clipboard with one action and
pastes it into another application — OneNote, Word, or Loop — keeping headings,
lists, tables, and emphasis. This replaces the removed export feature with a
lighter, on-device interaction.

**Why this priority**: Copy-to-clipboard is the simple, privacy-preserving path
to interoperability that most users actually need; it reuses the rendering
engine and requires no sign-in, no network, and no proprietary export pipeline.

**Independent Test**: Copy a document with mixed elements, paste into a rich-text
target, and confirm the structure and emphasis are preserved; delivers
interoperability value without any export.

**Acceptance Scenarios**:

1. **Given** a document with headings, lists, tables, and emphasis, **When** the
   user clicks "Copy", **Then** both rich HTML and plain Markdown are placed on
   the clipboard and a paste into a rich-text app preserves the structure.
2. **Given** the copy action, **When** it runs, **Then** no network request is
   made and nothing leaves the device beyond the system clipboard.
3. **Given** a clipboard API that rejects rich content, **When** the user copies,
   **Then** the app falls back to plain Markdown and reports the outcome.

---

### Edge Cases

- What happens when a Markdown file is malformed or uses non-standard extensions?
  → The editor renders best-effort, never crashes, and surfaces a clear notice.
- How does the system handle very large documents (e.g., > 10 MB)? → Performance
  must degrade gracefully with a documented threshold.
- What happens when an export target is unavailable (offline, not signed in, or
  feature not representable)? → The user is informed; no silent data loss.
- How are embedded HTML, scripts, or remote images treated? → Sanitized;
  remote content is not fetched without consent.
- What happens on save conflicts (file changed on disk externally)? → The user is
  prompted; no overwrite without confirmation.
- How are non-Latin scripts, RTL text, and emoji handled in editing and export?
  → The editor MUST handle Unicode (UTF-8) content, including CJK and other
  non-Latin scripts, right-to-left text, and emoji, in both editing and export.
  Markdown is stored as UTF-8 and round-trips losslessly; RTL paragraphs honor
  Unicode bidirectional rendering.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST open and render `.md`/`.markdown` files as formatted
  rich content using CommonMark + GitHub Flavored Markdown.
- **FR-002**: System MUST render standard GFM elements: headings, paragraphs,
  emphasis, lists, task lists, tables, fenced code with syntax highlighting,
  blockquotes, links, images, and horizontal rules.
- **FR-003**: System MUST sanitize untrusted/embedded HTML and MUST NOT fetch
  remote content without explicit user consent.
- **FR-004**: Users MUST be able to apply formatting via a visual toolbar and
  keyboard shortcuts without typing Markdown syntax. Portable actions (bold,
  italic, headings, lists, links, tables, code, blockquotes) MUST map to standard
  Markdown. Non-portable styling (custom fonts, font size, text/highlight color)
  is OPTIONAL, MUST be clearly marked as non-portable and reversible, and MUST
  NOT corrupt the underlying Markdown when omitted on save.
- **FR-005**: System MUST persist documents as plain, standard Markdown text and
  MUST guarantee lossless round-tripping of edited documents.
- **FR-006**: System MUST provide a toggleable raw Markdown source view.
- **FR-007**: System MUST provide a signed Windows installer and a clean
  uninstall path, supporting Windows 10 (x64, 22H2+) and Windows 11 (x64/ARM64).
- **FR-008**: System MUST support application updates over an authenticated,
  integrity-verified channel.
- **FR-009**: ~~System MUST export the active document to Microsoft Word
  (`.docx`).~~ **REMOVED / DESCOPED** — Word export was implemented and then
  removed as too complex for target users; superseded by copy-to-clipboard
  (FR-018) and slide generation (FR-017).
- **FR-010**: ~~System MUST export the active document to OneNote and Microsoft
  Loop, informing the user of any non-representable elements.~~ **REMOVED /
  DESCOPED** — cloud export removed; users paste via copy-to-clipboard (FR-018).
- **FR-011**: System MUST process and store documents locally by default; no
  document content leaves the device without explicit, informed consent.
- **FR-012**: System MUST expose privacy controls (consent management, export of
  personal data, deletion) to satisfy GDPR and CCPA/CPRA data-subject rights.
- **FR-013**: System MUST meet WCAG 2.2 AA, EN 301 549, and Section 508 for all
  primary user flows (full keyboard operability, screen-reader support,
  sufficient contrast).
- **FR-014**: System MUST make telemetry, if present, opt-in, anonymized, and
  disableable, with a clear disclosure.
- **FR-015**: System MUST maintain an SBOM and a documented vulnerability
  handling / update process aligned with the Cyber Resilience Act.
- **FR-016**: Compliance agents MUST be able to audit specs, plan, tasks, and
  implementation a posteriori and emit a tracked compliance backlog.
- **FR-017**: System MUST generate a slide deck from the active document as
  standard Markdown (slides separated by a `---` break), reusing the Markdown
  engine, introducing no proprietary markers, and keeping the result on-device
  (preview, copy, download, or local save).
- **FR-018**: System MUST let the user copy the active document to the system
  clipboard as both rich HTML and plain Markdown, on-device, so it can be pasted
  into external apps (e.g. OneNote, Word, Loop) without any export, sign-in, or
  network access.

### Key Entities *(include if feature involves data)*

- **Document**: A Markdown file the user reads/edits — content, file path,
  encoding, dirty/saved state. Source of truth is plain Markdown text.
- **Formatting Action**: A visual editing command (e.g., bold, heading, table)
  mapped deterministically to a standard Markdown construct.
- **Export Target**: A destination format/service (Word, OneNote, Loop) with its
  capabilities and limitations regarding representable elements.
- **Privacy/Consent Setting**: User-controlled preferences governing telemetry,
  remote content, and cloud export.
- **Compliance Finding**: An audit result referencing a regulation/clause, with
  severity, affected artifact, and proposed remediation — stored in the backlog.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of standard GFM elements in a reference test corpus render
  correctly compared to a Git-platform reference rendering.
- **SC-002**: Files up to 1 MB open and render in under 1 second on the
  reference baseline machine (quad-core x64 CPU, 8 GB RAM, SSD, Windows 11 22H2).
- **SC-003**: 100% of documents edited only through the visual toolbar save as
  valid standard Markdown and round-trip without meaningful content change.
- **SC-004**: A user can format a paragraph (bold, heading, list, link) using
  only the toolbar in under 30 seconds without typing Markdown.
- **SC-005**: The Windows installer is validly code-signed and installs,
  launches, and uninstalls cleanly on all supported Windows versions.
- **SC-006**: ~~Export to Word/OneNote/Loop preserves document structure for at
  least 95% of supported elements, with the remainder explicitly reported.~~
  **REMOVED / DESCOPED** — replaced by SC-011 (copy-to-clipboard).
- **SC-007**: All primary flows pass WCAG 2.2 AA automated and keyboard-only
  manual checks with zero blocking issues.
- **SC-008**: Zero document content leaves the device without recorded explicit
  consent (verified by audit).
- **SC-009**: Each compliance audit produces a backlog where every finding cites
  a specific regulation/clause and a severity, and zero `CRITICAL` items remain
  open at release.
- **SC-010**: 100% of documents converted to slides split on the shallowest
  heading depth into `---`-separated slides and re-render as valid standard
  Markdown with no content loss.
- **SC-011**: Copying the active document places both rich HTML and plain
  Markdown on the system clipboard on-device, with no network request, so a
  paste into OneNote/Word/Loop preserves headings, lists, tables, and emphasis.

## Assumptions

- Target platform for the first release is Windows 10 and Windows 11 (desktop).
- The product is offered to end users in the EU/EEA and North America, making
  GDPR, CCPA/CPRA, accessibility, and Cyber Resilience Act obligations relevant.
- OneNote and Loop export rely on Microsoft 365 services and require user
  authentication and consent; offline export targets Word `.docx` primarily.
- Markdown standard baseline is CommonMark + GitHub Flavored Markdown.
- Document content is the user's personal data domain; the product is local-first.
- Some elements (e.g., advanced Loop components) may not be fully representable;
  graceful, transparent degradation is acceptable.
