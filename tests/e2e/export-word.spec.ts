import { test, expect, type Request } from '@playwright/test';

/**
 * T054 [US4] — Word export performs no network access (FR-009, SC-006).
 *
 * The `.docx` bytes are generated entirely in-process by the `docx` library and
 * written to disk by the Rust core; nothing leaves the device. Validity of the
 * produced `.docx` bytes (PK signature + dropped-element reporting) is asserted
 * in the unit test `tests/unit/docx-export.test.ts`. This E2E focuses on the
 * offline guarantee for the full export flow in the app.
 */
function isRemote(req: Request): boolean {
  const url = req.url();
  return /^https?:\/\//i.test(url) && !url.includes('localhost') && !url.includes('127.0.0.1');
}

test('exporting to Word triggers zero remote network requests', async ({ page }) => {
  const remote: string[] = [];
  page.on('request', (req) => {
    if (isRemote(req)) remote.push(req.url());
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Export' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Word is the default target; run the export.
  await expect(dialog.getByLabel('Destination')).toHaveValue('word');
  await dialog.getByRole('button', { name: 'Export', exact: true }).click();

  // A status is reported (success in the packaged app; failed-to-save in the
  // web harness because no OS file system is attached) — either way no network.
  await expect(dialog.getByRole('status')).toBeVisible();
  expect(remote).toEqual([]);
});
