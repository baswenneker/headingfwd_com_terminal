import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Unit layer. Runs in Node, no browser; the end-to-end suite stays in
 * Playwright (`pnpm test:e2e`). `tests/unit/setup.ts` puts the dummy
 * environment in place before any module imports `~/env` or `~/server/db`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
    setupFiles: ["tests/unit/setup.ts"],
    // Each file gets its own module registry, so an in-memory database opened
    // by `~/server/db` in one file never leaks into the next.
    isolate: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text", "html"],
    },
  },
});
