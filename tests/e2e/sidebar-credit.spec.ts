import { test, expect } from '@playwright/test';

test('sidebar credits the designer and links safely to the repository with or without files', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'showOpenFilePicker', { value: undefined });
  });
  await page.goto('/');
  const credit = page.locator('.markdit-sidebar-body').getByRole('link', {
    name: 'design by Etienne SIGWALD',
  });
  await expect(credit).toBeVisible();
  await expect(credit).toHaveAttribute('href', 'https://github.com/EtienneSIG/Markdit');
  await expect(credit).toHaveAttribute('target', '_blank');
  await expect(credit).toHaveAttribute('rel', 'noopener noreferrer');
  await page.locator('input[type=file]').setInputFiles({
    name: 'example.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from('# Example'),
  });
  await expect(page.getByRole('tree')).toBeVisible();
  await expect(credit).toBeVisible();
});
