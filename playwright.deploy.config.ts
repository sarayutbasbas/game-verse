import {defineConfig} from '@playwright/test';
if(!process.env.GAMEVERSE_E2E_URL || !process.env.GAMEVERSE_E2E_DATABASE_URL) throw Error('Explicit deployment URL and fixture database are required');
export default defineConfig({
  testDir:'tests/browser',
  testMatch:['azul.spec.ts','dracula.spec.ts','game.spec.ts'],
  timeout:300000,
  workers:1,
  use:{baseURL:process.env.GAMEVERSE_E2E_URL,headless:true,actionTimeout:15000},
  reporter:'list',
});
