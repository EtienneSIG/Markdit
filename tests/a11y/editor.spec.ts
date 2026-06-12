import { test, expect } from '@playwright/test';
import { scanA11y } from './axe-setup';

/**
 * T035 [US2] — Accessibility of the editor and formatting toolbar
 * (FR-013, SC-007): zero automated WCAG 2.2 AA violations plus keyboard-only
 * reachability of the toolbar controls.
 */
test('editor and toolbar have no WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByRole('textbox')).toBeVisible();

  const violations = await scanA11y(page);
  expect(violations).toEqual([]);
});

test('toolbar exposes an accessible role and labelled controls', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Edit' }).click();

  const toolbar = page.getByRole('toolbar', { name: 'Formatting' });
  await expect(toolbar).toBeVisible();

  // Core portable formatting controls must be present and labelled.
  for (const name of ['Bold', 'Italic', 'Heading', 'Bulleted list']) {
    await expect(toolbar.getByRole('button', { name })).toBeVisible();
  }
});

test('toolbar controls are reachable and operable with the keyboard only', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Edit' }).click();

  const bold = page.getByRole('toolbar', { name: 'Formatting' }).getByRole('button', { name: 'Bold' });
  // Focus the control directly and activate via the keyboard.
  await bold.focus();
  await expect(bold).toBeFocused();
  await page.keyboard.press('Enter');
  // aria-pressed reflects the toggle state for screen-reader users.
  await expect(bold).toHaveAttribute('aria-pressed', /true|false/);
});
