import { test, expect } from '@playwright/test';

test('right-hand table of contents follows edits and navigates without changing the document', async ({
  page,
}) => {
  await page.goto('/');
  const toc = page.getByRole('complementary', { name: 'Table of contents' });
  await expect(toc.getByRole('button', { name: 'Welcome to Markdit' })).toBeVisible();

  const mainBounds = await page.locator('main').boundingBox();
  const tocBounds = await toc.boundingBox();
  expect(tocBounds!.x).toBeGreaterThanOrEqual(mainBounds!.x + mainBounds!.width - 1);

  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const editor = page.getByRole('textbox');
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('First section');
  await page.keyboard.press('Control+Alt+1');
  await page.keyboard.press('Enter');
  await page.keyboard.insertText('Body text. '.repeat(1000));
  await page.keyboard.press('Enter');
  await page.keyboard.type('Last section');
  await page.keyboard.press('Control+Alt+2');
  await expect(toc.getByRole('button', { name: 'Last section' })).toBeVisible();
  await expect(toc.getByRole('button', { name: 'Welcome to Markdit' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Read', exact: true }).click();
  const reader = page.getByRole('document', { name: 'Read' });
  const before = await reader.textContent();
  await toc.getByRole('button', { name: 'First section' }).click();
  await expect(reader.getByRole('heading', { name: 'First section' })).toBeFocused();
  await toc.getByRole('button', { name: 'Last section' }).focus();
  await page.keyboard.press('Enter');
  await expect(reader.getByRole('heading', { name: 'Last section' })).toBeInViewport();
  await expect(reader.getByRole('heading', { name: 'Last section' })).toBeFocused();
  expect(await reader.textContent()).toBe(before);

  const toggle = toc.getByRole('button', { name: 'Toggle table of contents' });
  await toggle.click();
  await expect(toc.getByRole('navigation')).toBeHidden();
  await toggle.click();
  await expect(toc.getByRole('navigation')).toBeVisible();

  await page.getByRole('button', { name: 'Switch to French' }).click();
  await expect(page.getByRole('navigation', { name: 'Table des matières' })).toBeVisible();
});
