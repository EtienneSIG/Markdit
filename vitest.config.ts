import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify('0.0.0-test'),
    __APP_LICENSE__: JSON.stringify('MIT'),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    // E2E (Playwright) and a11y live outside the Vitest scope.
    include: ['tests/unit/**/*.test.ts', 'tests/corpus/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/markdown/**', 'src/privacy/**', 'src/lib/**'],
    },
  },
});
