import { useEffect, useMemo, useRef } from 'react';
import { parse } from '../../markdown/parse';
import { renderHtml } from '../../markdown/render';
import { highlightCode } from '../../markdown/highlight';
import { SHIKI_THEME_FOR } from '../../app/theme';
import type { ThemeId } from '../../lib/types';

export interface ReaderProps {
  markdown: string;
  allowRemoteContent: boolean;
  theme: ThemeId;
}

/**
 * Read view (US1, FR-002): renders Markdown to sanitized HTML via the engine.
 * Syntax highlighting is applied progressively after paint so it never blocks
 * first render of large files (SC-002 graceful degradation).
 */
export function Reader({ markdown, allowRemoteContent, theme }: ReaderProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  const html = useMemo(
    () => renderHtml(parse(markdown), { allowRemoteContent, highlight: true }),
    [markdown, allowRemoteContent],
  );

  // Progressive, non-blocking syntax highlighting of fenced code blocks.
  useEffect(() => {
    let cancelled = false;
    const root = containerRef.current;
    if (!root) return;
    const blocks = Array.from(root.querySelectorAll('pre > code[class*="language-"]'));
    (async () => {
      for (const block of blocks) {
        if (cancelled) return;
        const lang = /language-([\w-]+)/.exec(block.className)?.[1] ?? 'text';
        const highlighted = await highlightCode(
          block.textContent ?? '',
          lang,
          SHIKI_THEME_FOR[theme],
        );
        if (cancelled) return;
        const pre = block.parentElement;
        if (pre) pre.outerHTML = highlighted;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [html, theme]);

  return (
    <div
      ref={containerRef}
      className="markdit-reader"
      // HTML is sanitized by the engine (rehype-sanitize) before reaching here.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
