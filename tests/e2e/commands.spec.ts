import { test, expect } from "@playwright/test";
import {
  navigateToTerminal,
  sendTerminalMessage,
  getLastMessage,
  waitForTerminalReady,
} from "../helpers/session";
import { expectResponseToContain } from "../helpers/assertions";
import { COMMAND_PATTERNS } from "../fixtures/command-outputs";

test.describe("Terminal Commands", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the terminal
    // Since CAPTCHA is disabled, the app will auto-create a session
    await navigateToTerminal(page);
    await waitForTerminalReady(page);
  });

  test("should execute /help command and display command list", async ({
    page,
  }) => {
    // Send /help command
    await sendTerminalMessage(page, "/help");

    // Wait for response
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 5000,
    });

    // Verify response contains command information
    const response = await getLastMessage(page);
    expect(response).toMatch(COMMAND_PATTERNS.HELP);
    await expectResponseToContain(page, "/help");
    await expectResponseToContain(page, "/services");
    await expectResponseToContain(page, "/contact");
    await expectResponseToContain(page, "/how-i-built-this");
    await expectResponseToContain(page, "/linkedin");
  });

  test("should execute /services command and display services info", async ({
    page,
  }) => {
    // Send /services command
    await sendTerminalMessage(page, "/services");

    // Wait for response
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 5000,
    });

    // Verify response contains services information
    const response = await getLastMessage(page);
    expect(response).toMatch(COMMAND_PATTERNS.SERVICES);
  });

  test("should execute /contact command and display contact info", async ({
    page,
  }) => {
    // Send /contact command
    await sendTerminalMessage(page, "/contact");

    // Wait for response
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 5000,
    });

    // Verify response contains contact information
    const response = await getLastMessage(page);
    expect(response).toMatch(COMMAND_PATTERNS.CONTACT);

    // Verify contact details are present
    await expectResponseToContain(page, "LinkedIn");
    await expectResponseToContain(page, "bas@headingfwd.com");
  });

  test("should execute /how-i-built-this command and open GitHub", async ({
    page,
  }) => {
    // Send /how-i-built-this command
    await sendTerminalMessage(page, "/how-i-built-this");

    // Wait for response
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 5000,
    });

    // Verify response contains tech stack info
    const response = await getLastMessage(page);
    expect(response).toMatch(COMMAND_PATTERNS.HOW_I_BUILT_THIS);
  });

  test("should execute /linkedin command and open LinkedIn profile", async ({
    page,
  }) => {
    // Send /linkedin command
    await sendTerminalMessage(page, "/linkedin");

    // Wait for response
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 5000,
    });

    // Verify response contains LinkedIn profile info
    const response = await getLastMessage(page);
    expect(response).toMatch(COMMAND_PATTERNS.LINKEDIN);

    // Verify LinkedIn URL is mentioned in response
    await expectResponseToContain(page, "LinkedIn");
  });

  test("should handle case-insensitive commands", async ({ page }) => {
    // Send command in uppercase
    await sendTerminalMessage(page, "/HELP");

    // Wait for response
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 5000,
    });

    // Verify response is the same as lowercase
    const response = await getLastMessage(page);
    expect(response).toMatch(COMMAND_PATTERNS.HELP);
  });

  test("should handle commands with extra spaces", async ({ page }) => {
    // Send command with leading/trailing spaces
    await sendTerminalMessage(page, "  /help  ");

    // Wait for response
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 5000,
    });

    // Verify response works correctly
    const response = await getLastMessage(page);
    expect(response).toMatch(COMMAND_PATTERNS.HELP);
  });

  test("should display error for unknown command", async ({ page }) => {
    // Send unknown command
    await sendTerminalMessage(page, "/unknown");

    // Wait for response
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 5000,
    });

    // Verify error message
    await expectResponseToContain(page, "Unknown command");
    await expectResponseToContain(page, "/help");
  });

  test("should execute multiple commands in sequence", async ({ page }) => {
    // Count initial messages
    const initialCount = await page
      .locator('[data-testid="assistant-message"]')
      .count();

    // Send first command (sendTerminalMessage already waits for response)
    await sendTerminalMessage(page, "/help");

    // Verify first response appeared
    let messageCount = await page
      .locator('[data-testid="assistant-message"]')
      .count();
    expect(messageCount).toBe(initialCount + 1);

    // Send second command (sendTerminalMessage already waits for response)
    await sendTerminalMessage(page, "/services");

    // Verify second response appeared
    messageCount = await page
      .locator('[data-testid="assistant-message"]')
      .count();
    expect(messageCount).toBe(initialCount + 2);

    // Send third command (sendTerminalMessage already waits for response)
    await sendTerminalMessage(page, "/contact");

    // Verify third response appeared
    messageCount = await page
      .locator('[data-testid="assistant-message"]')
      .count();
    expect(messageCount).toBe(initialCount + 3);

    // Verify all messages are present
    const finalCount = await page
      .locator('[data-testid="assistant-message"]')
      .count();
    expect(finalCount).toBeGreaterThanOrEqual(initialCount + 3);
  });

  test("should not be affected by rate limiting", async ({ page }) => {
    // Commands should not count toward rate limits
    // Send 12 commands (more than the 10 message rate limit)
    for (let i = 0; i < 12; i++) {
      await sendTerminalMessage(page, "/help");
      await page.waitForTimeout(100); // Small delay between commands
    }

    // Verify last command still works (no rate limit error)
    const lastMessage = await getLastMessage(page);
    expect(lastMessage).not.toContain("Rate limit");
    expect(lastMessage).toMatch(/Available Commands|help/i);
  });

  test("should render markdown in command responses", async ({ page }) => {
    // Send /contact command which has markdown
    await sendTerminalMessage(page, "/contact");

    // Wait for response
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 5000,
    });

    //Verify response contains contact info
    const response = await getLastMessage(page);
    expect(response).toMatch(COMMAND_PATTERNS.CONTACT);

    // Verify markdown links are rendered as actual links
    const links = await page.locator("a").count();
    expect(links).toBeGreaterThan(0);
  });

  test("should display commands instantly without streaming delay", async ({
    page,
  }) => {
    const startTime = Date.now();

    // Send command
    await sendTerminalMessage(page, "/help");

    // Wait for response
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 5000,
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Command should execute in less than 2 seconds (much faster than AI responses)
    expect(duration).toBeLessThan(2000);

    // Verify no "Thinking..." indicator appears for commands
    const thinkingIndicator = page.locator('[data-testid="loading-indicator"]');
    await expect(thinkingIndicator).not.toBeVisible();
  });
});
