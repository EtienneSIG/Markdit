# Markdit Constitution

Markdit is a Windows-first WYSIWYG Markdown editor that lets users read, edit,
and export Markdown documents without writing Markdown syntax by hand. This
constitution defines the non-negotiable principles that govern every
specification, plan, task, and implementation in this project.

## Core Principles

### I. Markdown Fidelity & Open Standards

Markdown is the single source of truth. The editor MUST:

- Read and render Markdown using a documented standard (CommonMark, extended
  with GitHub Flavored Markdown for tables, task lists, strikethrough, and
  autolinks). Any deviation MUST be documented.
- Guarantee lossless round-tripping: opening a file and saving it without edits
  MUST NOT alter meaningful content. Cosmetic normalization is only allowed when
  explicitly enabled by the user.
- Never store document content in a proprietary, lock-in format. Native files
  remain plain `.md`/`.markdown` text that any other tool can open.

### II. WYSIWYG Without Lock-in

Users edit visually; the underlying Markdown stays clean and portable.

- Formatting actions (bold, italic, headings, lists, links, tables, fonts,
  styles) MUST be available through a visual toolbar and keyboard shortcuts, with
  no requirement for the user to type Markdown syntax.
- Every visual edit MUST map deterministically to standard Markdown. Features
  that cannot be represented in portable Markdown MUST be clearly isolated and
  reversible.
- A raw Markdown view MUST remain available so power users are never trapped in
  the visual layer.

### III. Privacy & Data Protection by Design (NON-NEGOTIABLE)

Markdit is local-first. User documents belong to the user.

- Documents MUST be processed and stored locally by default. No document content
  may leave the device without explicit, informed, per-feature user consent.
- Data minimization applies: collect the least data necessary. Telemetry, if any,
  MUST be opt-in, anonymized, documented, and disableable.
- Privacy controls (consent, export of personal data, deletion) MUST be
  discoverable and exercisable by the user, satisfying GDPR (EU) and CCPA/CPRA
  (US) data-subject rights.

### IV. Accessibility First

The editor MUST be usable by people with disabilities, by default.

- Target conformance: WCAG 2.2 Level AA, EN 301 549 (EU), and Section 508 (US).
- Full keyboard operability, screen-reader compatibility, sufficient color
  contrast, and respect for OS-level accessibility settings are required, not
  optional.
- Accessibility regressions are release blockers.

### V. Security & Supply-Chain Integrity

Markdit is a desktop product with software-update obligations.

- Installers and updates MUST be code-signed and delivered over authenticated,
  integrity-verified channels.
- Dependencies MUST be tracked (SBOM), scanned for known vulnerabilities, and
  patched. Untrusted document content (e.g., embedded HTML, links) MUST be
  sanitized to prevent injection and remote-content exfiltration.
- A coordinated vulnerability disclosure process and a documented support/patch
  window are required, aligned with EU Cyber Resilience Act expectations.

### VI. Regulatory Compliance Gate (NON-NEGOTIABLE)

Compliance is verified continuously, not assumed.

- Dedicated compliance agents (see `Regulatory & Compliance Scope`) audit the
  specs, plans, tasks, and implementation **a posteriori** against EU and North
  American regulations applicable to this class of product.
- Each audit MUST produce a tracked **compliance backlog** of remediation items
  with severity, the regulation/clause referenced, and a proposed fix.
- No release may ship with an open compliance item classified as `CRITICAL`.

### VII. Quality & Test-First Discipline

- Core behaviors (Markdown round-trip, export fidelity, accessibility, privacy
  controls) MUST be covered by automated tests before being considered done.
- Bugs are reproduced with a failing test before they are fixed.
- Specifications and success criteria MUST be measurable and technology-agnostic.

## Regulatory & Compliance Scope

Markdit is treated as a privacy-sensitive, accessible, distributed desktop
software product. The following frameworks are in scope and are audited by the
compliance agents:

**European Union / EEA**
- GDPR (Regulation (EU) 2016/679) — data protection & data-subject rights.
- European Accessibility Act (Directive (EU) 2019/882) and EN 301 549 —
  accessibility.
- Cyber Resilience Act (Regulation (EU) 2024/2847) — security, SBOM,
  vulnerability handling, and update obligations for products with digital
  elements.
- ePrivacy Directive 2002/58/EC — telemetry/consent where applicable.
- CE marking obligations relevant to software products with digital elements.

**North America**
- United States: CCPA/CPRA (California) and comparable US state privacy laws;
  ADA & Section 508 / Revised 508 Standards (accessibility); FTC Act §5
  (unfair/deceptive practices, security representations).
- Canada: PIPEDA (and Quebec Law 25) — privacy; Accessible Canada Act / ACR —
  accessibility.

This scope is the minimum baseline. Compliance agents MAY flag additional
applicable obligations and MUST justify each finding with a regulation reference.

## Development Workflow & Quality Gates

- All work flows through the Spec-Driven Development lifecycle:
  `/speckit.constitution` → `/speckit.specify` → `/speckit.clarify` →
  `/speckit.plan` → `/speckit.tasks` → `/speckit.analyze` → `/speckit.implement`.
- Before implementation, `/speckit.analyze` MUST confirm there are no unresolved
  conflicts with this constitution.
- After tasks and/or implementation, the compliance agents
  (`/markdit.compliance.eu`, `/markdit.compliance.na`,
  `/markdit.compliance.audit`) run a posteriori and write findings to
  `compliance/backlog/`.
- Quality gates per release: green automated tests, accessibility checks passing,
  signed build artifacts, an up-to-date SBOM, and zero open `CRITICAL`
  compliance items.

## Governance

- This constitution supersedes other practices. When guidance conflicts, the
  constitution wins.
- Amendments require: a written rationale, a version bump per the policy below,
  and an update to dependent artifacts (templates, agents, specs) where affected.
- Versioning of this document follows semantic versioning:
  - **MAJOR**: removal or incompatible redefinition of a principle.
  - **MINOR**: a new principle/section or materially expanded guidance.
  - **PATCH**: clarifications and non-semantic wording fixes.
- Every spec, plan, and PR review MUST verify compliance with these principles;
  unavoidable complexity or deviations MUST be explicitly justified and recorded.

**Version**: 1.0.0 | **Ratified**: 2026-06-12 | **Last Amended**: 2026-06-12
