import { chromium, type FullConfig } from "@playwright/test";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "../src/server/db/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Global setup for Playwright tests.
 * Runs once before all tests begin.
 *
 * Responsibilities:
 *   1. Load the test environment variables (.env then .env.test).
 *   2. Verify the test database URL so we never accidentally touch production.
 *   3. Ensure the database directory exists (SQLite cannot create parent dirs).
 *   4. Run Drizzle migrations against the test database.
 *   5. Confirm the dev server is responding at the test base URL.
 */
async function globalSetup(config: FullConfig) {
  // Load in order: .env provides defaults; .env.test overrides for testing.
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
  dotenv.config({
    path: path.resolve(__dirname, "../.env.test"),
    override: true,
  });

  console.log("Starting global test setup…");

  // Guard: tests must use the test database, not the production one.
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl?.includes("test.db")) {
    throw new Error(`Tests must use the test database. Current: ${dbUrl}`);
  }

  if (process.env.NEXT_PUBLIC_DISABLE_CAPTCHA !== "true") {
    console.warn(
      "CAPTCHA is not disabled. Tests that trigger AI messages may fail. " +
        "Set NEXT_PUBLIC_DISABLE_CAPTCHA=true in .env.test.",
    );
  }

  console.log(`   Database: ${dbUrl}`);
  console.log(
    `   CAPTCHA disabled: ${process.env.NEXT_PUBLIC_DISABLE_CAPTCHA}`,
  );

  // Run Drizzle migrations to create/update the test schema.
  console.log("Running database migrations…");
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Database migrations completed.");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }

  // Confirm the dev server is up at the configured base URL.
  const baseURL = config.webServer?.url ?? "http://localhost:3099";
  console.log(`Waiting for server at ${baseURL}…`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    console.log("Server is ready.");
  } catch (error) {
    console.error("Server is not responding:", error);
    throw error;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  console.log("Global setup complete.");
}

export default globalSetup;
