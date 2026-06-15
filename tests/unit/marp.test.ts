import { describe, it, expect } from 'vitest';
import { markdownToSlides } from '../../src/slides/slides';
import { renderMarp, marpHtmlDocument } from '../../src/slides/marp';

describe('Marp rendering (US5 — render the deck via Marp Core)', () => {
  it('renders a Marp deck to HTML sections and CSS', () => {
    const { markdown } = markdownToSlides(['# One', '', 'a', '', '# Two', '', 'b'].join('\n'));
    const { html, css } = renderMarp(markdown);
    expect(html).toContain('<section');
    expect(html).toContain('One');
    expect(html).toContain('Two');
    expect(css.length).toBeGreaterThan(0);
  });

  it('applies the selected theme directive', () => {
    const { markdown } = markdownToSlides('# Title\n', { theme: 'gaia' });
    const { css } = renderMarp(markdown);
    // Marp Core emits the chosen theme name in the generated stylesheet.
    expect(css.toLowerCase()).toContain('gaia');
  });

  it('builds a self-contained HTML document with the title and inlined CSS', () => {
    const { markdown } = markdownToSlides('# Hello\n');
    const doc = marpHtmlDocument(markdown, 'My Deck');
    expect(doc.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(doc).toContain('<title>My Deck</title>');
    expect(doc).toContain('<style>');
    expect(doc).toContain('<section');
  });

  it('escapes the document title', () => {
    const { markdown } = markdownToSlides('# Hello\n');
    const doc = marpHtmlDocument(markdown, '<script>x</script>');
    expect(doc).toContain('&lt;script&gt;');
    expect(doc).not.toContain('<title><script>');
  });
});
