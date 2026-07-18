import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    coverage: {
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.d.ts", "src/core/types.ts"],
      thresholds: {
        statements: 90,
        branches: 70,
        functions: 85,
        lines: 90,
      },
    },
  },
});
