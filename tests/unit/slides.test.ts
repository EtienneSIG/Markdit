import { describe, it, expect } from 'vitest';
import { markdownToSlides } from '../../src/slides/slides';

describe('markdownToSlides (US5 — generate a Markdown slide deck)', () => {
  it('returns an empty deck for empty input', () => {
    const { markdown, slideCount } = markdownToSlides('');
    expect(slideCount).toBe(0);
    expect(markdown).toBe('');
  });

  it('keeps a heading-less document as a single slide', () => {
    const { markdown, slideCount } = markdownToSlides('Just a paragraph.\n');
    expect(slideCount).toBe(1);
    expect(markdown).not.toContain('\n---\n');
    expect(markdown).toContain('Just a paragraph.');
  });

  it('splits on the shallowest heading depth and separates slides with ---', () => {
    const md = ['# One', '', 'first', '', '# Two', '', 'second'].join('\n');
    const { markdown, slideCount } = markdownToSlides(md);
    expect(slideCount).toBe(2);
    expect(markdown).toContain('\n---\n');
    expect(markdown).toMatch(/# One[\s\S]*first[\s\S]*---[\s\S]*# Two[\s\S]*second/);
  });

  it('auto-descends to the heading level that yields multiple slides', () => {
    // A single H1 title followed by several H2 sections should split per H2
    // section (one oversized slide is never useful for a deck).
    const md = ['# Title', '', '## Sub A', '', 'a', '', '## Sub B', '', 'b'].join('\n');
    const { slideCount, markdown } = markdownToSlides(md);
    expect(slideCount).toBe(3); // title slide + 2 section slides
    expect(markdown).toMatch(/# Title[\s\S]*---[\s\S]*## Sub A[\s\S]*---[\s\S]*## Sub B/);
  });

  it('treats content before the first heading as a title slide', () => {
    const md = ['Intro line', '', '# First', '', 'body'].join('\n');
    const { markdown, slideCount } = markdownToSlides(md);
    expect(slideCount).toBe(2);
    expect(markdown.indexOf('Intro line')).toBeLessThan(markdown.indexOf('# First'));
  });

  it('honors an explicit slideLevel', () => {
    const md = ['# Title', '', '## A', '', '## B'].join('\n');
    const { slideCount } = markdownToSlides(md, { slideLevel: 2 });
    expect(slideCount).toBe(3);
  });

  it('produces standard Markdown with no proprietary markers', () => {
    const md = ['# A', '', '- item', '', '# B', '', '**bold**'].join('\n');
    const { markdown } = markdownToSlides(md);
    expect(markdown).toContain('- item');
    expect(markdown).toContain('**bold**');
  });
});
