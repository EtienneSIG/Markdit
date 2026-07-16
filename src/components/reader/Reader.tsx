import { useEffect, useMemo, useRef } from 'react';
import { parse } from '../../markdown/parse';
import { renderHtml } from '../../markdown/render';
import { highlightCode } from '../../markdown/highlight';
import { renderMermaid, mermaidThemeFor } from '../../markdown/mermaid';
import { SHIKI_THEME_FOR } from '../../app/theme';
import { LARGE_FILE_THRESHOLD_BYTES, type ThemeId } from '../../lib/types';
import { t } from '../../lib/i18n';

export interface ReaderProps {
  markdown: string;
  allowRemoteContent: boolean;
  theme: ThemeId;
  /**
   * Resolve a local (relative/absolute filesystem) image `src` to a URL the
   * webview can display (blob or data URL), or null when it can't be resolved.
   * When provided, local images in the document are shown on-device.
   */
  resolveImage?: (src: string) => Promise<string | null>;
}

/**
 * Read view (US1, FR-002): renders Markdown to sanitized HTML via the engine.
 * Syntax highlighting is applied progressively after paint so it never blocks
 * first render of large files (SC-002 graceful degradation). Files above the
 * documented threshold skip highlighting entirely to stay responsive (T029).
 */
export function Reader({ markdown, allowRemoteContent, theme, resolveImage }: ReaderProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  // Documented graceful degradation for very large files (Edge Case, T029).
  const isLargeFile = useMemo(
    () => new Blob([markdown]).size > LARGE_FILE_THRESHOLD_BYTES,
    [markdown],
  );

  const html = useMemo(
    () =>
      renderHtml(parse(markdown), {
        allowRemoteContent,
        highlight: !isLargeFile,
        deferLocalImages: Boolean(resolveImage),
      }),
    [markdown, allowRemoteContent, isLargeFile, resolveImage],
  );

  // Resolve local images on-device (from the document's folder). Blob URLs are
  // revoked on re-render/unmount so nothing leaks. Nothing leaves the device.
  useEffect(() => {
    if (!resolveImage) return;
    const root = containerRef.current;
    if (!root) return;
    let cancelled = false;
    const objectUrls: string[] = [];
    const images = Array.from(root.querySelectorAll<HTMLImageElement>('img[data-local-src]'));
    (async () => {
      for (const img of images) {
        if (cancelled) return;
        const src = img.getAttribute('data-local-src');
        if (!src) continue;
        const resolved = await resolveImage(src);
        if (cancelled) {
          if (resolved?.startsWith('blob:')) URL.revokeObjectURL(resolved);
          return;
        }
        if (resolved) {
          img.src = resolved;
          img.removeAttribute('data-local-src');
          if (resolved.startsWith('blob:')) objectUrls.push(resolved);
        }
      }
    })();
    return () => {
      cancelled = true;
      for (const url of objectUrls) URL.revokeObjectURL(url);
    };
  }, [html, resolveImage]);

  // Progressive, non-blocking syntax highlighting of fenced code blocks.
  // Skipped for large files to keep scrolling/interaction responsive.
  // `mermaid` fences are rendered to SVG diagrams instead of being highlighted.
  useEffect(() => {
    if (isLargeFile) return;
    let cancelled = false;
    const root = containerRef.current;
    if (!root) return;
    const blocks = Array.from(root.querySelectorAll('pre > code[class*="language-"]'));
    (async () => {
      for (const block of blocks) {
        if (cancelled) return;
        const lang = /language-([\w-]+)/.exec(block.className)?.[1] ?? 'text';
        const pre = block.parentElement;
        if (!pre) continue;

        if (lang === 'mermaid') {
          const result = await renderMermaid(
            block.textContent ?? '',
            mermaidThemeFor(SHIKI_THEME_FOR[theme]),
          );
          if (cancelled) return;
          if (result.ok && result.svg) {
            const figure = document.createElement('figure');
            figure.className = 'markdit-mermaid';
            figure.setAttribute('role', 'img');
            figure.innerHTML = result.svg;
            pre.replaceWith(figure);
          } else {
            // Graceful degradation: keep the source visible with a notice.
            pre.classList.add('markdit-mermaid-error');
            pre.setAttribute('data-mermaid-error', result.error ?? '');
            pre.setAttribute('title', t('mermaid.error'));
          }
          continue;
        }

        const highlighted = await highlightCode(
          block.textContent ?? '',
          lang,
          SHIKI_THEME_FOR[theme],
        );
        if (cancelled) return;
        pre.outerHTML = highlighted;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [html, theme, isLargeFile]);

  return (
    <article
      ref={containerRef}
      className="markdit-reader"
      // Accessibility (T030, FR-013): a labelled document region, screen-reader
      // friendly, keyboard-scrollable.
      role="document"
      aria-label={t('view.read')}
      tabIndex={0}
    >
      {isLargeFile && (
        <p className="markdit-notice" role="status">
          {t('notice.largeFile')}
        </p>
      )}
      <div
        // HTML is sanitized by the engine (rehype-sanitize) before reaching here.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}
