/**
 * OneNote export via Microsoft Graph (US4, cloud). Creates a new page in the
 * user's default notebook from sanitized HTML rendered by the engine.
 * Requires prior, recorded consent and the least-privilege `Notes.Create` scope.
 */
import { parse } from '../../markdown/parse';
import { renderHtml } from '../../markdown/render';
import { getToken } from './auth';
import type { ExportResult } from '../../lib/types';
import { logger } from '../../lib/logging';

const GRAPH = 'https://graph.microsoft.com/v1.0';
const SCOPES = ['Notes.Create'];

/** Export the document as a new OneNote page. Title is the first heading or file name. */
export async function exportToOneNote(markdown: string, title: string): Promise<ExportResult> {
  try {
    const token = await getToken(SCOPES);
    const body = renderHtml(parse(markdown), { allowRemoteContent: true });
    const html = `<!DOCTYPE html><html><head><title>${escapeHtml(title)}</title></head><body>${body}</body></html>`;
    const res = await fetch(`${GRAPH}/me/onenote/pages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/html' },
      body: html,
    });
    if (!res.ok) {
      return failure(`OneNote API error ${res.status}`);
    }
    const json = (await res.json()) as { links?: { oneNoteWebUrl?: { href?: string } } };
    logger.info('export.onenote.success');
    return {
      target: 'onenote',
      status: 'success',
      outputLocation: json.links?.oneNoteWebUrl?.href ?? null,
      droppedElements: [],
      message: 'Exported to OneNote.',
    };
  } catch (err) {
    return failure(String(err));
  }
}

function failure(message: string): ExportResult {
  logger.warn('export.onenote.failed');
  return {
    target: 'onenote',
    status: 'failed',
    outputLocation: null,
    droppedElements: [],
    message,
  };
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!,
  );
}
