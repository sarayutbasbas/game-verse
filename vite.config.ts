import { defineConfig } from "vite";

export default defineConfig({
  // Retain physical-position fallbacks: minifying to `inset` breaks older TV engines.
  build: { cssTarget: "chrome69" },
});
