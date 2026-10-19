import { test, expect } from '@playwright/test';

test('Open directly selects files without an intermediate menu', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'showOpenFilePicker', { value: undefined });
  });
  await page.goto('/');
  const sidebar = page.getByRole('navigation', { name: 'File navigation' });
  const chooserPromise = page.waitForEvent('filechooser');
  await sidebar.getByRole('button', { name: 'Open', exact: true }).click();
  await (
    await chooserPromise
  ).setFiles({
    name: 'local.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from('# Local file'),
  });
  await expect(page.getByRole('heading', { name: 'Local file', exact: true })).toBeVisible();
  await expect(sidebar.getByRole('button', { name: 'Open folder', exact: true })).toHaveCount(0);
});

for (const modern of [false, true]) {
  test(`one drop opens a file and a nested folder (${modern ? 'writable handles' : 'read-only entries'})`, async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(
      ({ modern }) => {
        const transfer = new DataTransfer();
        const file = new File(['# Loose document'], 'loose.md', { type: 'text/markdown' });
        const nestedFile = new File(['# Nested document'], 'nested.md', { type: 'text/markdown' });
        const looseItem = transfer.items.add(file);
        const folderItem = transfer.items.add(new File([], 'Notes'));
        const fileHandle = (file: File) => ({
          kind: 'file',
          name: file.name,
          getFile: async () => file,
        });
        const nestedHandle = {
          kind: 'directory',
          name: 'Subfolder',
          async *values() {
            yield fileHandle(nestedFile);
          },
        };
        const folderHandle = {
          kind: 'directory',
          name: 'Notes',
          async *values() {
            yield nestedHandle;
          },
        };
        const fileEntry = (file: File) => ({
          isFile: true,
          isDirectory: false,
          name: file.name,
          file: (resolve: (value: File) => void) => resolve(file),
        });
        const nestedEntry = {
          isFile: false,
          isDirectory: true,
          name: 'Subfolder',
          createReader() {
            let read = false;
            return {
              readEntries(resolve: (value: object[]) => void) {
                resolve(read ? [] : [fileEntry(nestedFile)]);
                read = true;
              },
            };
          },
        };
        const folderEntry = {
          isFile: false,
          isDirectory: true,
          name: 'Notes',
          createReader() {
            let batch = 0;
            return {
              readEntries(resolve: (value: object[]) => void) {
                // The Markdown entry is deliberately in the second batch.
                resolve(
                  batch++ === 0
                    ? [fileEntry(new File([], 'ignored.txt'))]
                    : batch === 2
                      ? [nestedEntry]
                      : [],
                );
              },
            };
          },
        };
        for (const [item, handle, entry] of [
          [looseItem, fileHandle(file), fileEntry(file)],
          [folderItem, folderHandle, folderEntry],
        ] as const) {
          Object.defineProperty(item, 'getAsFileSystemHandle', {
            value: modern ? async () => handle : undefined,
          });
          Object.defineProperty(item, 'webkitGetAsEntry', { value: () => entry });
        }
        Object.defineProperty(transfer, 'items', { value: [looseItem, folderItem] });
        document
          .querySelector('.markdit-sidebar')!
          .dispatchEvent(
            new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }),
          );
      },
      { modern },
    );
    const sidebar = page.getByRole('navigation', { name: 'File navigation' });
    await expect(page.getByRole('heading', { name: 'Loose document', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('button', { name: 'nested.md', exact: true })).toBeVisible();
    await expect(sidebar.getByRole('button', { name: 'ignored.txt', exact: true })).toHaveCount(0);
    await sidebar.getByRole('button', { name: 'nested.md', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Nested document', exact: true })).toBeVisible();
  });
}

test('invalid drops display an explicit message', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const transfer = new DataTransfer();
    const item = transfer.items.add(new File(['text'], 'unsupported.txt'));
    Object.defineProperty(item, 'getAsFileSystemHandle', { value: undefined });
    Object.defineProperty(item, 'webkitGetAsEntry', { value: () => null });
    document
      .querySelector('.markdit-sidebar')!
      .dispatchEvent(
        new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }),
      );
  });
  await expect(page.getByRole('alert')).toHaveText('No Markdown files found in this drop.');
});
