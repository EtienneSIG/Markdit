# Contract: Tauri IPC Commands

**Boundary**: Rust core (`src-tauri`) ⇄ React frontend (`src`). All OS access
(filesystem, dialogs, updates, offline `.docx` write) is confined to the Rust side.

Signatures use TypeScript shapes as seen from the frontend `invoke()` boundary.
Errors are returned as a typed `CommandError`, never thrown opaquely.

```ts
type CommandError = {
  code: 'NOT_FOUND' | 'PERMISSION_DENIED' | 'IO_ERROR' | 'CONFLICT'
      | 'INVALID_ARGUMENT' | 'CANCELLED';
  message: string; // user-safe, localizable
};
```

---

## document.open

Open a `.md`/`.markdown` file from disk.

```ts
invoke('document_open', { path?: string }): Promise<{
  path: string;
  fileName: string;
  markdown: string;     // raw UTF-8 bytes as text — single source of truth
  sizeBytes: number;
  contentHash: string;  // for conflict detection
}>;
```

- If `path` is omitted, the Rust core shows the OS open dialog.
- MUST NOT fetch remote content. MUST return `IO_ERROR`/`NOT_FOUND` on failure
  without crashing (Edge Case: malformed/missing file).

## document.save

Persist the active document as plain Markdown text.

```ts
invoke('document_save', {
  path: string;
  markdown: string;
  expectedDiskHash: string; // last known on-disk hash
}): Promise<{ contentHash: string }>;
```

- If the current on-disk hash ≠ `expectedDiskHash`, MUST return `CONFLICT` and
  MUST NOT overwrite (FR-005 integrity; save-conflict edge case).
- Writes bytes verbatim — no proprietary wrapper (Principle I).

## document.saveAs

```ts
invoke('document_save_as', { markdown: string }): Promise<{
  path: string; fileName: string; contentHash: string;
}>;
```

- Shows the OS save dialog (`tauri-plugin-dialog`).

## document.watch / unwatch

Detect external changes for conflict prompts.

```ts
invoke('document_watch', { path: string }): Promise<void>;
invoke('document_unwatch', { path: string }): Promise<void>;
// Event emitted by core:
// 'document://changed' -> { path: string; diskHash: string }
```

## export.docx

Offline Word export — generated content written to disk by the core.

```ts
invoke('export_docx', {
  docxBytes: number[]; // generated in the frontend by the `docx` lib
  suggestedName: string;
}): Promise<{ outputPath: string }>;
```

- Fully offline; no network (FR-009).

## settings.get / settings.set

```ts
invoke('settings_get'): Promise<PrivacySettings>;     // see settings-consent.md
invoke('settings_set', { patch: Partial<PrivacySettings> }): Promise<PrivacySettings>;
```

- Default state MUST be fully local (telemetry off, remote content off).

## updater.check / updater.install

```ts
invoke('updater_check'): Promise<{ available: boolean; version?: string }>;
invoke('updater_install'): Promise<void>;
```

- Update artifacts MUST be signature-verified over an integrity-verified channel
  (FR-008, Principle V). MUST fail closed on signature mismatch.

---

### Contract tests (must exist before "done")

- `document_save` returns `CONFLICT` when disk hash differs (Rust `cargo test`).
- `document_open` round-trips bytes unchanged for the corpus (golden-file).
- `export_docx` never opens a network socket (E2E assertion).
- `updater_install` rejects an unsigned/altered artifact (Rust test).
