import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createWebServer } from '../../scripts/serve-web.mjs';
import { webSecurityHeaders } from '../../scripts/web-security.mjs';

let temporary;
let server;
let port;

before(async () => {
  temporary = await mkdtemp(join(tmpdir(), 'markdit-web-test-'));
  const root = join(temporary, 'public');
  await mkdir(root);
  await writeFile(join(root, 'index.html'), '<!doctype html><title>Markdit</title>');
  await writeFile(join(root, 'app.js'), 'console.log("app")');
  await writeFile(join(temporary, 'secret.html'), 'PRIVATE');
  await writeFile(join(root, '.env'), 'SECRET=value');
  await writeFile(join(root, 'source.map'), 'source');
  server = await createWebServer({ root });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = server.address().port;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (temporary) await rm(temporary, { recursive: true, force: true });
});

function request(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path, method }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('serves the app with restrictive browser headers and no cookies', async () => {
  const result = await request('/');
  assert.equal(result.status, 200);
  assert.match(result.body, /Markdit/);
  assert.match(result.headers['content-type'], /^text\/html/);
  assert.equal(result.headers['x-content-type-options'], 'nosniff');
  assert.equal(result.headers['referrer-policy'], 'no-referrer');
  assert.equal(result.headers['x-frame-options'], 'DENY');
  assert.equal(result.headers['cache-control'], 'no-store');
  assert.equal(result.headers['set-cookie'], undefined);
  const policy = result.headers['content-security-policy'];
  assert.match(policy, /script-src 'self' 'wasm-unsafe-eval'/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /form-action 'none'/);
  assert.match(policy, /connect-src 'self'/);
  assert.doesNotMatch(policy, /'unsafe-eval'/);
  assert.equal(result.headers['strict-transport-security'], undefined);
  assert.equal(webSecurityHeaders(true)['Strict-Transport-Security'], 'max-age=31536000');
});

test('HEAD returns headers without a body and scripts have a JavaScript MIME type', async () => {
  const head = await request('/', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(head.body, '');
  const script = await request('/app.js');
  assert.equal(script.status, 200);
  assert.match(script.headers['content-type'], /^text\/javascript/);
});

test('rejects uploads and unsupported methods', async () => {
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) {
    const result = await request('/', method);
    assert.equal(result.status, 405);
    assert.equal(result.headers.allow, 'GET, HEAD');
  }
});

test('does not expose traversal paths, hidden files, source maps, or malformed URLs', async () => {
  for (const path of [
    '/../secret.html',
    '/%2e%2e/secret.html',
    '/..%5csecret.html',
    '/%2eenv',
    '/source.map',
    '/C:/secret.html',
    '/%00.html',
    '/missing.html',
  ]) {
    const result = await request(path);
    assert.equal(result.status, 404, path);
    assert.doesNotMatch(result.body, /PRIVATE|SECRET=value/);
    assert.equal(result.headers['x-content-type-options'], 'nosniff');
  }
  assert.equal((await request('/%zz')).status, 400);
});

test('does not follow directory symlinks outside the public directory', async () => {
  const outside = join(temporary, 'outside');
  await mkdir(outside);
  await writeFile(join(outside, 'private.html'), 'PRIVATE');
  await symlink(outside, join(temporary, 'public', 'linked'), 'junction');
  const result = await request('/linked/private.html');
  assert.equal(result.status, 404);
  assert.doesNotMatch(result.body, /PRIVATE/);
});

test('refuses non-loopback HTTP and incomplete TLS configuration at startup', () => {
  for (const extra of [
    { HOST: '0.0.0.0' },
    { HOST: '127.0.0.1', MARKDIT_TLS_CERT: 'certificate.pem' },
    { HOST: '127.0.0.1', PORT: 'invalid' },
  ]) {
    const result = spawnSync(process.execPath, ['scripts/serve-web.mjs'], {
      encoding: 'utf8',
      env: { ...process.env, MARKDIT_TLS_CERT: '', MARKDIT_TLS_KEY: '', ...extra },
      timeout: 10_000,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Unable to start Markdit Web/);
  }
});
