# Markdit

Markdit is a Windows-first **WYSIWYG Markdown editor** that lets you read, edit,
and export Markdown documents without writing Markdown syntax by hand.

## Planned capabilities

1. **Read Markdown like on Git** — open `.md` files and see them rendered with
   GitHub-Flavored Markdown fidelity (tables, task lists, fenced code, etc.).
2. **Visual editing without Markdown** — formatting toolbar, fonts, and styles;
   the underlying file stays clean, portable Markdown.
3. **Installable on Windows** — signed installer with clean updates/uninstall.
4. **Export** — to Microsoft Word (`.docx`), OneNote, and Loop.

## Regulatory compliance

Markdit targets EU and North American markets and is held to GDPR, the European
Accessibility Act / EN 301 549, the Cyber Resilience Act, CCPA/CPRA, ADA /
Section 508, PIPEDA, and related requirements. Dedicated compliance agents audit
the project **a posteriori** and maintain a remediation backlog. See
[compliance/backlog/README.md](compliance/backlog/README.md).

## Development with Spec Kit

This project uses [GitHub Spec Kit](https://github.com/github/spec-kit) for
Spec-Driven Development. Use the slash commands in GitHub Copilot Chat:

| Command | Purpose |
| --- | --- |
| `/speckit.constitution` | Project governing principles (`.specify/memory/constitution.md`) |
| `/speckit.specify` | Define what to build |
| `/speckit.clarify` | De-risk ambiguous requirements |
| `/speckit.plan` | Technical implementation plan |
| `/speckit.tasks` | Generate actionable tasks |
| `/speckit.analyze` | Cross-artifact consistency check |
| `/speckit.implement` | Execute the plan |
| `/markdit.compliance.eu` | EU regulatory audit → compliance backlog |
| `/markdit.compliance.na` | North American regulatory audit → compliance backlog |
| `/markdit.compliance.audit` | Run both audits, consolidate, and give a release verdict |

### Key artifacts

- Constitution: [.specify/memory/constitution.md](.specify/memory/constitution.md)
- Core feature spec: [specs/001-markdit-core/spec.md](specs/001-markdit-core/spec.md)
- Compliance agents: [.github/agents/](.github/agents)

## Architecture

Markdit is a Tauri 2 desktop app. The **Markdown engine is the single source of
truth** and lives entirely in the TypeScript frontend; the Rust core handles only
local file I/O, settings persistence, signed updates, and file watching.

- **Rust core** (`src-tauri/`): file open/save with content-hash conflict
  detection, privacy-first settings store, offline `.docx` write, updater.
- **Frontend** (`src/`):
  - `markdown/` — `unified` + `remark` (CommonMark + GFM) parse/serialize,
    `rehype-sanitize` rendering, Shiki highlighting, and the TipTap ⇄ mdast
    bridge. This is the constitutional heart and is covered by the round-trip
    corpus and unit tests.
  - `components/` — reader, TipTap WYSIWYG editor, accessible toolbar, source view.
  - `export/` — offline Word (`docx`) and consented OneNote/Loop via Microsoft
    Graph + MSAL.
  - `privacy/` — consent state machine, opt-in telemetry, data-subject rights.

## Development

Prerequisites: Node 20+ and (for the desktop build) the Rust toolchain + Tauri
prerequisites.

```powershell
npm install            # install frontend dependencies
npm run test           # Vitest unit + golden-file round-trip corpus
npm run lint           # ESLint
npm run dev            # Vite dev server (web surface)
npm run tauri dev      # full desktop app (requires Rust/Tauri toolchain)
npm run build          # production frontend build
npm run sbom           # generate a CycloneDX SBOM (sbom/markdit-sbom.json)
```

End-to-end and accessibility suites use Playwright + axe-core
(`npm run test:e2e`, `npm run test:a11y`).

To refresh the golden round-trip corpus after an intentional engine change:

```powershell
node scripts/generate-corpus.mjs
```

## Privacy & accessibility

Markdit is **local-first**. On first run telemetry is off, remote content is
blocked, and no cloud consents exist. Nothing leaves the device without an
explicit, recorded consent. The UI targets **WCAG 2.2 AA** (keyboard-navigable,
visible focus, high-contrast theme). See [SECURITY.md](SECURITY.md) for the
security model, signing, SBOM, and vulnerability disclosure process.

