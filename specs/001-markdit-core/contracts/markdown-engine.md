# Contract: Markdown Engine

**Boundary**: `src/markdown/` — the single source of truth for parsing,
rendering, sanitizing, and serializing Markdown. Every visual edit flows through
this module for output; TipTap's own serializer is **not** authoritative.

Baseline: CommonMark + GitHub Flavored Markdown (`remark-gfm`).

```ts
import type { Root } from 'mdast';

/** Parse Markdown text into a stable mdast tree (CommonMark + GFM). */
export function parse(markdown: string): Root;

/** Render mdast to sanitized, safe HTML for display. */
export function renderHtml(tree: Root, opts?: {
  allowRemoteContent?: boolean; // default false — gated by consent (FR-003)
  highlight?: boolean;          // Shiki/highlight.js for fenced code
}): string;

/** Serialize an edited document back to standard Markdown (lossless). */
export function serialize(tree: Root, opts?: SerializeOptions): string;

export type SerializeOptions = {
  bullet?: '-' | '*' | '+';        // deterministic, default '-'
  emphasis?: '_' | '*';            // deterministic, default '*'
  fence?: '`' | '~';               // default '`'
  normalize?: boolean;             // cosmetic normalization, OFF by default
};
```

## Invariants (verified by the golden-file corpus)

1. **Lossless round-trip** (FR-005, SC-003, Principle I): for every fixture in
   `tests/corpus/input/`, `serialize(parse(md))` equals the expected output in
   `tests/corpus/expected/` with `normalize:false`. No meaningful content change.
2. **Determinism**: identical input + options always produce identical output
   (stable marker choices).
3. **Standards-only output**: serialized output contains no proprietary markers;
   any non-portable construct is isolated and reversible (Principle II).
4. **Sanitization** (FR-003, Principle V): `renderHtml` strips script/event
   handlers and disallowed tags via `rehype-sanitize`; with
   `allowRemoteContent:false`, remote image/link resources are not fetched.
5. **GFM coverage** (FR-002, SC-001): tables, task lists, strikethrough,
   autolinks, and fenced code (with highlighting) render equivalently to a
   Git-platform reference.
6. **Resilience** (Edge Case): malformed input parses best-effort and never
   throws unhandled; a clear notice is surfaced to the caller.

## TipTap ⇄ mdast mapping

```ts
/** Convert an mdast tree to a ProseMirror/TipTap document. */
export function mdastToProseMirror(tree: Root): ProseMirrorDoc;
/** Convert a ProseMirror/TipTap document back to mdast for serialization. */
export function proseMirrorToMdast(doc: ProseMirrorDoc): Root;
```

- Each `Formatting Action` (see data-model) MUST map to exactly one standard
  Markdown construct through this conversion.

### Contract tests

- Golden-file corpus over CommonMark + GFM fixtures (round-trip equality).
- Sanitization unit tests: `<script>`, `onerror=`, `javascript:` URLs stripped.
- Remote-content gate test: no network when `allowRemoteContent:false`.
- Mapping tests: every toolbar action → expected Markdown.
