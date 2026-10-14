import { defineConfig } from "@playwright/test";
const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
export default defineConfig({
  testDir: "tests/browser",
  timeout: 180000,
  workers: 1,
  use: { baseURL: `http://127.0.0.1:${port}`, headless: true },
  webServer: {
    command: `GAMEVERSE_JOIN_ORIGIN= GOOGLE_CLIENT_ID= GOOGLE_CLIENT_SECRET= PORT=${port} BETTER_AUTH_URL=http://127.0.0.1:${port} GAMEVERSE_DB_PATH=./data/e2e-gameverse.sqlite BETTER_AUTH_SECRET=local-browser-test-secret-at-least-32-chars NODE_ENV=production npm start`,
    url: `http://127.0.0.1:${port}/health`,
    reuseExistingServer: false,
  },
  reporter: "list",
});
