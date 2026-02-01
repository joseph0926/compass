import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/*.d.ts"],
      thresholds: {
        "src/core/**": { lines: 80 },
      },
    },
    restoreMocks: true,
    pool: "threads",
    reporters: process.env.CI ? ["json", "github-actions"] : ["default"],
  },
});
