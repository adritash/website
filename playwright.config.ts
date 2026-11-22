import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  // Pulse unit/integration tests are Vitest files (*.test.ts) and must not run here.
  testMatch: "**/*.spec.ts",
  timeout: 30_000,
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:3000" },
  webServer: process.env.BASE_URL
    ? undefined
    : { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true },
});
