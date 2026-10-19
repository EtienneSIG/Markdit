import http from 'node:http';
import https from 'node:https';
import { readFile, realpath } from 'node:fs/promises';
import { extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webSecurityHeaders } from './web-security.mjs';

const defaultRoot = fileURLToPath(new URL('../dist-web/', import.meta.url));
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
};

export async function createWebServer({ root = defaultRoot, tls } = {}) {
  const directory = await realpath(root);
  const handler = async (request, response) => {
    const headers = webSecurityHeaders(Boolean(tls));
    const send = (status, body, type = 'text/plain; charset=utf-8') => {
      response.writeHead(status, { ...headers, 'Content-Type': type });
      response.end(request.method === 'HEAD' ? undefined : body);
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.setHeader('Allow', 'GET, HEAD');
      send(405, 'Method not allowed');
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent((request.url ?? '/').split('?')[0]);
    } catch {
      send(400, 'Invalid URL');
      return;
    }
    // Reject Windows paths as well as URL traversal, including encoded forms.
    if (
      !pathname.startsWith('/') ||
      pathname.includes('\\') ||
      /[\u0000-\u001f:]/.test(pathname) ||
      pathname.split('/').some((part) => part.startsWith('.'))
    ) {
      send(404, 'Not found');
      return;
    }
    const name = pathname === '/' ? 'index.html' : pathname.slice(1);
    const type = contentTypes[extname(name)];
    if (!type) {
      send(404, 'Not found');
      return;
    }
    try {
      const path = await realpath(resolve(directory, name));
      const within = relative(directory, path);
      if (within === '..' || within.startsWith(`..${sep}`) || isAbsolute(within)) {
        send(404, 'Not found');
        return;
      }
      const body = await readFile(path);
      send(200, body, type);
    } catch (error) {
      if (['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code)) {
        send(404, 'Not found');
      } else {
        console.error('Static asset read failed:', error.code ?? 'UNKNOWN');
        send(500, 'Unable to load application');
      }
    }
  };
  const server = tls ? https.createServer(tls, handler) : http.createServer(handler);
  server.requestTimeout = 15_000;
  server.headersTimeout = 10_000;
  server.maxHeadersCount = 40;
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const host = process.env.HOST ?? '127.0.0.1';
    const port = Number(process.env.PORT ?? 1421);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('PORT must be an integer between 1 and 65535.');
    }
    const certPath = process.env.MARKDIT_TLS_CERT;
    const keyPath = process.env.MARKDIT_TLS_KEY;
    if (Boolean(certPath) !== Boolean(keyPath)) {
      throw new Error('Set both MARKDIT_TLS_CERT and MARKDIT_TLS_KEY.');
    }
    const tls =
      certPath && keyPath
        ? { cert: await readFile(certPath), key: await readFile(keyPath), minVersion: 'TLSv1.2' }
        : undefined;
    if (!tls && !['127.0.0.1', '::1', 'localhost'].includes(host)) {
      throw new Error('Non-loopback hosting requires a TLS certificate and key.');
    }
    const server = await createWebServer({ tls });
    server.on('error', (error) => {
      console.error('Markdit web server failed:', error.message);
      process.exitCode = 1;
    });
    server.listen(port, host, () => {
      const address = host.includes(':') ? `[${host}]` : host;
      console.log(`Markdit Web: ${tls ? 'https' : 'http'}://${address}:${port}`);
    });
  } catch (error) {
    console.error('Unable to start Markdit Web:', error.message);
    process.exitCode = 1;
  }
}
