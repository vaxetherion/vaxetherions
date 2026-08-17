// playwright.config.js
// Konfigurasi suite E2E profil GitHub.
// Suite ini hanya memakai fixture `request` (tanpa browser), sehingga
// tidak memerlukan `npx playwright install`.

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: true,
  reporter: 'list',
});
