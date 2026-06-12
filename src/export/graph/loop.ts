/**
 * Microsoft Loop export via Microsoft Graph (US4, cloud). Creates a `.loop`
 * (Fluid) page as a file in the user's OneDrive using the least-privilege
 * `Files.ReadWrite` scope. Requires prior, recorded consent.
 *
 * Loop's component API surface is still evolving; this uploads a portable
 * `.loop` document seeded from the rendered HTML so content is never lost.
 */
import { parse } from '../../markdown/parse';
import { renderHtml } from '../../markdown/render';
import { getToken } from './auth';
import type { ExportResult } from '../../lib/types';
import { logger } from '../../lib/logging';

const GRAPH = 'https://graph.microsoft.com/v1.0';
const SCOPES = ['Files.ReadWrite'];

/** Export the document to the user's OneDrive as a Loop-compatible page. */
export async function exportToLoop(markdown: string, fileName: string): Promise<ExportResult> {
  try {
    const token = await getToken(SCOPES);
    const html = renderHtml(parse(markdown), { allowRemoteContent: true });
    const safeName = fileName.replace(/[^\w.-]+/g, '_').replace(/\.md$/i, '') + '.loop';
    const res = await fetch(
      `${GRAPH}/me/drive/root:/Markdit/${encodeURIComponent(safeName)}:/content`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/html' },
        body: html,
      },
    );
    if (!res.ok) {
      return failure(`Loop/OneDrive API error ${res.status}`);
    }
    const json = (await res.json()) as { webUrl?: string };
    logger.info('export.loop.success');
    return {
      target: 'loop',
      status: 'success',
      outputLocation: json.webUrl ?? null,
      droppedElements: [],
      message: 'Exported to Loop.',
    };
  } catch (err) {
    return failure(String(err));
  }
}

function failure(message: string): ExportResult {
  logger.warn('export.loop.failed');
  return { target: 'loop', status: 'failed', outputLocation: null, droppedElements: [], message };
}
