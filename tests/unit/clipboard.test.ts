import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyRichText, copyMarkdownAsRichText } from '../../src/lib/clipboard';

describe('clipboard helpers (rich copy for OneNote/Word/Loop)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('writes both text/html and text/plain when ClipboardItem is available', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('ClipboardItem', class {
      items: Record<string, Blob>;
      constructor(items: Record<string, Blob>) {
        this.items = items;
      }
    });
    vi.stubGlobal('navigator', { clipboard: { write } });

    const ok = await copyRichText('<p>hi</p>', 'hi');
    expect(ok).toBe(true);
    expect(write).toHaveBeenCalledOnce();
  });

  it('falls back to writeText when ClipboardItem is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('ClipboardItem', undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const ok = await copyRichText('<p>hi</p>', 'hi');
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hi');
  });

  it('returns false when no clipboard API exists', async () => {
    vi.stubGlobal('ClipboardItem', undefined);
    vi.stubGlobal('navigator', {});
    const ok = await copyRichText('<p>hi</p>', 'hi');
    expect(ok).toBe(false);
  });

  it('renders Markdown to HTML before copying', async () => {
    const blobs: { parts: string; type: string }[] = [];
    vi.stubGlobal('Blob', class {
      parts: string;
      type: string;
      constructor(parts: string[], opts?: { type?: string }) {
        this.parts = parts.join('');
        this.type = opts?.type ?? '';
        blobs.push({ parts: this.parts, type: this.type });
      }
    });
    vi.stubGlobal('ClipboardItem', class {
      constructor(_items: Record<string, Blob>) {}
    });
    vi.stubGlobal('navigator', { clipboard: { write: vi.fn().mockResolvedValue(undefined) } });

    const ok = await copyMarkdownAsRichText('# Title');
    expect(ok).toBe(true);
    const htmlBlob = blobs.find((b) => b.type === 'text/html');
    expect(htmlBlob?.parts).toContain('<h1>Title</h1>');
  });
});
