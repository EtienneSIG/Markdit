import { defineConfig } from '@playwright/test';
import base from './playwright.config';

export default defineConfig(base, {
  testMatch: ['e2e/webapp.spec.ts'],
  use: {
    ...base.use,
    baseURL: 'http://127.0.0.1:1422',
  },
  webServer: {
    command: 'npm run start:web',
    url: 'http://127.0.0.1:1422',
    env: { HOST: '127.0.0.1', PORT: '1422', MARKDIT_TLS_CERT: '', MARKDIT_TLS_KEY: '' },
    reuseExistingServer: false,
  },
});
