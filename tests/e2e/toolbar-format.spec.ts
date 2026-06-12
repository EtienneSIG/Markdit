import { test, expect } from '@playwright/test';

/**
 * T034 [US2] — Format a paragraph using the toolbar only and confirm the
 * portable Markdown result, well within the 30 s task budget (SC-004).
 *
 * The editor keeps remark/rehype as the single source of truth: a toolbar action
 * mutates the TipTap document, which is serialized to standard Markdown and then
 * re-rendered. Switching to the read view therefore proves the formatting was
 * applied AND round-trips through portable Markdown (Principle I/II/IV).
 */
test('bold formatting applied via the toolbar round-trips to portable Markdown', async ({
  page,
}) => {
  const start = Date.now();
  await page.goto('/');
  await page.getByRole('button', { name: 'Edit' }).click();

  const editor = page.getByRole('textbox');
  await expect(editor).toBeVisible();

  // Replace the document content with a single known paragraph.
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Format me please');

  // Select the whole paragraph and toggle Bold from the toolbar (no shortcut).
  await page.keyboard.press('Control+A');
  await page.getByRole('toolbar', { name: 'Formatting' }).getByRole('button', { name: 'Bold' }).click();

  // Verify the result by rendering: the read view must contain a <strong>.
  await page.getByRole('button', { name: 'Read' }).click();
  const strong = page
    .getByRole('document', { name: 'Read' })
    .locator('strong', { hasText: 'Format me please' });
  await expect(strong).toBeVisible();

  expect(Date.now() - start).toBeLessThan(30000);
});

test('heading formatting applied via the toolbar renders a heading', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Edit' }).click();

  const editor = page.getByRole('textbox');
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('My section title');
  await page.keyboard.press('Control+A');
  await page
    .getByRole('toolbar', { name: 'Formatting' })
    .getByRole('button', { name: 'Heading' })
    .click();

  await page.getByRole('button', { name: 'Read' }).click();
  await expect(
    page.getByRole('heading', { name: 'My section title' }),
  ).toBeVisible();
});
