import { test, expect } from '@playwright/test';
import { scanA11y } from './axe-setup';

/**
 * Accessibility scan of the reader/render view (T021, WCAG 2.2 AA, FR-013).
 */
test('reader view has no WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Read' })).toBeVisible();
  const violations = await scanA11y(page);
  expect(violations).toEqual([]);
});
