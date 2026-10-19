import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { createRequire } from 'node:module';
import { webContentSecurityPolicy, webSecurityHeaders } from './scripts/web-security.mjs';

const require = createRequire(import.meta.url);
const { version: appVersion, license: appLicense } = require('./package.json') as {
  version: string;
  license: string;
};

// Tauri expects a fixed dev port and a relative base for bundling.
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'web'
      ? [
          {
            name: 'markdit-web-policy',
            generateBundle() {
              this.emitFile({
                type: 'asset',
                fileName: 'staticwebapp.config.json',
                source: JSON.stringify(
                  {
                    globalHeaders: webSecurityHeaders(true),
                    mimeTypes: { '.wasm': 'application/wasm' },
                  },
                  null,
                  2,
                ),
              });
            },
            transformIndexHtml(html: string) {
              return html.replace(
                /(<meta http-equiv="Content-Security-Policy" content=")[^"]*(" \/>)/,
                `$1${webContentSecurityPolicy}$2`,
              );
            },
          },
        ]
      : []),
  ],
  base: './',
  clearScreen: false,
  define: {
    __MARKDIT_WEB__: JSON.stringify(mode === 'web'),
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_LICENSE__: JSON.stringify(appLicense),
  },
  server: {
    port: 1420,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    outDir: mode === 'web' ? 'dist-web' : 'dist',
  },
}));
