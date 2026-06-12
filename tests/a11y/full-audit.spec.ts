import { test, expect } from '@playwright/test';
import { scanA11y } from './axe-setup';

/**
 * T073 — Full WCAG 2.2 AA audit across all primary flows (FR-013, SC-007).
 *
 * Automated axe-core scans cover the read view, the edit view + toolbar, and the
 * export dialog. Keyboard-only operability of these flows is additionally
 * asserted in `tests/a11y/editor.spec.ts` and exercised by the export E2E specs.
 */
test('read view: no WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('document', { name: 'Read' })).toBeVisible();
  expect(await scanA11y(page)).toEqual([]);
});

test('edit view: no WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.getByRole('textbox')).toBeVisible();
  expect(await scanA11y(page)).toEqual([]);
});

test('export dialog: no WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Export' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(await scanA11y(page)).toEqual([]);
});

test('export dialog is keyboard dismissible with Escape', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Export' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});
