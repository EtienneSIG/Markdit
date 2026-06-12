# Consolidated Compliance Backlog

**Audit scope**: Full project — planning-stage a posteriori audit of
`specs/001-markdit-core/` (spec.md, plan.md, tasks.md, research.md, data-model.md,
contracts/) and `.specify/memory/constitution.md`. Merges the EU
([eu-compliance-backlog.md](./eu-compliance-backlog.md)) and North American
([na-compliance-backlog.md](./na-compliance-backlog.md)) audits, deduplicating
overlapping findings while preserving all referenced regulations.

**No implementation source code exists yet.** Findings are obligations that
implementation tasks MUST satisfy; `NEEDS EVIDENCE` marks items that require
running code, tests, or build artifacts to verify.

**Last run**: 2026-06-12

**Auditor agent**: markdit.compliance.audit

## Summary

| Severity | Open | Resolved |
| --- | --- | --- |
| CRITICAL | 0 | 0 |
| HIGH | 5 | 0 |
| MEDIUM | 6 | 0 |
| LOW | 2 | 0 |

**Release verdict**: **READY** — blocking IDs: **none** (zero open `CRITICAL`).

> **Scope of the verdict.** Per Constitution Principle VI, the release gate is
> triggered only by an open `CRITICAL` finding; there are none, so the gate is not
> tripped. This is a **planning-stage clearance**, not a final release sign-off:
> the product has no implementation yet, and **all 5 `HIGH` findings are pre-release
> obligations** that must be satisfied and evidenced. Several findings are
> `NEEDS EVIDENCE` and MUST be re-audited once code, tests, SBOM, and signed build
> artifacts exist — any accessibility primary-flow failure or unconsented data
> egress discovered then would escalate to `CRITICAL` and BLOCK release.

### Source-finding map (dedup traceability)

| Consolidated | EU | NA |
| --- | --- | --- |
| CMP-001 Accessibility conformance evidence | EU-006 | NA-005 |
| CMP-002 Accessibility statement / ACR / VPAT | EU-007 | NA-006, NA-010 |
| CMP-003 Privacy notice / notice at collection | EU-001 | NA-001, NA-008 |
| CMP-004 International / out-of-province transfer disclosure | EU-004 | NA-009 (transfer part) |
| CMP-005 Telemetry consent & "anonymized" substantiation; symmetric consent | EU-005 | NA-004 |
| CMP-006 Data-subject / consumer rights (access, deletion, portability, correction) | EU-003 | NA-002 |
| CMP-007 CRA: SBOM, vuln handling, coordinated disclosure, signed updates | EU-008 | — |
| CMP-008 CRA conformity: CE marking, DoC, technical docs, support period | EU-009 | — |
| CMP-009 CRA security risk assessment / threat model | EU-010 | — |
| CMP-010 Personal-data breach handling process | EU-011 | — |
| CMP-011 FTC §5 substantiation of privacy/security claims | — | NA-007 |
| CMP-012 Local-first lawful basis & data minimization (by design) | EU-002 | — |
| CMP-013 Records of processing / responsible person / no-sale statement | EU-012 | NA-003, NA-009 (org part) |

---

## Findings

> Sorted by severity (`CRITICAL` → `HIGH` → `MEDIUM` → `LOW`), grouped by theme.

## HIGH

### CMP-001 — Accessibility conformance (WCAG 2.2 AA) evidence

- **Status**: NEEDS EVIDENCE
- **Severity**: HIGH
- **Regulation**: EN 301 549 & European Accessibility Act (Directive (EU) 2019/882); ADA & Section 508 / Revised 508 Standards → WCAG 2.2 AA
- **Theme**: Accessibility
- **Affected artifact**: [spec.md FR-013/SC-007](../../specs/001-markdit-core/spec.md), [tasks.md T021/T030/T035/T065/T073](../../specs/001-markdit-core/tasks.md)
- **Finding**: Accessibility is well designed-in (keyboard operability,
  screen-reader semantics, contrast, OS high-contrast/reduced-motion) with planned
  axe-core + keyboard-only audits. Conformance is unverifiable until the editor,
  toolbar, source view, and dialogs are implemented and T073 passes. Constitution
  Principle IV makes an inaccessible primary flow a release blocker.
- **Proposed remediation**: Execute the full WCAG 2.2 AA audit (T073), retain
  axe-core + keyboard-only evidence per primary flow, and re-audit once code exists.
- **Date**: 2026-06-12

### CMP-003 — Privacy notice / notice at collection

- **Status**: NON-COMPLIANT
- **Severity**: HIGH
- **Regulation**: GDPR Art. 13–14; CCPA/CPRA §1798.100(b); PIPEDA Sch. 1 (openness); Quebec Law 25 (policy publication)
- **Theme**: Privacy
- **Affected artifact**: [spec.md FR-014](../../specs/001-markdit-core/spec.md), [contracts/settings-consent.md](../../specs/001-markdit-core/contracts/settings-consent.md), [tasks.md T067](../../specs/001-markdit-core/tasks.md)
- **Finding**: Consent controls are designed, but no privacy notice/policy is
  planned describing controller/responsible-party identity, data categories
  (telemetry fields, MSAL account), purposes, legal basis, retention, transfers,
  and how to exercise rights — required before/at collection even for opt-in
  telemetry.
- **Proposed remediation**: Add a task to author an in-app, accessible privacy
  policy and show the relevant disclosure at telemetry opt-in and cloud sign-in.
- **Date**: 2026-06-12

### CMP-007 — CRA: SBOM, vulnerability handling, coordinated disclosure, signed updates

- **Status**: PARTIAL
- **Severity**: HIGH
- **Regulation**: Cyber Resilience Act (Regulation (EU) 2024/2847) Annex I Parts I & II; Art. 13
- **Theme**: Security/CRA
- **Affected artifact**: [spec.md FR-008/FR-015](../../specs/001-markdit-core/spec.md), [tasks.md T049/T050/T051/T071/T072](../../specs/001-markdit-core/tasks.md), [research.md §10/§14](../../specs/001-markdit-core/research.md)
- **Finding**: Strong design coverage — CycloneDX SBOM (T071), CI vulnerability
  scanning + coordinated disclosure & patch window (`SECURITY.md`, T072), signed
  installers and fail-closed signature-verified updates (T049–T051). Evidence
  pending: actual SBOM, scan reports, signed builds, published `SECURITY.md`.
- **Proposed remediation**: Produce and retain the SBOM, CI scan results, signed
  build artifacts, and `SECURITY.md` as release evidence.
- **Date**: 2026-06-12

### CMP-008 — CRA conformity: CE marking, Declaration of Conformity, technical docs, support period

- **Status**: NON-COMPLIANT
- **Severity**: HIGH
- **Regulation**: Cyber Resilience Act (Regulation (EU) 2024/2847) Art. 13, Art. 28 (EU DoC), Art. 30 (CE marking); support-period declaration
- **Theme**: Documentation/Conformity
- **Affected artifact**: project-wide; [plan.md Constitution Check](../../specs/001-markdit-core/plan.md)
- **Finding**: No artifact plans the CRA conformity deliverables — EU Declaration
  of Conformity, CE marking, the required technical documentation, and a publicly
  declared support/security-update period. The constitution lists CE obligations in
  scope but no task produces them.
- **Proposed remediation**: Add tasks to assemble CRA technical documentation,
  draft the EU Declaration of Conformity, apply CE marking, and publish the support
  period; track against CRA application dates.
- **Date**: 2026-06-12

### CMP-011 — FTC §5: substantiation of privacy & security claims

- **Status**: NEEDS EVIDENCE
- **Severity**: HIGH
- **Regulation**: FTC Act §5 (unfair or deceptive acts or practices)
- **Theme**: Privacy/Security
- **Affected artifact**: [spec.md SC-008/FR-011/FR-014](../../specs/001-markdit-core/spec.md), [research.md §13](../../specs/001-markdit-core/research.md), [README.md](../../README.md)
- **Finding**: Public claims ("local-first", "no content leaves without consent",
  "anonymized telemetry", signed/secure updates) must be truthful and substantiated.
  They are backed by intended tests (SC-008, T069/T070) and security measures but
  are not yet substantiated.
- **Proposed remediation**: Keep public claims consistent with verified behavior;
  retain passing SC-008/telemetry tests and a documented telemetry schema as
  substantiation; avoid unqualified "anonymous" claims unless proven (see CMP-005).
- **Date**: 2026-06-12

## MEDIUM

### CMP-002 — Accessibility statement / conformance report (ACR / VPAT)

- **Status**: NON-COMPLIANT
- **Severity**: MEDIUM
- **Regulation**: European Accessibility Act (Directive (EU) 2019/882); Section 508 (ACR/VPAT); Accessible Canada Act / ACR
- **Theme**: Documentation/Conformity
- **Affected artifact**: [tasks.md (Phase 7)](../../specs/001-markdit-core/tasks.md), [README.md](../../README.md)
- **Finding**: No artifact plans an accessibility statement (conformance level,
  known limitations, feedback channel) or a Section 508 ACR/VPAT. ACA organizational
  obligations are likely NOT-APPLICABLE to an independent vendor, but the public
  conformance documentation expectation remains across regions.
- **Proposed remediation**: After T073, publish an accessibility statement and a
  VPAT/ACR; add a feedback/contact mechanism.
- **Date**: 2026-06-12

### CMP-004 — International / out-of-province transfer disclosure for cloud export

- **Status**: NEEDS EVIDENCE
- **Severity**: MEDIUM
- **Regulation**: GDPR Chapter V (Art. 44–49) & Art. 13(1)(f); Quebec Law 25 (communication outside Québec + PIA)
- **Theme**: Telemetry/Consent
- **Affected artifact**: [contracts/export-targets.md](../../specs/001-markdit-core/contracts/export-targets.md), [spec.md FR-010/FR-011](../../specs/001-markdit-core/spec.md), [tasks.md T064](../../specs/001-markdit-core/tasks.md)
- **Finding**: Cloud export sends document content to Microsoft 365 / Graph, which
  may process data outside the EEA/Québec. Consent is gated, but the dialog is not
  specified to disclose that content leaves the device and jurisdiction and is
  processed by Microsoft as a third party; Law 25 also expects a transfer PIA.
- **Proposed remediation**: Require the export consent dialog (T064) to disclose
  destination, egress, and third-party processor; perform a lightweight transfer PIA;
  add an assertion to the consent-gate test.
- **Date**: 2026-06-12

### CMP-005 — Telemetry consent, "anonymized" substantiation & symmetric consent

- **Status**: NEEDS EVIDENCE
- **Severity**: MEDIUM
- **Regulation**: ePrivacy Directive 2002/58/EC Art. 5(3); GDPR Recital 26; CPRA §1798.140(l) (dark patterns); FTC Act §5
- **Theme**: Telemetry/Consent
- **Affected artifact**: [spec.md FR-014](../../specs/001-markdit-core/spec.md), [research.md §13](../../specs/001-markdit-core/research.md), [contracts/settings-consent.md](../../specs/001-markdit-core/contracts/settings-consent.md), [tasks.md T064/T066/T067/T070](../../specs/001-markdit-core/tasks.md)
- **Finding**: Opt-in telemetry satisfies Art. 5(3) by design. Two gaps: (1) the
  "anonymized" claim is unsubstantiated without a documented telemetry schema proving
  no identifiers (else GDPR/CCPA still apply); (2) symmetric consent (decline/withdraw
  as easy as accept; no dark patterns) cannot be verified without the dialogs.
- **Proposed remediation**: Document the telemetry event schema with a no-PII
  assertion (evidence via T070); specify and test symmetric consent UI for opt-in
  and revocation.
- **Date**: 2026-06-12

### CMP-006 — Data-subject / consumer rights (access, deletion, portability, correction)

- **Status**: PARTIAL
- **Severity**: MEDIUM
- **Regulation**: GDPR Art. 15/17/20; CCPA/CPRA §§1798.100/.105/.106; PIPEDA (access & correction)
- **Theme**: Privacy
- **Affected artifact**: [contracts/settings-consent.md](../../specs/001-markdit-core/contracts/settings-consent.md), [spec.md FR-012](../../specs/001-markdit-core/spec.md), [tasks.md T068](../../specs/001-markdit-core/tasks.md)
- **Finding**: `exportPersonalData()` (access/portability) and `deletePersonalData()`
  (erasure) are designed and scoped to settings/consent log; correction is implicit
  via editable settings. Evidence pending: a portable machine-readable export format
  (Art. 20) and confirmation that deletion clears the MSAL token cache.
- **Proposed remediation**: Specify the export format (e.g., JSON); add tests for
  export completeness and full deletion (settings + token cache); document the
  request method in the privacy policy (CMP-003).
- **Date**: 2026-06-12

### CMP-009 — CRA security risk assessment / threat model

- **Status**: NEEDS EVIDENCE
- **Severity**: MEDIUM
- **Regulation**: Cyber Resilience Act (Regulation (EU) 2024/2847) Annex I Part I(1)
- **Theme**: Security/CRA
- **Affected artifact**: [research.md §5/§7](../../specs/001-markdit-core/research.md), [plan.md](../../specs/001-markdit-core/plan.md)
- **Finding**: Sanitization, Tauri CSP, and the Rust OS boundary are sound, but no
  documented risk assessment / threat model justifies that the security properties
  are appropriate to the risks, as CRA's risk-based approach requires.
- **Proposed remediation**: Add a lightweight threat-model document (assets, trust
  boundaries: untrusted Markdown/HTML, Graph network path, updater) mapping risks to
  mitigations.
- **Date**: 2026-06-12

### CMP-010 — Personal-data breach handling process

- **Status**: NON-COMPLIANT
- **Severity**: MEDIUM
- **Regulation**: GDPR Art. 33–34; PIPEDA (breach of security safeguards); Quebec Law 25 (confidentiality-incident register)
- **Theme**: Privacy/Security
- **Affected artifact**: [tasks.md T072](../../specs/001-markdit-core/tasks.md), [spec.md FR-015](../../specs/001-markdit-core/spec.md)
- **Finding**: A coordinated *vulnerability* disclosure process is planned, but no
  *personal-data breach* notification/response process is documented, which several
  regimes require where personal data is processed (telemetry + MSAL account).
- **Proposed remediation**: Document a brief breach-response procedure (detection,
  assessment, regulator notification timelines, data-subject notification criteria,
  incident register) in `SECURITY.md` or the privacy policy.
- **Date**: 2026-06-12

## LOW

### CMP-012 — Local-first lawful basis & data minimization (by design)

- **Status**: PARTIAL
- **Severity**: LOW
- **Regulation**: GDPR Art. 5(1)(b–c), Art. 25 (data protection by design & by default)
- **Theme**: Privacy
- **Affected artifact**: [spec.md FR-011](../../specs/001-markdit-core/spec.md), [data-model.md §4](../../specs/001-markdit-core/data-model.md), [contracts/settings-consent.md](../../specs/001-markdit-core/contracts/settings-consent.md), [tasks.md T069/T070](../../specs/001-markdit-core/tasks.md)
- **Finding**: Local-first defaults (telemetry off, remote content off, no consents
  on first run) satisfy data-protection-by-default *in design*. Verification depends
  on the first-run E2E (T069) and telemetry-off network assertion (T070).
- **Proposed remediation**: Close to COMPLIANT once T069/T070 pass; mark RESOLVED
  when CI evidence exists.
- **Date**: 2026-06-12

### CMP-013 — Records of processing, responsible person & no-sale statement

- **Status**: NEEDS EVIDENCE
- **Severity**: LOW
- **Regulation**: GDPR Art. 30; Quebec Law 25 (person in charge); CCPA/CPRA §1798.120 (no sale/share statement)
- **Theme**: Privacy/Documentation
- **Affected artifact**: project-wide; [spec.md FR-011/FR-014](../../specs/001-markdit-core/spec.md)
- **Finding**: No record of processing exists for telemetry/MSAL account data; no
  designated person responsible for personal-information protection (Law 25); and no
  affirmative "no sale/sharing" statement (CCPA/CPRA), though the local-first design
  means no sale occurs.
- **Proposed remediation**: Maintain a short record-of-processing entry; name a
  responsible contact in the privacy policy; state affirmatively that no sale/sharing
  occurs.
- **Date**: 2026-06-12

---
