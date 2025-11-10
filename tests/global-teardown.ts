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

  // Clean up test database file
  const testDbPath = path.resolve(__dirname, "../test.db");
  try {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
      console.log("✅ Test database cleaned up");
    }
  } catch (error) {
    console.warn("⚠️  Could not delete test database:", error);
  }

  console.log("✅ Global teardown complete");
}

export default globalTeardown;
