import { test, expect } from '@playwright/test';

/**
 * Remote-content gate (T018, FR-003, SC-008). With consent off (the default),
 * no network request is made for remote images referenced in a document.
 */
test('no remote requests are made when remote content is disabled', async ({ page }) => {
  const remoteRequests: string[] = [];
  page.on('request', (req) => {
    const url = req.url();
    if (/^https?:\/\//.test(url) && !url.startsWith('http://localhost')) {
      remoteRequests.push(url);
    }
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Read' })).toBeVisible();
  // The default sample document renders without fetching anything remote.
  expect(remoteRequests).toEqual([]);
});
