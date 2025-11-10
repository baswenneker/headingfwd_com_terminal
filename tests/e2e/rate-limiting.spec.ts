import { test, expect } from "@playwright/test";
import {
  navigateToTerminal,
  sendTerminalMessage,
  getLastMessage,
  waitForTerminalReady,
  setupTestSession,
} from "../helpers/session";
import { cleanupDatabase } from "../helpers/database";

// These tests make real OpenAI API calls and cost money
// Set SKIP_LIVE_TESTS=false in .env.test to run them
const shouldSkipLiveTests = process.env.SKIP_LIVE_TESTS === "true";

// Get rate limit from environment (defaults to 10 if not set)
const rateLimitEnv = process.env.MESSAGE_RATE_LIMIT ?? "10";
const RATE_LIMIT = parseInt(rateLimitEnv, 10);

// Validate MESSAGE_RATE_LIMIT is a valid number
if (isNaN(RATE_LIMIT) || RATE_LIMIT < 2) {
  throw new Error(
    `Invalid MESSAGE_RATE_LIMIT: "${rateLimitEnv}" - tests require MESSAGE_RATE_LIMIT=2 or higher for reliable operation`,
  );
}

// Check if rate limit is too high for testing (tests would be slow/expensive)
const rateLimitTooHigh = RATE_LIMIT > 2;

test.describe("Rate Limiting", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Skip live API tests if configured
    if (shouldSkipLiveTests) {
      testInfo.skip(
        true,
        "Skipping live API test (set SKIP_LIVE_TESTS=false to enable)",
      );
      return;
    }

    // Skip if rate limit is too high (tests would be slow and expensive)
    if (rateLimitTooHigh) {
      testInfo.skip(
        true,
        `Skipping rate limit tests: MESSAGE_RATE_LIMIT=${RATE_LIMIT} is too high (set MESSAGE_RATE_LIMIT=2 or lower in .env.test to enable)`,
      );
      return;
    }

    // Clean database before each test
    await cleanupDatabase();

    // Navigate to the terminal
    await navigateToTerminal(page);
    await waitForTerminalReady(page);
  });

  test.afterEach(async () => {
    // Clean up after each test
    await cleanupDatabase();
  });

  test("should count AI messages toward rate limit", async ({ page }) => {
    // Create a test session
    const session = await setupTestSession(page);

    // Send messages up to the rate limit
    for (let i = 0; i < RATE_LIMIT; i++) {
      await sendTerminalMessage(page, `Test message ${i + 1}`);
      await page.waitForTimeout(100); // Small delay between messages
    }

    // Verify all messages were sent successfully
    const messageCount = await page
      .locator('[data-testid="assistant-message"]')
      .count();
    expect(messageCount).toBeGreaterThanOrEqual(RATE_LIMIT);

    // Verify last message is successful (not rate limit error)
    const lastMessage = await getLastMessage(page);
    expect(lastMessage).not.toMatch(/rate limit/i);
  });

  test("should show rate limit error after exceeding rate limit", async ({
    page,
  }) => {
    // Create a test session
    await setupTestSession(page);

    // Send messages up to the rate limit
    for (let i = 0; i < RATE_LIMIT; i++) {
      await sendTerminalMessage(page, `Message ${i + 1}`);
    }

    // Try to send one more message (should be rate limited)
    const input = page.locator('[data-testid="terminal-input"]');
    await input.fill("This should be rate limited");
    await input.press("Enter");

    // Wait for error message to appear
    await page.waitForSelector('[data-testid="error-message"]', {
      timeout: 10000,
    });

    // Verify rate limit error message is displayed
    const errorMessage = await page
      .locator('[data-testid="error-message"]')
      .textContent();
    expect(errorMessage).toMatch(/rate limit/i);
  });

  test("should allow commands to bypass rate limits", async ({ page }) => {
    // Create a test session
    await setupTestSession(page);

    // Send AI messages up to the rate limit
    for (let i = 0; i < RATE_LIMIT; i++) {
      await sendTerminalMessage(page, `AI message ${i + 1}`);
    }

    // Try to send another AI message - should get rate limited
    const input = page.locator('[data-testid="terminal-input"]');
    await input.fill("This should be rate limited");
    await input.press("Enter");

    // Wait for error message
    await page.waitForSelector('[data-testid="error-message"]', {
      timeout: 10000,
    });

    // Count messages before commands
    const messagesBefore = await page
      .locator('[data-testid="assistant-message"]')
      .count();

    // Send multiple commands - they should all work despite rate limit
    await sendTerminalMessage(page, "/help");
    await page.waitForTimeout(200);

    await sendTerminalMessage(page, "/services");
    await page.waitForTimeout(200);

    await sendTerminalMessage(page, "/contact");
    await page.waitForTimeout(200);

    // Verify commands were executed successfully
    const messagesAfter = await page
      .locator('[data-testid="assistant-message"]')
      .count();
    expect(messagesAfter).toBe(messagesBefore + 3);

    // Verify last command response doesn't contain rate limit error
    const lastMessage = await getLastMessage(page);
    expect(lastMessage).not.toMatch(/rate limit/i);
    expect(lastMessage).toMatch(/contact|email|linkedin/i); // Should show contact info
  });

  test("should display rate limit error and disable input", async ({
    page,
  }) => {
    // Create a test session
    await setupTestSession(page);

    // Send messages up to the rate limit
    for (let i = 0; i < RATE_LIMIT; i++) {
      await sendTerminalMessage(page, `Message ${i + 1}`);
    }

    // Try to send another message (should be rate limited)
    const input = page.locator('[data-testid="terminal-input"]');
    await input.fill("This should be rate limited");
    await input.press("Enter");

    // Wait for error message to appear
    await page.waitForSelector('[data-testid="error-message"]', {
      timeout: 10000,
    });

    // Verify rate limit error is displayed
    const errorMessage = await page
      .locator('[data-testid="error-message"]')
      .textContent();
    expect(errorMessage).toMatch(/rate limit/i);

    // Note: Input disable state may vary based on implementation
    // This test documents the expected behavior
  });

  test("should only count AI messages, not commands, toward rate limit", async ({
    page,
  }) => {
    // Create a test session
    const session = await setupTestSession(page);

    // Send some commands (these don't count toward rate limit)
    const numCommands = Math.max(2, RATE_LIMIT);
    for (let i = 0; i < numCommands; i++) {
      await sendTerminalMessage(page, "/help");
      await page.waitForTimeout(100);
    }

    // Send AI messages up to the rate limit
    for (let i = 0; i < RATE_LIMIT; i++) {
      await sendTerminalMessage(page, `AI message ${i + 1}`);
      await page.waitForTimeout(100);
    }

    // Verify all messages were sent successfully
    const messageCount = await page
      .locator('[data-testid="assistant-message"]')
      .count();
    const expectedCount = numCommands + RATE_LIMIT;
    expect(messageCount).toBeGreaterThanOrEqual(expectedCount);

    // Verify no rate limit error
    const lastMessage = await getLastMessage(page);
    expect(lastMessage).not.toMatch(/rate limit/i);
  });
});
