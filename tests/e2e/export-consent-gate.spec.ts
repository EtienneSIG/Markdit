import { test, expect, type Request } from '@playwright/test';

/**
 * T055 [US4] — A cloud export with no prior consent must not leave the device:
 * the action is blocked behind an explicit consent gate and performs zero
 * network requests (FR-011, SC-008).
 */
function isRemote(req: Request): boolean {
  const url = req.url();
  return /^https?:\/\//i.test(url) && !url.includes('localhost') && !url.includes('127.0.0.1');
}

test('selecting a cloud target with no consent gates the export and makes no requests', async ({
  page,
}) => {
  const remote: string[] = [];
  page.on('request', (req) => {
    if (isRemote(req)) remote.push(req.url());
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Export' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Switch the destination to a cloud target (OneNote).
  await dialog.getByLabel('Destination').selectOption({ label: 'Microsoft OneNote' });

  // The consent gate must appear and the Export button must be disabled until
  // consent is explicitly granted — no content may leave the device.
  await expect(dialog.getByRole('note')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Export', exact: true })).toBeDisabled();

  // Absolutely no remote requests were made by reaching this gated state.
  expect(remote).toEqual([]);
});
