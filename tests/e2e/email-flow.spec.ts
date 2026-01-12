import { test, expect } from "@playwright/test";
import {
  navigateToTerminal,
  sendTerminalMessage,
  waitForTerminalReady,
} from "../helpers/session";

// These tests make real OpenAI API calls and cost money
// Set SKIP_LIVE_TESTS=false in .env.test to run them
const shouldSkipLiveTests = process.env.SKIP_LIVE_TESTS === "true";

test.describe("Email Sending Flow", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Skip live API tests if configured
    if (shouldSkipLiveTests) {
      testInfo.skip(
        true,
        "Skipping live API test (set SKIP_LIVE_TESTS=false to enable)",
      );
      return;
    }

    // NOTE: Email sending is mocked server-side via ENVIRONMENT=test
    // The sendContactEmail() function in src/server/services/email.ts
    // checks ENVIRONMENT and returns mock data instead of calling Resend API.
    // This prevents real emails from being sent during E2E tests.

    await navigateToTerminal(page);
    await waitForTerminalReady(page);
  });

  test("should complete full email flow - happy path", async ({ page }) => {
    // Step 1: User expresses intent to send message
    await sendTerminalMessage(page, "I want to send you a message");

    // Wait for AI to ask for email
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 15000,
    });

    // Verify AI asks for email address
    let lastMessage = await page
      .locator('[data-testid="assistant-message"]')
      .last()
      .textContent();

    console.log(lastMessage);
    expect(lastMessage?.toLowerCase()).toMatch(/email/);

    // Step 2: Provide email address
    await sendTerminalMessage(page, "test@example.com");

    // Wait for AI to ask for message
    await page.waitForTimeout(2000);
    lastMessage = await page
      .locator('[data-testid="assistant-message"]')
      .last()
      .textContent();
    expect(lastMessage?.toLowerCase()).toMatch(/message|what|tell/);

    // Step 3: Provide message content
    await sendTerminalMessage(
      page,
      "I need help building an AI agent with LangGraph for my startup",
    );

    // Wait for preview to appear
    await page.waitForTimeout(3000);
    lastMessage = await page
      .locator('[data-testid="assistant-message"]')
      .last()
      .textContent();

    // Verify preview is shown with all expected elements
    expect(lastMessage).toContain("📧");
    expect(lastMessage).toContain("test@example.com");
    expect(lastMessage).toContain("bas@headingfwd.com");
    expect(lastMessage).toContain("AI agent");
    expect(lastMessage?.toLowerCase()).toMatch(/send|confirm/);

    // Step 4: Confirm sending
    await sendTerminalMessage(page, "yes, send it");

    // Wait for success message
    await page.waitForTimeout(3000);
    lastMessage = await page
      .locator('[data-testid="assistant-message"]')
      .last()
      .textContent();

    // Verify success message
    expect(lastMessage?.toLowerCase()).toMatch(/sent|message|email/);

    // Verify sendMessage tool call is hidden throughout the entire flow
    const allMessages = await page
      .locator('[data-testid="assistant-message"]')
      .allTextContents();

    const hasSendMessageToolCall = allMessages.some((msg) =>
      msg.includes("sendMessage()"),
    );
    expect(hasSendMessageToolCall).toBe(false);
  });

  test("should not send without confirmation", async ({ page }) => {
    await sendTerminalMessage(page, "send a message to Bas");
    await page.waitForTimeout(1500);

    await sendTerminalMessage(page, "noreply@example.com");
    await page.waitForTimeout(2000);

    await sendTerminalMessage(page, "This is a test message");
    await page.waitForTimeout(3000);

    // Instead of confirming, say no
    await sendTerminalMessage(page, "no, cancel that");
    await page.waitForTimeout(2000);

    const lastMessage = await page
      .locator('[data-testid="assistant-message"]')
      .last()
      .textContent();

    // Should show the exact cancellation message
    expect(lastMessage?.toLowerCase()).toContain(
      "no problem, the message was not sent",
    );
  });

  test("should validate email format", async ({ page }) => {
    await sendTerminalMessage(page, "I want to message you");
    await page.waitForTimeout(1500);

    // Provide invalid email
    await sendTerminalMessage(page, "not-an-email");
    await page.waitForTimeout(2000);

    const lastMessage = await page
      .locator('[data-testid="assistant-message"]')
      .last()
      .textContent();

    // AI should ask for valid email or recognize the issue
    expect(lastMessage?.toLowerCase()).toMatch(/email|valid|address/);
  });

  test("should handle message length requirements", async ({ page }) => {
    await sendTerminalMessage(page, "contact Bas for me");
    await page.waitForTimeout(1500);

    await sendTerminalMessage(page, "user@example.com");
    await page.waitForTimeout(2000);

    // Provide very short message (less than 10 chars)
    await sendTerminalMessage(page, "Hi");
    await page.waitForTimeout(2000);

    const lastMessage = await page
      .locator('[data-testid="assistant-message"]')
      .last()
      .textContent();

    // Should ask for more detail or longer message
    expect(lastMessage?.toLowerCase()).toMatch(
      /more|detail|longer|message|elaborate/,
    );
  });

  test("should include conversation history in email context", async ({
    page,
  }) => {
    // Have some conversation first
    await sendTerminalMessage(page, "What services do you offer?");
    await page.waitForTimeout(2000);

    // Now send email - the conversation should be included in the backend
    await sendTerminalMessage(page, "I want to hire you");
    await page.waitForTimeout(1500);

    await sendTerminalMessage(page, "client@company.com");
    await page.waitForTimeout(2000);

    await sendTerminalMessage(
      page,
      "I'm interested in your AI services for our project",
    );
    await page.waitForTimeout(3000);

    await sendTerminalMessage(page, "yes send");
    await page.waitForTimeout(2000);

    // Verify success (conversation history is included in backend, not visible in UI)
    const lastMessage = await page
      .locator('[data-testid="assistant-message"]')
      .last()
      .textContent();
    expect(lastMessage?.toLowerCase()).toMatch(/sent/);
  });

  test("should handle different confirmation phrases", async ({ page }) => {
    // Test with "ja" (yes in Dutch, as seen in manual testing)
    await sendTerminalMessage(page, "stuur een bericht naar Bas");
    await page.waitForTimeout(1500);
    await sendTerminalMessage(page, "test@headingfwd.com");
    await page.waitForTimeout(2000);
    await sendTerminalMessage(page, "Dit is een testbericht");
    await page.waitForTimeout(3000);

    // Confirm with "ja"
    await sendTerminalMessage(page, "ja");
    await page.waitForTimeout(3000);

    const lastMessage = await page
      .locator('[data-testid="assistant-message"]')
      .last()
      .textContent();

    expect(lastMessage?.toLowerCase()).toMatch(
      /sent|verstuurd|verzonden|success/,
    );
  });
});
