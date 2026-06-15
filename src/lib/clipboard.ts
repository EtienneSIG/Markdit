/**
 * Clipboard helpers. Writing both `text/html` and `text/plain` lets the user
 * paste *formatted* content into OneNote, Word, Loop, Outlook, etc. while still
 * degrading to plain text where rich paste is unavailable. Everything happens
 * locally — nothing is sent anywhere (Principle III).
 */
import { parse } from '../markdown/parse';
import { renderHtml } from '../markdown/render';

/** Wrap a rendered fragment in a minimal HTML document for rich paste targets. */
function wrapHtml(bodyHtml: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${bodyHtml}</body></html>`;
}

/**
 * Write rich content to the clipboard as both HTML and plain text.
 * Returns true on success. Falls back to plain-text-only when the async
 * Clipboard API or `ClipboardItem` is unavailable.
 */
export async function copyRichText(html: string, plainText: string): Promise<boolean> {
  try {
    const clipboard = navigator.clipboard as Clipboard | undefined;
    if (clipboard && typeof ClipboardItem !== 'undefined' && 'write' in clipboard) {
      const item = new ClipboardItem({
        'text/html': new Blob([wrapHtml(html)], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' }),
      });
      await clipboard.write([item]);
      return true;
    }
    if (clipboard && 'writeText' in clipboard) {
      await clipboard.writeText(plainText);
      return true;
    }
  } catch {
    try {
      await navigator.clipboard?.writeText(plainText);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Render Markdown to sanitized HTML and copy it to the clipboard as rich content
 * (HTML + the original Markdown as plain text) for pasting into OneNote/Word/Loop.
 */
export async function copyMarkdownAsRichText(markdown: string): Promise<boolean> {
  const html = renderHtml(parse(markdown));
  return copyRichText(html, markdown);
}
