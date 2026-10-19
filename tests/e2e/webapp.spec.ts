import { test, expect } from '@playwright/test';

test('web app opens local files, edits, navigates and downloads without uploading documents', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'showOpenFilePicker', { value: undefined });
    Object.defineProperty(window, 'showDirectoryPicker', { value: undefined });
  });
  const outgoing: string[] = [];
  const origin = new URL(test.info().project.use.baseURL ?? 'http://localhost:1420').origin;
  page.on('request', (request) => {
    if (
      !['GET', 'HEAD'].includes(request.method()) ||
      new URL(request.url()).origin !== origin ||
      request.url().endsWith('/private-image.png')
    ) {
      outgoing.push(request.url());
    }
  });
  const response = await page.goto('/');
  await expect(page.getByText('Web · Local documents', { exact: true })).toBeVisible();
  if (test.info().config.configFile?.endsWith('playwright.web.config.ts')) {
    expect(response?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  }

  const markdown =
    '# Private note\n\n## Section\n\nLocal content.\n\n' +
    '![remote](https://example.invalid/tracker.png)\n\n![local](private-image.png)\n\n' +
    '<script>window.compromised = true</script>\n\n' +
    '[unsafe](javascript:alert(1))\n\n```js\nconst safe = true;\n```\n\n' +
    '```mermaid\ngraph TD\n  A --> B\n```\n';
  await page.locator('input[type=file]').setInputFiles({
    name: 'private.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from(markdown),
  });
  const reader = page.getByRole('document', { name: 'Read' });
  await expect(reader.getByRole('heading', { name: 'Private note' })).toBeVisible();
  await expect(reader.locator('pre.shiki')).toBeVisible();
  await expect(reader.locator('.markdit-mermaid svg')).toBeVisible();
  await expect(reader.locator('script, a[href^="javascript:"]')).toHaveCount(0);
  await expect(reader.locator('img[src]')).toHaveCount(0);
  const toc = page.getByRole('complementary', { name: 'Table of contents' });
  await toc.getByRole('button', { name: 'Section', exact: true }).click();
  await expect(reader.getByRole('heading', { name: 'Section', exact: true })).toBeFocused();
  expect(outgoing).toEqual([]);

  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  const editor = page.getByRole('textbox');
  await expect(editor.locator('img:not(.ProseMirror-separator)')).toHaveCount(2);
  await expect(editor.locator('img[src]')).toHaveCount(0);
  expect(outgoing).toEqual([]);
  await editor.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Edited locally');
  await page.getByRole('button', { name: 'Read', exact: true }).click();
  await expect(reader).toContainText('Edited locally');
  await expect(toc).toHaveCount(0);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download (.md)', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('private.md');
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).toString('utf8')).toContain('Edited locally');
  expect(outgoing).toEqual([]);
});

test('remote image consent applies in both views without rewriting image URLs', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'showOpenFilePicker', { value: undefined });
  });
  let imageRequests = 0;
  await page.route('https://example.invalid/consented.png', async (route) => {
    imageRequests++;
    await route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf9kAAAAASUVORK5CYII=',
        'base64',
      ),
    });
  });
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({
    name: 'images.md',
    mimeType: 'text/markdown',
    buffer: Buffer.from('# Images\n\n![test](https://example.invalid/consented.png)\n'),
  });
  await expect(page.getByRole('document').locator('img')).not.toHaveAttribute('src');
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(
    page.getByRole('textbox').getByRole('img', { name: 'test', exact: true }),
  ).not.toHaveAttribute('src');
  expect(imageRequests).toBe(0);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download (.md)', exact: true }).click();
  const stream = await (await downloadPromise).createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).toString('utf8')).toContain('https://example.invalid/consented.png');
  await page.getByRole('button', { name: 'Enable remote content', exact: true }).click();
  await expect(
    page.getByRole('textbox').getByRole('img', { name: 'test', exact: true }),
  ).toHaveAttribute('src', 'https://example.invalid/consented.png');
  await expect.poll(() => imageRequests).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Read', exact: true }).click();
  await expect(page.getByRole('document').locator('img')).toHaveAttribute(
    'src',
    'https://example.invalid/consented.png',
  );
});

test('production policy blocks inline scripts while allowing editor and slide preview', async ({
  page,
}) => {
  test.skip(
    !test.info().config.configFile?.endsWith('playwright.web.config.ts'),
    'Production policy only',
  );
  await page.addInitScript(() => {
    const invoke = () => {
      document.documentElement.dataset.desktopCall = 'yes';
      throw new Error('The web build must not invoke a native bridge');
    };
    Object.defineProperty(window, '__TAURI_INTERNALS__', { value: { invoke } });
    Object.defineProperty(window, '__TAURI__', { value: { core: { invoke } } });
  });
  await page.goto('/');
  await expect(page.getByText('Web · Local documents', { exact: true })).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-desktop-call');
  const inlineBlocked = await page.evaluate(
    () =>
      new Promise<boolean>((resolve) => {
        document.addEventListener(
          'securitypolicyviolation',
          (event) => {
            if (event.violatedDirective === 'script-src-elem') resolve(true);
          },
          { once: true },
        );
        const script = document.createElement('script');
        script.textContent = 'document.documentElement.dataset.injected = "yes"';
        document.body.appendChild(script);
        setTimeout(() => resolve(false), 1000);
      }),
  );
  expect(inlineBlocked).toBe(true);
  await expect(page.locator('html')).not.toHaveAttribute('data-injected');

  await page.getByRole('button', { name: 'Slides', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const preview = page.frameLocator('iframe[title="Slide preview"]');
  await expect(preview.locator('section').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export HTML', exact: true })).toBeEnabled();
});
