import { defineConfig, devices } from "@playwright/test";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

// Load test environment variables in the same order as global-setup
// Load in order: .env, then .env.test with override
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, ".env.test"), override: true });

/**
 * Playwright configuration for terminal integration tests
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",

  /* Run tests sequentially to avoid SQLite database locking */
  fullyParallel: false,
  workers: 1,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Reporter to use */
  reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: "http://localhost:3099",

    /* Collect trace when retrying the failed test */
    trace: "on-first-retry",

    /* Screenshot only on failure */
    screenshot: "only-on-failure",

    /* Video only on failure */
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Global setup and teardown */
  globalSetup: "./tests/global-setup.ts",
  globalTeardown: "./tests/global-teardown.ts",

  /* Configure test timeouts */
  timeout: 30000, // 30 seconds per test
  expect: {
    timeout: 5000, // 5 seconds for expect assertions
  },

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "pnpm dev -p 3099",
    url: "http://localhost:3099",
    reuseExistingServer: !process.env.CI,
    timeout: 60000, // 1 minute to start
    env: {
      ...process.env,
      NEXT_PUBLIC_DISABLE_CAPTCHA: "true",
      ENVIRONMENT: "test",
      NODE_ENV: "test",
      SKIP_ENV_VALIDATION: "1",
      // Ensure API key is available for live tests
      ...(process.env.OPENAI_API_KEY && {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      }),
    },
  },
});
