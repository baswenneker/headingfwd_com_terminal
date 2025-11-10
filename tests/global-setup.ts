import { chromium, type FullConfig } from "@playwright/test";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "../src/server/db/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  // Load test environment variables
  // Load in order: .env, then .env.test with override
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
  dotenv.config({
    path: path.resolve(__dirname, "../.env.test"),
    override: true,
  });

  console.log("🚀 Starting global test setup...");

  // Verify we're using test environment
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl?.includes("test.db")) {
    throw new Error(`Tests must use test database. Current: ${dbUrl}`);
  }

  // Verify CAPTCHA is disabled
  if (process.env.NEXT_PUBLIC_DISABLE_CAPTCHA !== "true") {
    console.warn(
      "⚠️  CAPTCHA is not disabled. Tests may fail. Set NEXT_PUBLIC_DISABLE_CAPTCHA=true",
    );
  }

  // Verify OPENAI_API_KEY is set when live tests are enabled
  const skipLiveTests = process.env.SKIP_LIVE_TESTS === "true";
  if (!skipLiveTests && !process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY must be set when SKIP_LIVE_TESTS=false. Either set OPENAI_API_KEY in .env or set SKIP_LIVE_TESTS=true in .env.test",
    );
  }

  const rateLimit = parseInt(process.env.MESSAGE_RATE_LIMIT ?? "10", 10);

  console.log("✅ Environment verified");
  console.log(`   Database: ${dbUrl}`);
  console.log(
    `   CAPTCHA disabled: ${process.env.NEXT_PUBLIC_DISABLE_CAPTCHA}`,
  );
  console.log(`   Message rate limit: ${rateLimit} messages/minute`);
  console.log(
    `   Skip live API tests: ${skipLiveTests ? "✅ Yes (13 tests will be skipped)" : "❌ No (will make real OpenAI API calls)"}`,
  );
  if (!skipLiveTests) {
    console.log(
      `   OpenAI API Key: ${process.env.OPENAI_API_KEY ? "✅ Set" : "❌ Not set"}`,
    );
  }

  // Run database migrations for test database
  console.log("📦 Running database migrations...");
  try {
    await migrate(db, {
      migrationsFolder: "./drizzle",
    });
    console.log("✅ Database migrations completed");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }

  // Wait for the dev server to be ready (handled by webServer in playwright.config)
  const baseURL = config.webServer?.url ?? "http://localhost:3099";
  console.log(`🌐 Waiting for server at ${baseURL}...`);

  // Test the server is responding
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    console.log("✅ Server is ready");
  } catch (error) {
    console.error("❌ Server is not responding:", error);
    throw error;
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  console.log("✅ Global setup complete");
}

export default globalSetup;
