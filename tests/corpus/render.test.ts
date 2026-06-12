import { describe, it, expect } from 'vitest';
import { parse } from '../../src/markdown/parse';
import { renderHtml } from '../../src/markdown/render';
import { loadCorpus } from './runner';

const byName = (n: string) => loadCorpus().find((c) => c.name === n)!;

describe('Render fidelity (FR-002, SC-001)', () => {
  it('renders GFM headings, emphasis and links', () => {
    const html = renderHtml(parse(byName('basic.md').input));
    expect(html).toContain('<h1>');
    expect(html).toContain('<h2>');
    expect(html).toContain('<strong>');
    expect(html).toContain('<em>');
    expect(html).toContain('<a href="https://example.com">');
    expect(html).toContain('<hr>');
  });

  it('renders GFM tables and task lists', () => {
    const html = renderHtml(parse(byName('gfm.md').input));
    expect(html).toContain('<table>');
    expect(html).toContain('<th>');
    // Task list checkboxes (GFM)
    expect(html).toMatch(/<input[^>]*type="checkbox"/);
    expect(html).toMatch(/<del>removed<\/del>/);
  });

  it('renders fenced code with language hooks for highlighting', () => {
    const html = renderHtml(parse(byName('code.md').input));
    expect(html).toContain('<pre>');
    expect(html).toMatch(/<code class="language-ts"/);
    expect(html).toMatch(/<code class="language-python"/);
  });
});
