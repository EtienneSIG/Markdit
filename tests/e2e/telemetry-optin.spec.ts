import { test, expect, type Request } from '@playwright/test';

/**
 * T070 — With telemetry disabled (the default), the app emits zero telemetry
 * requests (FR-014). Telemetry is opt-in and instantly disableable; in the
 * default build `track()` is a no-op that performs no network I/O.
 */
function isRemote(req: Request): boolean {
  const url = req.url();
  return /^https?:\/\//i.test(url) && !url.includes('localhost') && !url.includes('127.0.0.1');
}

test('no telemetry requests are emitted when telemetry is off (default)', async ({ page }) => {
  const remote: string[] = [];
  page.on('request', (req) => {
    if (isRemote(req)) remote.push(req.url());
  });

  await page.goto('/');
  await expect(page.getByRole('document', { name: 'Read' })).toBeVisible();

  // Trigger actions that would emit telemetry events if it were enabled
  // (an export event is tracked when telemetry is on).
  await page.getByRole('button', { name: 'Export' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Export', exact: true }).click();
  await expect(dialog.getByRole('status')).toBeVisible();

  expect(remote).toEqual([]);
});
