/**
 * Mermaid diagram rendering (FR-002 — Git-fidelity rendering of fenced code).
 *
 * Fenced ```mermaid blocks are rendered client-side to SVG, mirroring how
 * GitHub renders diagrams. Mermaid is asynchronous and heavyweight, so it is
 * loaded lazily and invoked by the UI layer after the synchronous `renderHtml`
 * pass — the same progressive strategy used for Shiki highlighting.
 *
 * Security (Principle V): Mermaid runs with `securityLevel: 'strict'`, which
 * disables inline scripts/click handlers and HTML labels, so untrusted diagram
 * source cannot inject active content into the rendered SVG.
 *
 * The bundled Mermaid (v11) supports modern diagram types including the
 * `architecture-beta` diagrams.
 */
import type { Mermaid } from 'mermaid';

export type MermaidTheme = 'default' | 'dark';

/** Map an app theme to a Mermaid built-in theme. */
export function mermaidThemeFor(theme: 'github-light' | 'github-dark'): MermaidTheme {
  return theme === 'github-dark' ? 'dark' : 'default';
}

let mermaidPromise: Promise<Mermaid> | null = null;
let currentTheme: MermaidTheme | null = null;
let idCounter = 0;

async function getMermaid(theme: MermaidTheme): Promise<Mermaid> {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((mod) => mod.default);
  }
  const mermaid = await mermaidPromise;
  // Re-initialize only when the theme changes to keep diagrams in sync with the
  // app theme (light/dark/high-contrast).
  if (currentTheme !== theme) {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme,
    });
    currentTheme = theme;
  }
  return mermaid;
}

export interface MermaidRenderResult {
  ok: boolean;
  /** Sanitized SVG markup on success. */
  svg?: string;
  /** Human-readable error message on failure. */
  error?: string;
}

/**
 * Render a single Mermaid diagram definition to SVG.
 * Never throws — parse/render failures are returned as `{ ok: false }` so the
 * caller can show the original source with an inline error notice.
 */
export async function renderMermaid(
  code: string,
  theme: MermaidTheme = 'default',
): Promise<MermaidRenderResult> {
  try {
    const mermaid = await getMermaid(theme);
    // `parse` throws on invalid syntax before we attempt a full render.
    await mermaid.parse(code);
    const id = `markdit-mermaid-${idCounter++}`;
    const { svg } = await mermaid.render(id, code);
    return { ok: true, svg };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { ok: false, error };
  }
}
