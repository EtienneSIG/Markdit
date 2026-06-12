# Contract: Settings & Consent

**Boundary**: `src/privacy/` + Rust `settings` command. Governs telemetry, remote
content, and cloud-export consent. Persisted locally only — never document content.

```ts
export type PrivacySettings = {
  telemetryEnabled: boolean;          // default false (opt-in)
  allowRemoteContent: boolean;        // default false
  cloudExportConsents: {
    onenote: ConsentRecord;
    loop: ConsentRecord;
  };
  signedInAccount: AccountInfo | null;
  locale: string;                     // default OS locale
  theme: 'system' | 'light' | 'dark' | 'high-contrast'; // default 'system'
};

export type ConsentRecord = {
  granted: boolean;
  grantedAt: string | null;           // ISO 8601 — audit trail (SC-008)
  scopes: string[];
};

export type AccountInfo = {
  username: string;                   // minimal identity, MSAL-provided
  homeAccountId: string;
};
```

## Operations

```ts
export function getSettings(): Promise<PrivacySettings>;
export function updateSettings(patch: Partial<PrivacySettings>): Promise<PrivacySettings>;

/** GDPR/CCPA data-subject rights (FR-012). */
export function exportPersonalData(): Promise<Blob>;   // settings + consent log
export function deletePersonalData(): Promise<void>;   // clears settings + token cache

/** Consent lifecycle for cloud targets. */
export function grantConsent(target: 'onenote' | 'loop', scopes: string[]): Promise<ConsentRecord>;
export function revokeConsent(target: 'onenote' | 'loop'): Promise<void>; // invalidates tokens
```

## Invariants

1. **Default-local** (Principle III): a fresh install has `telemetryEnabled=false`,
   `allowRemoteContent=false`, both consents `granted=false`, and no signed-in
   account. Verified by an E2E "first run" test.
2. **Opt-in telemetry** (FR-014): telemetry is never sent while
   `telemetryEnabled=false`; when enabled, data is anonymized and the disclosure
   is shown. Disabling stops all telemetry immediately.
3. **Consent gating** (FR-011, SC-008): no cloud export proceeds without a
   `ConsentRecord{ granted:true }` and a valid `signedInAccount`. `grantedAt` is
   recorded for audit.
4. **Revocation**: `revokeConsent` and `deletePersonalData` MUST clear the MSAL
   token cache so subsequent exports re-prompt.
5. **Discoverability** (FR-012): export/delete/consent controls are reachable and
   keyboard-operable (FR-013).

### Contract tests

- First-run settings equal the default-local profile (E2E).
- `telemetryEnabled=false` ⇒ zero telemetry requests (E2E network assertion).
- `grantConsent` then `revokeConsent` clears tokens; next export re-prompts.
- `exportPersonalData` excludes document content; `deletePersonalData` empties
  settings and consent log.
