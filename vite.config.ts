import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version: appVersion, license: appLicense } = require('./package.json') as {
  version: string;
  license: string;
};

// Tauri expects a fixed dev port and a relative base for bundling.
export default defineConfig({
  plugins: [react()],
  base: './',
  clearScreen: false,
  define: {
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
    outDir: 'dist',
  },
});
