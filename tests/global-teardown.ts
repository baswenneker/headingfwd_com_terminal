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

  // Clean up the test database file. Derived from DATABASE_URL the same way
  // playwright.config.ts resolves it before starting the webServer — the
  // path is not the fixed `<root>/test.db` it used to be (that stopped
  // matching the moment .env.test moved the DB to ./tmp/db/test.db, so this
  // cleanup silently never ran).
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (dbUrl.startsWith("file:")) {
    const testDbPath = path.resolve(__dirname, "..", dbUrl.slice(5));
    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
        console.log("✅ Test database cleaned up");
      }
    } catch (error) {
      console.warn("⚠️  Could not delete test database:", error);
    }
  } else {
    console.warn(
      `⚠️  DATABASE_URL is not a file: URL (${dbUrl}); nothing to clean up`,
    );
  }

  console.log("✅ Global teardown complete");
}

export default globalTeardown;
