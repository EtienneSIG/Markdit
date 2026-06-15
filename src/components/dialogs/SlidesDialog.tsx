import { useEffect, useMemo, useRef, useState } from 'react';
import { markdownToSlides, type MarpTheme } from '../../slides/slides';
import { marpHtmlDocument } from '../../slides/marp';
import { documentSaveAs, isTauriAvailable } from '../../lib/ipc';
import { t } from '../../lib/i18n';

export interface SlidesDialogProps {
  open: boolean;
  markdown: string;
  fileName: string;
  onClose: () => void;
}

const THEMES: readonly MarpTheme[] = ['default', 'gaia', 'uncover'];

/** Derive a slide-deck file name from the source document name. */
function deckBaseName(fileName: string): string {
  return fileName.replace(/\.md$/i, '') || 'Untitled';
}

/** Trigger a client-side download in the browser build. */
function downloadFile(content: string, fileName: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
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
 * Accessible dialog that turns the current document into a Marp slide deck.
 * It shows a rendered preview (Marp Core), lets the user pick a theme, and
 * offers copy, Markdown save/download, and self-contained HTML export. Nothing
 * leaves the device (Principle III).
 */
export function SlidesDialog({
  open,
  markdown,
  fileName,
  onClose,
}: SlidesDialogProps): JSX.Element | null {
  const [theme, setTheme] = useState<MarpTheme>('default');
  const [copied, setCopied] = useState(false);
  const [savedTo, setSavedTo] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const { markdown: slides, slideCount } = useMemo(
    () => markdownToSlides(markdown, { theme }),
    [markdown, theme],
  );

  const previewDoc = useMemo(
    () => (slideCount > 0 ? marpHtmlDocument(slides, deckBaseName(fileName)) : ''),
    [slides, slideCount, fileName],
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

  const base = deckBaseName(fileName);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(slides);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const handleSaveMarkdown = async () => {
    if (isTauriAvailable()) {
      const res = await documentSaveAs(slides);
      if (res.ok) setSavedTo(res.value.path);
    } else {
      downloadFile(slides, `${base}.slides.md`, 'text/markdown');
    }
  };

  const handleExportHtml = async () => {
    const doc = marpHtmlDocument(slides, base);
    if (isTauriAvailable()) {
      const res = await documentSaveAs(doc);
      if (res.ok) setSavedTo(res.value.path);
    } else {
      downloadFile(doc, `${base}.slides.html`, 'text/html');
    }
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

        <div className="markdit-slides-toolbar">
          <label htmlFor="slides-theme">{t('slides.theme')}</label>
          <select
            id="slides-theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value as MarpTheme)}
          >
            {THEMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <label htmlFor="slides-preview">{t('slides.preview')}</label>
        <iframe
          id="slides-preview"
          className="markdit-slides-preview"
          title={t('slides.preview')}
          srcDoc={previewDoc}
          sandbox=""
        />

        <details className="markdit-slides-source-details">
          <summary>{t('slides.source')}</summary>
          <textarea
            className="markdit-source markdit-slides-output"
            value={slides}
            readOnly
            spellCheck={false}
            aria-label={t('slides.source')}
          />
        </details>

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
            {t('slides.close')}
          </button>
          <button type="button" onClick={handleCopy} disabled={slideCount === 0}>
            {t('slides.copy')}
          </button>
          <button type="button" onClick={handleSaveMarkdown} disabled={slideCount === 0}>
            {isTauriAvailable() ? t('slides.save') : t('slides.download')}
          </button>
          <button
            type="button"
            className="is-primary"
            onClick={handleExportHtml}
            disabled={slideCount === 0}
          >
            {t('slides.exportHtml')}
          </button>
        </div>
      </div>
    </div>
  );
}
