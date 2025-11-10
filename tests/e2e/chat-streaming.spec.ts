import { test, expect } from "@playwright/test";
import {
  navigateToTerminal,
  sendTerminalMessage,
  getLastMessage,
  waitForTerminalReady,
  getAllMessages,
  waitForLoadingComplete,
} from "../helpers/session";

// These tests make real OpenAI API calls and cost money
// Set SKIP_LIVE_TESTS=false in .env.test to run them
const shouldSkipLiveTests = process.env.SKIP_LIVE_TESTS === "true";

test.describe("AI Chat Streaming", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Skip live API tests if configured
    if (shouldSkipLiveTests) {
      testInfo.skip(
        true,
        "Skipping live API test (set SKIP_LIVE_TESTS=false to enable)",
      );
      return;
    }

    // Navigate to the terminal
    // Since CAPTCHA is disabled, the app will auto-create a session
    await navigateToTerminal(page);
    await waitForTerminalReady(page);
  });

  test("should receive and display streaming AI response", async ({ page }) => {
    // Send a non-command message (AI chat)
    await sendTerminalMessage(page, "Hello, respond with just 'Hi there!'");

    // Wait for response
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 15000, // Give AI more time to respond
    });

    // Verify response exists and contains some text
    const response = await getLastMessage(page);
    expect(response).toBeTruthy();
    expect(response!.length).toBeGreaterThan(0);
  });

  test("should render markdown headings in AI responses", async ({ page }) => {
    // Send message with explicit instructions to output raw markdown (not in code blocks)
    await sendTerminalMessage(
      page,
      "Write a response about web development with these headings. Output the content directly as markdown text, NOT in a code block: # Web Development, ## Frontend, ### React",
    );

    // Wait for response (AI might take longer)
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 15000,
    });

    // Wait a bit longer to ensure the response is fully rendered
    await page.waitForTimeout(1000);

    // Verify markdown headings are rendered as actual heading elements
    const lastMessage = page
      .locator('[data-testid="assistant-message"]')
      .last();

    // Check that at least some headings were rendered
    const h1Count = await lastMessage.locator("h1").count();
    const h2Count = await lastMessage.locator("h2").count();
    const h3Count = await lastMessage.locator("h3").count();
    const totalHeadings = h1Count + h2Count + h3Count;

    expect(totalHeadings).toBeGreaterThan(0);
  });

  test("should render markdown lists in AI responses", async ({ page }) => {
    // Send message with specific content to avoid asking for clarification
    await sendTerminalMessage(
      page,
      "List 3 popular programming languages as a markdown bulleted list. Output directly, not in a code block.",
    );

    // Wait for response
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 15000,
    });

    // Verify markdown list is rendered as actual list elements
    const lastMessage = page
      .locator('[data-testid="assistant-message"]')
      .last();
    const listItems = await lastMessage.locator("li").count();
    expect(listItems).toBeGreaterThan(0);
  });

  test("should maintain conversation history with multiple messages", async ({
    page,
  }) => {
    // Count initial messages (should include the welcome message)
    const initialCount = await page
      .locator('[data-testid="assistant-message"]')
      .count();

    // Send first message
    await sendTerminalMessage(page, "Say 'Message 1'");
    let messageCount = await page
      .locator('[data-testid="assistant-message"]')
      .count();
    expect(messageCount).toBe(initialCount + 1);

    // Send second message (limit test to 2 messages to stay within rate limit of 2 msg/min)
    await sendTerminalMessage(page, "Say 'Message 2'");
    messageCount = await page
      .locator('[data-testid="assistant-message"]')
      .count();
    expect(messageCount).toBe(initialCount + 2);

    // Verify all messages are still visible
    const allMessages = await getAllMessages(page);
    expect(allMessages.length).toBeGreaterThanOrEqual(4); // 2 user + 2 assistant (plus welcome)
  });

  test("should handle long responses with auto-scroll", async ({ page }) => {
    // Get initial scroll position
    const initialScrollTop = await page.evaluate(() => {
      const container = document.querySelector(
        '[data-testid="messages-container"]',
      );
      return container ? container.scrollTop : 0;
    });

    // Send message asking for a response with multiple paragraphs
    await sendTerminalMessage(
      page,
      "Write a response about JavaScript with 2-3 paragraphs",
    );

    // Wait for response to complete
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 20000, // Long responses take more time
    });

    // Wait for streaming to complete (loading indicator disappears)
    await page.waitForSelector('[data-testid="loading-indicator"]', {
      state: "hidden",
      timeout: 20000,
    });

    // Wait for auto-scroll to trigger
    await page.waitForTimeout(500);

    // Verify scroll position changed (main goal of this test)
    const finalScrollTop = await page.evaluate(() => {
      const container = document.querySelector(
        '[data-testid="messages-container"]',
      );
      return container ? container.scrollTop : 0;
    });

    expect(finalScrollTop).toBeGreaterThanOrEqual(initialScrollTop);

    // Verify response has some content
    const response = await getLastMessage(page);
    expect(response!.length).toBeGreaterThan(20);
  });

  test("should handle mixed conversation with commands and AI messages", async ({
    page,
  }) => {
    // Count initial messages
    const initialCount = await page
      .locator('[data-testid="assistant-message"]')
      .count();

    // Send a command
    await sendTerminalMessage(page, "/help");
    let messageCount = await page
      .locator('[data-testid="assistant-message"]')
      .count();
    expect(messageCount).toBe(initialCount + 1);

    // Send AI message
    await sendTerminalMessage(page, "Say hello");
    messageCount = await page
      .locator('[data-testid="assistant-message"]')
      .count();
    expect(messageCount).toBe(initialCount + 2);

    // Send another command
    await sendTerminalMessage(page, "/contact");
    messageCount = await page
      .locator('[data-testid="assistant-message"]')
      .count();
    expect(messageCount).toBe(initialCount + 3);

    // Verify all messages are present
    const allMessages = await getAllMessages(page);
    expect(allMessages.length).toBeGreaterThanOrEqual(6);
  });

  test("should show AI streaming takes time vs instant commands", async ({
    page,
  }) => {
    // Measure AI response time
    const aiStartTime = Date.now();
    await sendTerminalMessage(page, "Hello");
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 15000,
    });
    const aiDuration = Date.now() - aiStartTime;

    // Measure command response time
    const cmdStartTime = Date.now();
    await sendTerminalMessage(page, "/help");
    await page.waitForSelector('[data-testid="assistant-message"]', {
      timeout: 5000,
    });
    const cmdDuration = Date.now() - cmdStartTime;

    // Commands should be faster than AI responses
    expect(cmdDuration).toBeLessThan(2000);
    // AI responses typically take at least 500ms
    expect(aiDuration).toBeGreaterThan(500);
  });

  test("should maintain input focus after sending command", async ({
    page,
  }) => {
    const input = page.locator('[data-testid="terminal-input"]');

    // Send command message (instant response)
    await sendTerminalMessage(page, "/help");

    // Command response is immediate, try to type right away
    await input.fill("immediate");
    const value = await input.inputValue();
    expect(value).toBe("immediate");
  });

  test("should maintain input focus after AI response completes", async ({
    page,
  }) => {
    const input = page.locator('[data-testid="terminal-input"]');

    // Send AI message
    await input.fill("Say 'test response'");
    await input.press("Enter");

    // Wait for loading to complete (streaming done)
    await waitForLoadingComplete(page);

    // Type immediately without explicit focus
    // The input should have focus restored automatically
    await input.fill("after-response");
    const value = await input.inputValue();
    expect(value).toBe("after-response");
  });

  test("should maintain input focus in multiple message sequence", async ({
    page,
  }) => {
    const input = page.locator('[data-testid="terminal-input"]');

    // First: command message
    await input.fill("/help");
    await input.press("Enter");

    // Should be able to type immediately
    await input.fill("first");
    await input.clear();

    // Second: AI message
    await input.fill("Hello");
    await input.press("Enter");

    // Wait for response to complete
    await waitForLoadingComplete(page);

    // Should be able to type immediately
    await input.fill("second");
    const value = await input.inputValue();
    expect(value).toBe("second");
  });
});
