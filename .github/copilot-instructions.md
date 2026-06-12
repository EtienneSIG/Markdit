<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan at
`specs/001-markdit-core/plan.md` and its design artifacts in
`specs/001-markdit-core/` (research.md, data-model.md, quickstart.md, contracts/).

Active feature: Markdit Core Editor (`001-markdit-core`).
Stack: Tauri 2 (Rust core) + TypeScript/React/Vite; TipTap (ProseMirror) for
WYSIWYG; remark/rehype (CommonMark + GFM) as the single Markdown source of truth
with rehype-sanitize; Word `.docx` offline export; OneNote/Loop via Microsoft
Graph + MSAL (consented). Local-first, opt-in telemetry, WCAG 2.2 AA, signed
installer/updates, SBOM. Tests: Vitest + RTL, cargo test, Playwright, axe-core,
and a golden-file round-trip corpus.
<!-- SPECKIT END -->
