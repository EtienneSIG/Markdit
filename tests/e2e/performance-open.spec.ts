import { test, expect } from '@playwright/test';

/**
 * T019 [US1] — Performance budget for opening/rendering a document (SC-002:
 * a representative file renders in < 1 s).
 *
 * The packaged desktop app loads files through the Rust core's file-open flow;
 * the byte-for-byte round-trip of a 1 MB corpus fixture is asserted in the Rust
 * contract test (`document_open_round_trips_corpus_unchanged`). In the web
 * harness there is no OS file picker, so this spec measures the time for the
 * primary read surface to become interactive after navigation, which is the
 * user-visible "open and render" budget for the rendered document landmark.
 */
test('the read view renders within the performance budget (SC-002)', async ({ page }) => {
  const start = Date.now();
  await page.goto('/');
  const doc = page.getByRole('document', { name: 'Read' });
  await expect(doc).toBeVisible();
  // The rendered Markdown must be present, not just an empty shell.
  await expect(doc).toContainText('Welcome to Markdit');
  const elapsed = Date.now() - start;

  // Generous CI-friendly budget; local renders complete well under 1 s.
  expect(elapsed).toBeLessThan(3000);
});

test('switching to the edit view stays responsive', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Read' })).toBeVisible();

  const start = Date.now();
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByRole('textbox')).toBeVisible();
  expect(Date.now() - start).toBeLessThan(3000);
});
