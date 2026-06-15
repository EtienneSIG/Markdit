/**
 * Slide generation (US5) — turn the original Markdown into a Marp slide deck.
 * The output is itself standard Markdown enriched with a Marp front-matter
 * header (https://marp.app/): `marp: true` enables Marp tooling, slides are
 * separated by a `---` thematic break, and the deck still renders cleanly in any
 * general Markdown editor.
 *
 * The Markdown engine stays the single source of truth: we only re-group the
 * existing mdast top-level nodes and serialize them back with `serialize()`,
 * then prepend the Marp directives. No proprietary inline markers are
 * introduced (Principle I/II).
 */
import type { Heading, Root, RootContent } from 'mdast';
import { parse } from '../markdown/parse';
import { serialize } from '../markdown/serialize';

export interface SlidesOptions {
  /**
   * Heading depth at or above which a new slide begins. When omitted, the
   * shallowest heading depth present in the document is used so the most
   * natural section boundaries become slide boundaries.
   */
  slideLevel?: number;
  /**
   * Prepend a Marp front-matter header (`marp: true` + theme + pagination).
   * Default `true`. Set to `false` to emit a plain `---`-separated deck.
   */
  marp?: boolean;
  /** Marp theme name (`default`, `gaia`, `uncover`). Default `default`. */
  theme?: MarpTheme;
  /** Show slide page numbers (Marp `paginate`). Default `true`. */
  paginate?: boolean;
}

/** Built-in Marp Core themes. */
export type MarpTheme = 'default' | 'gaia' | 'uncover';

export interface SlidesResult {
  /** Marp-flavored Markdown with slides separated by `---`. */
  markdown: string;
  /** Number of generated slides. */
  slideCount: number;
}

/** Separator inserted between slides (blank lines keep the break unambiguous). */
const SLIDE_SEPARATOR = '\n\n---\n\n';

/** Build the Marp YAML front-matter header. */
function marpFrontMatter(theme: MarpTheme, paginate: boolean): string {
  return ['---', 'marp: true', `theme: ${theme}`, `paginate: ${paginate}`, '---', '', ''].join('\n');
}

/** Count how many slides a given slide level would produce. */
function countSlidesAtLevel(children: readonly RootContent[], level: number): number {
  let slides = 0;
  let openSlideHasContent = false;
  for (const node of children) {
    const startsSlide = node.type === 'heading' && node.depth <= level;
    if (startsSlide) {
      slides += 1;
      openSlideHasContent = true;
    } else if (!openSlideHasContent) {
      // Content before the first qualifying heading becomes a leading slide.
      slides += 1;
      openSlideHasContent = true;
    }
  }
  return slides;
}

/**
 * Pick the slide level automatically: the shallowest heading depth that actually
 * splits the document into more than one slide. This makes the common
 * "single H1 title followed by several H2 sections" layout produce one slide per
 * section instead of a single oversized slide. Falls back to the shallowest
 * heading depth (or 1) when no level yields multiple slides.
 */
function autoSlideLevel(children: readonly RootContent[]): number {
  const depths = children
    .filter((node): node is Heading => node.type === 'heading')
    .map((heading) => heading.depth);
  if (depths.length === 0) return 1;
  const distinct = Array.from(new Set(depths)).sort((a, b) => a - b);
  for (const level of distinct) {
    if (countSlidesAtLevel(children, level) > 1) return level;
  }
  return distinct[0];
}

/**
 * Convert Markdown into a Marp slide deck expressed as Markdown.
 *
 * Content before the first qualifying heading becomes the title slide; each
 * subsequent heading at (or above) the chosen level starts a new slide. Input
 * with no headings yields a single slide. Empty input yields an empty deck.
 * By default a Marp front-matter header is prepended so the result is ready for
 * Marp (VS Code extension, Marp CLI, or marp.app) while staying valid Markdown.
 */
export function markdownToSlides(markdown: string, opts: SlidesOptions = {}): SlidesResult {
  const tree = parse(markdown);
  const children = tree.children;
  if (children.length === 0) {
    return { markdown: '', slideCount: 0 };
  }

  const slideLevel = opts.slideLevel ?? autoSlideLevel(children);

  const slides: RootContent[][] = [];
  let current: RootContent[] = [];
  for (const node of children) {
    const startsSlide = node.type === 'heading' && node.depth <= slideLevel;
    if (startsSlide && current.length > 0) {
      slides.push(current);
      current = [];
    }
    current.push(node);
  }
  if (current.length > 0) {
    slides.push(current);
  }

  const rendered = slides.map((nodes) => {
    const slideTree: Root = { type: 'root', children: nodes };
    return serialize(slideTree).trimEnd();
  });

  const body = `${rendered.join(SLIDE_SEPARATOR)}\n`;
  const useMarp = opts.marp ?? true;
  const header = useMarp
    ? marpFrontMatter(opts.theme ?? 'default', opts.paginate ?? true)
    : '';

  return {
    markdown: `${header}${body}`,
    slideCount: rendered.length,
  };
}
