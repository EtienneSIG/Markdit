# North America Compliance Backlog

**Audit scope**: Full project — planning-stage artifacts (`specs/001-markdit-core/`
spec.md, plan.md, tasks.md, research.md, data-model.md, contracts/) and
`.specify/memory/constitution.md`. **No implementation source code exists yet**;
findings are framed as obligations that implementation tasks MUST satisfy, with
`NEEDS EVIDENCE` where running code/build artifacts are required to verify.

**Last run**: 2026-06-12

**Auditor agent**: markdit.compliance.na

## Summary

| Severity | Open | Resolved |
| --- | --- | --- |
| CRITICAL | 0 | 0 |
| HIGH | 4 | 0 |
| MEDIUM | 4 | 0 |
| LOW | 2 | 0 |

**Release verdict**: READY — blocking IDs: none (no open `CRITICAL`).
*Caveat: planning-stage clearance of the compliance gate only. The 4 `HIGH` items
are pre-release obligations that MUST be satisfied (and evidenced) before release.*

## Findings

### NA-001 — Notice at collection / privacy policy

- **Status**: NON-COMPLIANT
- **Severity**: HIGH
- **Regulation**: CCPA/CPRA (Cal. Civ. Code §1798.100(b) notice at collection); comparable US state privacy laws (e.g., VA CDPA, CO CPA)
- **Theme**: Privacy
- **Affected artifact**: [spec.md FR-014](../../specs/001-markdit-core/spec.md), [contracts/settings-consent.md](../../specs/001-markdit-core/contracts/settings-consent.md), [tasks.md T067](../../specs/001-markdit-core/tasks.md)
- **Finding**: No privacy policy / notice-at-collection is planned. Even with
  opt-in, anonymized telemetry and minimal MSAL account data, US state laws require
  a notice describing categories collected, purposes, and consumer rights, made
  available before/at collection.
- **Proposed remediation**: Author a privacy policy covering telemetry and cloud
  sign-in data, consumer rights, and how to exercise them; surface it at opt-in
  and at first run. (Overlaps EU-001.)
- **Date**: 2026-06-12

---

### NA-002 — Consumer rights (know, delete, correct)

- **Status**: PARTIAL
- **Severity**: MEDIUM
- **Regulation**: CCPA/CPRA §§1798.100, .105, .106 (right to know, delete, correct)
- **Theme**: Privacy
- **Affected artifact**: [contracts/settings-consent.md](../../specs/001-markdit-core/contracts/settings-consent.md), [spec.md FR-012](../../specs/001-markdit-core/spec.md), [tasks.md T068](../../specs/001-markdit-core/tasks.md)
- **Finding**: `exportPersonalData()` (know/access) and `deletePersonalData()`
  (delete) are designed; correction is implicitly covered by editable settings.
  Evidence pending implementation/tests; no documented method for a consumer to
  submit a request is described beyond the in-app controls.
- **Proposed remediation**: Confirm in the privacy policy that in-app controls
  satisfy know/delete/correct, and add tests asserting export content and full
  deletion (incl. token cache).
- **Date**: 2026-06-12

---

### NA-003 — "Do Not Sell or Share" disclosure

- **Status**: NEEDS EVIDENCE
- **Severity**: LOW
- **Regulation**: CCPA/CPRA §1798.120 / §1798.135 (opt-out of sale/sharing)
- **Theme**: Privacy
- **Affected artifact**: [spec.md FR-011/FR-014](../../specs/001-markdit-core/spec.md)
- **Finding**: The product is local-first and does not sell or share personal
  information for cross-context behavioral advertising, so the opt-out mechanism is
  likely not triggered. This should be stated affirmatively to avoid ambiguity.
- **Proposed remediation**: State in the privacy policy that no sale/sharing
  occurs; revisit if any analytics processor relationship changes that conclusion.
- **Date**: 2026-06-12

---

### NA-004 — Symmetric consent / no dark patterns

- **Status**: NEEDS EVIDENCE
- **Severity**: MEDIUM
- **Regulation**: CPRA §1798.140(l) (dark patterns); FTC Act §5 (unfair practices)
- **Theme**: Telemetry/Consent
- **Affected artifact**: [contracts/settings-consent.md](../../specs/001-markdit-core/contracts/settings-consent.md), [tasks.md T064/T065/T066/T067](../../specs/001-markdit-core/tasks.md)
- **Finding**: Opt-in and revocation are designed (`grantConsent`/`revokeConsent`,
  instant telemetry disable). Whether the UI presents opt-out/withdrawal with equal
  ease to opt-in (no dark patterns) cannot be verified without the dialogs.
- **Proposed remediation**: Specify symmetric consent UI (decline as prominent as
  accept; one-step withdrawal) and add a UX/a11y test asserting parity.
- **Date**: 2026-06-12

---

### NA-005 — Accessibility (ADA & Section 508 / Revised 508) evidence

- **Status**: NEEDS EVIDENCE
- **Severity**: HIGH
- **Regulation**: ADA; Section 508 / Revised 508 Standards (36 CFR Part 1194) → WCAG 2.1/2.2 AA
- **Theme**: Accessibility
- **Affected artifact**: [spec.md FR-013/SC-007](../../specs/001-markdit-core/spec.md), [tasks.md T021/T030/T035/T065/T073](../../specs/001-markdit-core/tasks.md)
- **Finding**: Accessibility is designed-in and audited via axe-core + keyboard
  manual checks, but conformance is unverifiable until the UI exists and T073
  passes. An inaccessible primary flow would be a release blocker (escalating to
  CRITICAL once evidence shows a failure). (Overlaps EU-006.)
- **Proposed remediation**: Run T073 and retain results as release evidence;
  re-audit when implementation exists.
- **Date**: 2026-06-12

---

### NA-006 — Section 508 conformance report (ACR/VPAT)

- **Status**: NON-COMPLIANT
- **Severity**: MEDIUM
- **Regulation**: Section 508 / Revised 508 Standards (Accessibility Conformance Report; VPAT)
- **Theme**: Documentation/Conformity
- **Affected artifact**: [tasks.md (Phase 7)](../../specs/001-markdit-core/tasks.md)
- **Finding**: No artifact plans an Accessibility Conformance Report (VPAT), which
  is commonly required for US public-sector procurement and useful for substantiating
  accessibility claims.
- **Proposed remediation**: Add a task to produce a VPAT/ACR once the WCAG 2.2 AA
  audit (T073) is complete.
- **Date**: 2026-06-12

---

### NA-007 — FTC Act §5: substantiation of privacy & security claims

- **Status**: NEEDS EVIDENCE
- **Severity**: HIGH
- **Regulation**: FTC Act §5 (unfair or deceptive acts or practices)
- **Theme**: Privacy/Security
- **Affected artifact**: [spec.md SC-008/FR-011/FR-014](../../specs/001-markdit-core/spec.md), [research.md §13](../../specs/001-markdit-core/research.md), [README.md](../../README.md)
- **Finding**: Marketing/product claims ("local-first", "no document content
  leaves the device without consent", "anonymized telemetry", signed/secure
  updates) are representations that must be truthful and substantiated. They are
  backed by intended tests (SC-008, T069/T070) and security measures, but cannot be
  substantiated until those tests pass and the telemetry schema is documented.
- **Proposed remediation**: Keep public claims consistent with verified behavior;
  retain passing SC-008/telemetry tests and the telemetry schema as substantiation;
  avoid unqualified "anonymous" claims unless proven (see EU-005).
- **Date**: 2026-06-12

---

### NA-008 — PIPEDA: consent, purpose limitation, safeguards

- **Status**: PARTIAL
- **Severity**: MEDIUM
- **Regulation**: PIPEDA (Personal Information Protection and Electronic Documents Act), Schedule 1 principles
- **Theme**: Privacy
- **Affected artifact**: [spec.md FR-011/FR-012/FR-014](../../specs/001-markdit-core/spec.md), [contracts/settings-consent.md](../../specs/001-markdit-core/contracts/settings-consent.md)
- **Finding**: Meaningful consent, purpose limitation (local-first), access, and
  safeguards (sanitization, signed updates, Rust boundary) are designed-in.
  Remaining gaps: an accountability statement / openness (privacy policy, contact)
  and substantiation of safeguards via tests. (Overlaps EU privacy findings.)
- **Proposed remediation**: Cover openness/accountability in the privacy policy
  (NA-001) and evidence safeguards via security/privacy tests.
- **Date**: 2026-06-12

---

### NA-009 — Quebec Law 25: policy, responsible person, transfer & PIA

- **Status**: NON-COMPLIANT
- **Severity**: HIGH
- **Regulation**: Quebec Law 25 (Act respecting the protection of personal information in the private sector, as amended) — privacy policy publication, person in charge of protection, privacy by default, transfer-outside-Québec assessment, privacy impact assessment
- **Theme**: Privacy/Documentation
- **Affected artifact**: [spec.md FR-011/FR-012](../../specs/001-markdit-core/spec.md), [contracts/export-targets.md](../../specs/001-markdit-core/contracts/export-targets.md)
- **Finding**: Privacy-by-default is satisfied by the local-first design, but Law 25
  also requires a published privacy policy, a designated person responsible for the
  protection of personal information (with contact), disclosure/assessment when
  personal data is communicated outside Québec (cloud export to Microsoft 365), and
  a privacy impact assessment for such transfers/systems. None are planned.
- **Proposed remediation**: Publish a privacy policy naming the responsible person
  and contact; disclose out-of-province transfer at cloud-export consent (overlaps
  EU-004); perform a lightweight PIA for the cloud-export path.
- **Date**: 2026-06-12

---

### NA-010 — Accessible Canada Act / ACR

- **Status**: PARTIAL
- **Severity**: LOW
- **Regulation**: Accessible Canada Act; Accessibility Standards (CAN/ASC – ACR)
- **Theme**: Accessibility
- **Affected artifact**: [spec.md FR-013](../../specs/001-markdit-core/spec.md), [tasks.md T073](../../specs/001-markdit-core/tasks.md)
- **Finding**: Technical accessibility is addressed via the WCAG 2.2 AA program
  (overlaps EU-006/NA-005). The ACA's organizational obligations (accessibility
  plan, feedback process, progress reports) generally bind federally regulated
  entities and are likely NOT-APPLICABLE to an independent software vendor, but the
  product/documentation accessibility expectation remains.
- **Proposed remediation**: Confirm ACA organizational obligations are out of scope
  for the publisher; ensure product + docs accessibility via T073/T078.
- **Date**: 2026-06-12

---
