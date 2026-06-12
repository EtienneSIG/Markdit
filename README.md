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
