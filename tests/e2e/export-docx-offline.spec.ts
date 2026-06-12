import { test, expect, type Request } from '@playwright/test';

/**
 * T057 [US4] — The `export_docx` path never opens a network socket (FR-009).
 *
 * This complements `export-word.spec.ts` by asserting the offline invariant
 * across the entire interaction window: from opening the export dialog through
 * generating the document, no socket to a remote host is ever opened. The
 * generation is fully in-process (the `docx` lib) and the bytes are handed to
 * the Rust core for a local file write.
 */
function isRemote(req: Request): boolean {
  const url = req.url();
  return /^https?:\/\//i.test(url) && !url.includes('localhost') && !url.includes('127.0.0.1');
}

test('the docx export interaction opens no remote sockets', async ({ page }) => {
  const remote: string[] = [];
  const sockets: string[] = [];
  page.on('request', (req) => {
    if (isRemote(req)) remote.push(req.url());
  });
  // `requestfinished`/`requestfailed` also surface any attempted connections.
  page.on('requestfailed', (req) => {
    if (isRemote(req)) sockets.push(req.url());
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Export' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await expect(dialog.getByLabel('Destination')).toHaveValue('word');
  await dialog.getByRole('button', { name: 'Export', exact: true }).click();
  await expect(dialog.getByRole('status')).toBeVisible();

  expect(remote).toEqual([]);
  expect(sockets).toEqual([]);
});
