import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["packages/**/src/**/*.test.ts", "packages/**/tests/**/*.test.ts"],
  },
});
