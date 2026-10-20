import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/browser',
  testMatch: ['creator-player.spec.ts', 'harmonies-leaderboard.spec.ts', 'room-restart.spec.ts', 'game-learning.spec.ts', 'take-time.spec.ts', 'locus.spec.ts', 'name-it.spec.ts', 'critter-kitchen.spec.ts', 'critter-kitchen-expansions.spec.ts', 'sky-team.spec.ts', 'harmonies.spec.ts', 'harmonies-expansions.spec.ts', 'pixies.spec.ts', 'profile.spec.ts', 'dracula.spec.ts', 'calico.spec.ts', 'seven-wonders-duel.spec.ts', 'jaipur.spec.ts'],
  timeout: 240000,
  workers: 1,
  use: { baseURL: 'http://localhost:5555', headless: true },
  reporter: 'list',
});
