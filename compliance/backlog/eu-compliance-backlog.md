# EU Compliance Backlog

**Audit scope**: Full project — planning-stage artifacts (`specs/001-markdit-core/`
spec.md, plan.md, tasks.md, research.md, data-model.md, contracts/) and
`.specify/memory/constitution.md`. **No implementation source code exists yet**;
findings are framed as obligations that implementation tasks MUST satisfy, with
`NEEDS EVIDENCE` where running code/build artifacts are required to verify.

**Last run**: 2026-06-12

**Auditor agent**: markdit.compliance.eu

## Summary

| Severity | Open | Resolved |
| --- | --- | --- |
| CRITICAL | 0 | 0 |
| HIGH | 4 | 0 |
| MEDIUM | 6 | 0 |
| LOW | 2 | 0 |

**Release verdict**: READY — blocking IDs: none (no open `CRITICAL`).
*Caveat: this is a planning-stage clearance of the compliance gate only. The 4
`HIGH` items are pre-release obligations that MUST be satisfied (and evidenced)
before an actual release.*

## Findings

### EU-001 — Transparency / privacy notice for telemetry & personal data

- **Status**: NON-COMPLIANT
- **Severity**: HIGH
- **Regulation**: GDPR Art. 13–14 (information to be provided to data subjects)
- **Theme**: Privacy
- **Affected artifact**: [spec.md FR-014](../../specs/001-markdit-core/spec.md), [contracts/settings-consent.md](../../specs/001-markdit-core/contracts/settings-consent.md), [tasks.md T067](../../specs/001-markdit-core/tasks.md)
- **Finding**: Telemetry is correctly opt-in/anonymized/disableable and consent
  controls are designed, but no artifact specifies a privacy notice describing the
  controller identity, the categories of data processed (telemetry fields,
  MSAL account identity for cloud export), purposes, legal basis, retention, and
  data-subject rights. Art. 13 information must be presented at/ before the point
  of collection — including before opt-in telemetry is enabled.
- **Proposed remediation**: Add a task to author an in-app, accessible privacy
  notice (and ship it with the disclosure shown at telemetry opt-in and at cloud
  sign-in). Reference it from FR-014 and the consent dialog.
- **Date**: 2026-06-12

---

### EU-002 — Local-first lawful basis & data minimization

- **Status**: PARTIAL
- **Severity**: LOW
- **Regulation**: GDPR Art. 5(1)(b–c) (purpose limitation, data minimization); Art. 25 (by design & by default)
- **Theme**: Privacy
- **Affected artifact**: [spec.md FR-011](../../specs/001-markdit-core/spec.md), [data-model.md §4](../../specs/001-markdit-core/data-model.md), [contracts/settings-consent.md](../../specs/001-markdit-core/contracts/settings-consent.md)
- **Finding**: The design is strong: local-first by default, telemetry off,
  remote content off, no cloud consents on first run (Invariant 1). This satisfies
  data-protection-by-default *in design*. Verification requires the first-run E2E
  (T069) and telemetry-off network assertion (T070) to pass.
- **Proposed remediation**: Keep as-is; close to COMPLIANT once T069/T070 pass and
  produce CI evidence. Mark RESOLVED when test artifacts exist.
- **Date**: 2026-06-12

---

### EU-003 — Data-subject rights (access, portability, erasure)

- **Status**: PARTIAL
- **Severity**: MEDIUM
- **Regulation**: GDPR Art. 15 (access), Art. 17 (erasure), Art. 20 (portability)
- **Theme**: Privacy
- **Affected artifact**: [spec.md FR-012](../../specs/001-markdit-core/spec.md), [contracts/settings-consent.md](../../specs/001-markdit-core/contracts/settings-consent.md), [tasks.md T068](../../specs/001-markdit-core/tasks.md)
- **Finding**: `exportPersonalData()` and `deletePersonalData()` are specified and
  scoped to settings/consent log (not document content), which is appropriate.
  Evidence pending: the export must be in a portable, machine-readable format
  (Art. 20) and deletion must clear the MSAL token cache (Invariant 4). No tests
  yet confirm completeness or format.
- **Proposed remediation**: Specify the export format (e.g., JSON) and add a test
  asserting `exportPersonalData` content and that `deletePersonalData` empties
  settings + token cache. Provide CI evidence to close.
- **Date**: 2026-06-12

---

### EU-004 — International transfer disclosure for cloud export (OneNote/Loop)

- **Status**: NEEDS EVIDENCE
- **Severity**: MEDIUM
- **Regulation**: GDPR Chapter V, Art. 44–49 (transfers to third countries); Art. 13(1)(f)
- **Theme**: Telemetry/Consent
- **Affected artifact**: [contracts/export-targets.md](../../specs/001-markdit-core/contracts/export-targets.md), [spec.md FR-010/FR-011](../../specs/001-markdit-core/spec.md), [tasks.md T064](../../specs/001-markdit-core/tasks.md)
- **Finding**: Cloud export transmits document content to Microsoft 365 / Microsoft
  Graph, which may process data outside the EEA. Consent is correctly gated, but
  the consent/export dialog is not specified to inform the user that content
  leaves the device *and the EEA* and is processed by Microsoft as a third party.
- **Proposed remediation**: Require the export consent dialog (T064) to disclose
  the destination service, that content leaves the device/EEA, and the third-party
  processor. Add an assertion to the consent-gate test.
- **Date**: 2026-06-12

---

### EU-005 — Telemetry consent (ePrivacy) & substantiation of "anonymized"

- **Status**: NEEDS EVIDENCE
- **Severity**: MEDIUM
- **Regulation**: ePrivacy Directive 2002/58/EC Art. 5(3) (storing/accessing info on terminal equipment); GDPR Recital 26 (anonymization)
- **Theme**: Telemetry/Consent
- **Affected artifact**: [spec.md FR-014](../../specs/001-markdit-core/spec.md), [research.md §13](../../specs/001-markdit-core/research.md), [tasks.md T067/T070](../../specs/001-markdit-core/tasks.md)
- **Finding**: Opt-in telemetry satisfies Art. 5(3) "consent for non-strictly-
  necessary storage/access" *by design*. The "anonymized" claim is not yet
  substantiated: no documented telemetry schema proves the absence of identifiers
  (device IDs, IPs, file paths). If only pseudonymized, GDPR still applies.
- **Proposed remediation**: Document the exact telemetry event schema and a
  no-PII assertion; if truly anonymized, record the basis; otherwise treat as
  personal data under the privacy notice (EU-001). Evidence via T070 + schema doc.
- **Date**: 2026-06-12

---

### EU-006 — Accessibility conformance (WCAG 2.2 AA / EN 301 549) evidence

- **Status**: NEEDS EVIDENCE
- **Severity**: HIGH
- **Regulation**: European Accessibility Act (Directive (EU) 2019/882); EN 301 549 (mapping to WCAG 2.2 AA)
- **Theme**: Accessibility
- **Affected artifact**: [spec.md FR-013/SC-007](../../specs/001-markdit-core/spec.md), [tasks.md T021/T030/T035/T065/T073](../../specs/001-markdit-core/tasks.md)
- **Finding**: Accessibility is designed-in (keyboard operability, screen-reader
  semantics, contrast, OS high-contrast/reduced-motion) with axe-core + keyboard
  manual audits planned. Conformance is unverifiable until the editor, toolbar,
  source view, and dialogs exist and pass T073. Per the constitution, an
  inaccessible primary flow is a release blocker (would escalate to CRITICAL once
  evidence shows a failure).
- **Proposed remediation**: Execute T073 (full WCAG 2.2 AA audit) and retain
  axe-core + keyboard-only results as release evidence; re-audit when code exists.
- **Date**: 2026-06-12

---

### EU-007 — Accessibility statement

- **Status**: NON-COMPLIANT
- **Severity**: MEDIUM
- **Regulation**: European Accessibility Act (Directive (EU) 2019/882); EN 301 549 conformance reporting
- **Theme**: Documentation/Conformity
- **Affected artifact**: [tasks.md (Phase 7)](../../specs/001-markdit-core/tasks.md), [README.md](../../README.md)
- **Finding**: No artifact plans an accessibility statement describing conformance
  level, known limitations, and a feedback/contact mechanism, expected for consumer
  software under the EAA.
- **Proposed remediation**: Add a task to publish an accessibility statement
  (conformance claim, known gaps, feedback channel) alongside the docs in T078.
- **Date**: 2026-06-12

---

### EU-008 — CRA: SBOM, vulnerability handling, coordinated disclosure, signed updates

- **Status**: PARTIAL
- **Severity**: HIGH
- **Regulation**: Cyber Resilience Act (Regulation (EU) 2024/2847) Annex I Part II (vulnerability handling) & Part I (security properties)
- **Theme**: Security/CRA
- **Affected artifact**: [spec.md FR-008/FR-015](../../specs/001-markdit-core/spec.md), [tasks.md T049/T050/T051/T071/T072](../../specs/001-markdit-core/tasks.md), [research.md §10/§14](../../specs/001-markdit-core/research.md)
- **Finding**: Strong design coverage: CycloneDX SBOM (T071), CI vuln scanning +
  coordinated disclosure & patch window in `SECURITY.md` (T072), signed installers
  and fail-closed signature-verified updates (T049–T051). Evidence pending: actual
  SBOM artifact, scan results, signed builds, and a published `SECURITY.md`.
- **Proposed remediation**: Produce and retain the SBOM, CI scan reports, signed
  build artifacts, and `SECURITY.md` as release evidence; close per artifact.
- **Date**: 2026-06-12

---

### EU-009 — CRA conformity: CE marking, EU Declaration of Conformity, technical documentation, support period

- **Status**: NON-COMPLIANT
- **Severity**: HIGH
- **Regulation**: Cyber Resilience Act (Regulation (EU) 2024/2847) Art. 13 (technical documentation), Art. 28 (EU Declaration of Conformity), Art. 30 (CE marking), support-period declaration
- **Theme**: Documentation/Conformity
- **Affected artifact**: project-wide (no artifact addresses conformity assessment); [plan.md Constitution Check](../../specs/001-markdit-core/plan.md)
- **Finding**: No artifact plans the CRA conformity deliverables: an EU Declaration
  of Conformity, CE marking, the required technical documentation, and a publicly
  declared support/security-update period for the product with digital elements.
  The constitution lists CE obligations in scope but no task produces them.
- **Proposed remediation**: Add tasks to assemble CRA technical documentation,
  draft the EU Declaration of Conformity, apply CE marking, and publish the
  support period. Track timelines against CRA application dates.
- **Date**: 2026-06-12

---

### EU-010 — CRA security risk assessment / threat model

- **Status**: NEEDS EVIDENCE
- **Severity**: MEDIUM
- **Regulation**: Cyber Resilience Act (Regulation (EU) 2024/2847) Annex I Part I (1) — risk-based security
- **Theme**: Security/CRA
- **Affected artifact**: [research.md §5/§7](../../specs/001-markdit-core/research.md), [plan.md](../../specs/001-markdit-core/plan.md)
- **Finding**: Sanitization, CSP, and the Rust OS boundary are sound mitigations,
  but no documented security risk assessment / threat model justifies that the
  security properties are appropriate to the risks (CRA requires risk-based design).
- **Proposed remediation**: Add a lightweight threat-model document (assets, trust
  boundaries: untrusted Markdown/HTML, Graph network path, updater) mapping to the
  implemented mitigations.
- **Date**: 2026-06-12

---

### EU-011 — Personal-data breach handling process

- **Status**: NON-COMPLIANT
- **Severity**: MEDIUM
- **Regulation**: GDPR Art. 33–34 (breach notification)
- **Theme**: Privacy/Security
- **Affected artifact**: [tasks.md T072](../../specs/001-markdit-core/tasks.md), [spec.md FR-015](../../specs/001-markdit-core/spec.md)
- **Finding**: A coordinated *vulnerability* disclosure process is planned
  (`SECURITY.md`, T072), but no *personal-data breach* notification process is
  documented. Although data processed is minimal (telemetry + MSAL account), a
  process is still required where personal data is involved.
- **Proposed remediation**: Document a brief breach-response procedure (detection,
  assessment, 72-hour supervisory-authority notification path, data-subject
  notification criteria) in `SECURITY.md` or a privacy policy.
- **Date**: 2026-06-12

---

### EU-012 — Records of processing activities

- **Status**: NEEDS EVIDENCE
- **Severity**: LOW
- **Regulation**: GDPR Art. 30 (records of processing)
- **Theme**: Privacy/Documentation
- **Affected artifact**: project-wide
- **Finding**: No record of processing activities exists for the (minimal)
  telemetry and cloud-account processing. May be reduced for small organizations
  but should be documented given recurring/structured processing.
- **Proposed remediation**: Maintain a short record-of-processing entry covering
  telemetry and MSAL account data (purpose, categories, recipients/transfers,
  retention).
- **Date**: 2026-06-12

---
