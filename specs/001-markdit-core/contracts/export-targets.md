# Contract: Export Targets

**Boundary**: `src/export/` — converts the active document to external formats.
Word is fully offline; OneNote and Loop use Microsoft Graph via MSAL and require
explicit consent before any content leaves the device (Principle III).

```ts
export type ExportTargetId = 'word' | 'onenote' | 'loop';

export type ExportResult = {
  target: ExportTargetId;
  status: 'success' | 'partial' | 'cancelled' | 'failed';
  outputLocation: string | null;   // file path (Word) | service URL (cloud)
  droppedElements: string[];       // non-representable elements (reported)
  message: string;                 // user-facing summary
};

export interface Exporter {
  readonly id: ExportTargetId;
  readonly mode: 'offline' | 'cloud';
  readonly requiresAuth: boolean;
  /** Elements that cannot be represented; surfaced before/after export. */
  capabilities(): { supported: string[]; unsupported: string[] };
  export(tree: import('mdast').Root): Promise<ExportResult>;
}
```

## word (offline)

```ts
export const wordExporter: Exporter; // mode: 'offline', requiresAuth: false
```

- Generates `.docx` in-memory (JS `docx` lib), written to disk via
  `invoke('export_docx', …)`. **No network** (FR-009, clarification).
- Preserves headings, lists, tables, code, links as faithfully as `.docx` allows
  (SC-006 ≥ 95% of supported elements); remainder listed in `droppedElements`.

## onenote (cloud, consented)

```ts
export const oneNoteExporter: Exporter; // mode: 'cloud', requiresAuth: true
// required scopes (least privilege): ['Notes.Create']
```

- MUST acquire MSAL token with explicit sign-in + consent before sending content
  (FR-010, FR-011). If consent is absent → `status: 'cancelled'`, nothing sent.
- Creates a page via Microsoft Graph; reports non-representable elements.

## loop (cloud, consented)

```ts
export const loopExporter: Exporter; // mode: 'cloud', requiresAuth: true
```

- Targets Loop components/pages where the Graph surface allows; transparently
  degrades and reports `droppedElements` for unrepresentable constructs (spec
  assumption). Consent gating identical to OneNote.

## Cross-cutting rules

- **Consent-first**: cloud exporters MUST verify a valid `ConsentRecord` and
  signed-in account before any request (SC-008 — zero content leaves device
  without recorded consent).
- **No silent loss**: every export returns `droppedElements`; the UI MUST inform
  the user (FR-010, edge case: non-representable element).
- **Failure transparency**: offline/not-signed-in/unavailable target → clear
  message, `status: 'failed' | 'cancelled'`, no partial silent writes.
- **Least privilege**: request only the minimal Graph scopes listed above.

### Contract tests

- Word export produces a valid `.docx` with no network access (E2E).
- Cloud export with no consent returns `cancelled` and performs zero requests.
- Consent + mocked Graph returns `success`/`partial` and populates
  `droppedElements` for unsupported nodes.
