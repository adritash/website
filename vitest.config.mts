import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    include: ["tests/pulse/**/*.test.ts"],
    environment: "node",
    setupFiles: ["tests/pulse/setup.ts"],
    globalSetup: ["tests/pulse/global-setup.ts"],
    // Integration and e2e tests share one Postgres database; run files serially.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
