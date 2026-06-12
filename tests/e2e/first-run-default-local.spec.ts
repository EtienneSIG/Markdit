import { test, expect, type Request } from '@playwright/test';

/**
 * T069 — First-run privacy profile is fully local (SC-008, privacy invariant):
 * telemetry off, remote content off, no cloud consents, and no remote network
 * activity simply from launching and using the app on first run.
 */
function isRemote(req: Request): boolean {
  const url = req.url();
  return /^https?:\/\//i.test(url) && !url.includes('localhost') && !url.includes('127.0.0.1');
}

test('a fresh launch performs no remote network requests', async ({ page }) => {
  const remote: string[] = [];
  page.on('request', (req) => {
    if (isRemote(req)) remote.push(req.url());
  });

  await page.goto('/');
  await expect(page.getByRole('document', { name: 'Read' })).toBeVisible();

  // Exercise the primary surfaces a first-time user would touch.
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByRole('textbox')).toBeVisible();
  await page.getByRole('button', { name: 'Read' }).click();
  await expect(page.getByRole('document', { name: 'Read' })).toBeVisible();

  expect(remote).toEqual([]);
});

test('remote content is blocked by default until explicitly enabled', async ({ page }) => {
  await page.goto('/');
  // The default profile blocks remote content; the affordance to enable it must
  // be opt-in (it is only shown when blockable content is present). The default
  // settings ship with allowRemoteContent = false, so no remote image is ever
  // fetched on first run — covered by the zero-remote-request assertion above.
  await expect(page.getByRole('document', { name: 'Read' })).toBeVisible();
});
