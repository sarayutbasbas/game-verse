import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/browser',
  testMatch: ['profile.spec.ts', 'dracula.spec.ts', 'calico.spec.ts', 'seven-wonders-duel.spec.ts', 'jaipur.spec.ts'],
  timeout: 240000,
  workers: 1,
  use: { baseURL: 'http://localhost:5555', headless: true },
  reporter: 'list',
});
