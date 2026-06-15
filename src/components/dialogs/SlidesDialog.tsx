import { useEffect, useMemo, useRef, useState } from 'react';
import { markdownToSlides } from '../../slides/slides';
import { documentSaveAs, isTauriAvailable } from '../../lib/ipc';
import { copyRichText } from '../../lib/clipboard';
import { parse } from '../../markdown/parse';
import { renderHtml } from '../../markdown/render';
import { t } from '../../lib/i18n';

export interface SlidesDialogProps {
  open: boolean;
  markdown: string;
  fileName: string;
  onClose: () => void;
}

/** Derive a slide-deck file name from the source document name. */
function slidesFileName(fileName: string): string {
  const base = fileName.replace(/\.md$/i, '') || 'Untitled';
  return `${base}.slides.md`;
}

/** Trigger a client-side download of the slide Markdown in the browser build. */
function downloadMarkdown(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Accessible dialog that turns the current document into a slide deck expressed
 * as standard Markdown (slides separated by `---`). The user can preview, copy,
 * or save the result; nothing leaves the device (Principle III).
 */
export function SlidesDialog({
  open,
  markdown,
  fileName,
  onClose,
}: SlidesDialogProps): JSX.Element | null {
  const [copied, setCopied] = useState(false);
  const [savedTo, setSavedTo] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const { markdown: slides, slideCount } = useMemo(
    () => markdownToSlides(markdown),
    [markdown],
  );

  // Move focus into the dialog on open and close on Escape (keyboard a11y).
  useEffect(() => {
    if (!open) return;
    setCopied(false);
    setSavedTo(null);
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const targetName = slidesFileName(fileName);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(slides);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const handleCopyFormatted = async () => {
    const html = renderHtml(parse(slides));
    const ok = await copyRichText(html, slides);
    setCopied(ok);
  };

  const handleDownload = () => {
    downloadMarkdown(slides, targetName);
  };

  const handleSave = async () => {
    const res = await documentSaveAs(slides);
    if (res.ok) setSavedTo(res.value.path);
  };

  return (
    <div className="markdit-modal-backdrop" onClick={onClose}>
      <div
        className="markdit-modal markdit-modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="slides-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="slides-dialog-title">{t('slides.title')}</h2>
        <p className="markdit-slides-count">{t('slides.count').replace('{n}', String(slideCount))}</p>

        <label htmlFor="slides-output">{t('slides.preview')}</label>
        <textarea
          id="slides-output"
          className="markdit-source markdit-slides-output"
          value={slides}
          readOnly
          spellCheck={false}
          aria-label={t('slides.preview')}
        />

        {copied && (
          <p className="markdit-slides-status" role="status">
            {t('slides.copied')}
          </p>
        )}
        {savedTo && (
          <p className="markdit-slides-status" role="status">
            {t('slides.saved')} {savedTo}
          </p>
        )}

        <div className="markdit-modal-actions">
          <button ref={closeRef} type="button" onClick={onClose}>
            {t('export.close')}
          </button>
          <button type="button" onClick={handleCopy} disabled={slideCount === 0}>
            {t('slides.copy')}
          </button>
          <button type="button" onClick={handleCopyFormatted} disabled={slideCount === 0}>
            {t('slides.copyFormatted')}
          </button>
          {isTauriAvailable() ? (
            <button type="button" onClick={handleSave} disabled={slideCount === 0}>
              {t('slides.save')}
            </button>
          ) : (
            <button type="button" onClick={handleDownload} disabled={slideCount === 0}>
              {t('slides.download')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
