# Security Policy

Markdit is built privacy-first and security-first (see the project Constitution,
Principles III and V).

## Supported Versions

The latest released minor version receives security updates. Pre-1.0 releases are
provided on a best-effort basis.

## Reporting a Vulnerability

Please report security issues privately via GitHub Security Advisories on this
repository ("Report a vulnerability"). Do **not** open public issues for
suspected vulnerabilities.

We aim to acknowledge reports within 5 business days and to provide a remediation
plan or timeline within 15 business days.

## Security Properties

- **Local-first**: documents are read/written only on the user's device. No
  content is transmitted without explicit, recorded consent.
- **HTML sanitization**: all rendered HTML passes through `rehype-sanitize` with a
  strict allow-list. `<script>`, event-handler attributes, and `javascript:` URLs
  are removed.
- **Remote content gating**: remote images/links are not fetched unless the user
  opts in (default off).
- **Content Security Policy**: a restrictive CSP is enforced in the desktop shell
  and the web entry point.
- **Least-privilege cloud scopes**: OneNote/Loop export requests the minimum
  Microsoft Graph scopes, only after consent, and can be fully revoked.
- **Signed installer & updates**: Windows installers and auto-updates are signed
  and signature-verified.
- **SBOM**: a CycloneDX Software Bill of Materials is generated for releases
  (`npm run sbom`).

## Supply Chain

Dependencies are pinned in lockfiles, scanned in CI, and reviewed before upgrade.
Report suspected malicious dependencies via the channel above.
