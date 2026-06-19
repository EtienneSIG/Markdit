import { describe, it, expect } from 'vitest';
import { parse } from '../../src/markdown/parse';
import { serialize } from '../../src/markdown/serialize';
import { mdastToProseMirror, proseMirrorToMdast } from '../../src/markdown/tiptap-bridge';

/** mdast -> ProseMirror -> mdast must preserve standard constructs (Principle I/II). */
function roundTrip(md: string): string {
  const pm = mdastToProseMirror(parse(md));
  return serialize(proseMirrorToMdast(pm));
}

describe('TipTap ⇄ mdast bridge (FR-004, T032/T044)', () => {
  it('preserves headings and inline marks', () => {
    const md = '# Title\n\nA **bold** and *italic* and `code` run.\n';
    expect(roundTrip(md)).toBe(serialize(parse(md)));
  });

  it('preserves lists and blockquotes', () => {
    const md = '- one\n- two\n\n> quoted\n';
    expect(roundTrip(md)).toBe(serialize(parse(md)));
  });

  it('preserves ordered lists, code blocks and rules', () => {
    const md = '1. first\n2. second\n\n```ts\nconst x = 1;\n```\n\n---\n';
    expect(roundTrip(md)).toBe(serialize(parse(md)));
  });

  it('keeps links with their target', () => {
    const out = roundTrip('[site](https://example.com)\n');
    expect(out).toContain('[site](https://example.com)');
  });

  it('preserves GFM tables (no data loss on edit)', () => {
    const md = '| A | B |\n| - | - |\n| 1 | 2 |\n';
    const out = roundTrip(md);
    expect(out).toContain('| A | B |');
    expect(out).toContain('| 1 | 2 |');
  });

  it('preserves task lists with their checked state', () => {
    const md = '- [x] done\n- [ ] todo\n';
    const out = roundTrip(md);
    expect(out).toContain('[x] done');
    expect(out).toContain('[ ] todo');
  });

  it('preserves images with their source', () => {
    const out = roundTrip('![alt](https://example.com/a.png)\n');
    expect(out).toContain('![alt](https://example.com/a.png)');
  });
});
