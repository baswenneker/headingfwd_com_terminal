import { type FullConfig } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Global teardown for Playwright tests
 * Runs once after all tests complete
 */
async function globalTeardown(config: FullConfig) {
  console.log("🧹 Running global test teardown...");

  // The dev server will be automatically stopped by Playwright's webServer config

  // Clean up the test database file named by DATABASE_URL (loaded from
  // .env.test by the config). The guard mirrors global-setup: never delete
  // anything that is not the test database.
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (!dbUrl.startsWith("file:") || !dbUrl.includes("test.db")) {
    console.warn(`⚠️  Skipping database cleanup for ${dbUrl}`);
  } else {
    const testDbPath = path.resolve(
      __dirname,
      "..",
      dbUrl.slice("file:".length),
    );
    try {
      for (const file of [
        testDbPath,
        `${testDbPath}-wal`,
        `${testDbPath}-shm`,
      ]) {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      }
      console.log("✅ Test database cleaned up");
    } catch (error) {
      console.warn("⚠️  Could not delete test database:", error);
    }
  }

  console.log("✅ Global teardown complete");
}

export default globalTeardown;
