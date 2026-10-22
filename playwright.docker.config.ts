import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/browser',
  testMatch: ['critter-kitchen-serving.spec.ts', 'lobby-kick.spec.ts', 'harmonies-original.spec.ts', 'harmonies-card-library.spec.ts', 'harmonies-crescendo.spec.ts', 'harmonies-view-menu.spec.ts', 'harmonies-board-interactions.spec.ts', 'harmonies-animal-layers.spec.ts', 'harmonies-card-art.spec.ts', 'harmonies-promo.spec.ts', 'harmonies-lobby.spec.ts', 'harmonies-loading.spec.ts', 'harmonies-layout.spec.ts', 'harmonies-token-tray.spec.ts', 'harmonies-performance.spec.ts', 'harmonies-finished.spec.ts', 'harmonies-scoring.spec.ts', 'creator-player.spec.ts', 'harmonies-leaderboard.spec.ts', 'room-restart.spec.ts', 'game-learning.spec.ts', 'take-time.spec.ts', 'locus.spec.ts', 'name-it.spec.ts', 'critter-kitchen.spec.ts', 'critter-kitchen-expansions.spec.ts', 'sky-team.spec.ts', 'harmonies.spec.ts', 'harmonies-expansions.spec.ts', 'pixies.spec.ts', 'profile.spec.ts', 'dracula.spec.ts', 'calico.spec.ts', 'seven-wonders-duel.spec.ts', 'jaipur.spec.ts'],
  timeout: 240000,
  workers: 1,
  use: { baseURL: 'http://localhost:5555', headless: true },
  reporter: 'list',
});
