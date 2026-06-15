/**
 * Marp rendering (US5) — turn the Marp-flavored Markdown produced by
 * `markdownToSlides()` into presentable HTML + CSS using Marp Core
 * (https://marp.app/). Rendering happens entirely on-device; nothing is sent
 * anywhere (Principle III).
 */
import { Marp } from '@marp-team/marp-core';

export interface MarpRender {
  /** Rendered slide sections (inline SVG per slide). */
  html: string;
  /** Theme + Marp Core stylesheet for the rendered slides. */
  css: string;
}

/**
 * Render a Marp deck to HTML + CSS. Math and other heavyweight extensions are
 * left at Marp Core defaults; the deck Markdown carries its own front-matter
 * directives (theme, pagination).
 */
export function renderMarp(markdown: string): MarpRender {
  const marp = new Marp({ html: false, inlineSVG: true });
  const { html, css } = marp.render(markdown);
  return { html, css };
}

/**
 * Build a self-contained HTML document for the deck: a single `.html` file that
 * opens in any browser as a scrollable set of slides, with the Marp stylesheet
 * inlined. Used for the in-app preview (via an iframe) and for HTML export.
 */
export function marpHtmlDocument(markdown: string, title: string): string {
  const { html, css } = renderMarp(markdown);
  const safeTitle = escapeHtml(title);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safeTitle}</title>
<style>
  body { margin: 0; background: #1e1e1e; }
  svg[data-marpit-svg], section { display: block; }
  svg[data-marpit-svg] { width: 100%; height: auto; margin: 0 auto 16px; max-width: 1280px; }
${css}
</style>
</head>
<body>
${html}
</body>
</html>`;
}

/** Minimal HTML-attribute/text escaping for the document title. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
