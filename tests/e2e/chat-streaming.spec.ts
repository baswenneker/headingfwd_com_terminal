import { test, expect } from "@playwright/test";
import {
  navigateToTerminal,
  sendAIMessage,
  waitForTerminalReady,
} from "../helpers/session";
import { mockChatSuccess } from "../helpers/api-mocks";
import { MOCK_AI_RESPONSES } from "../fixtures/mock-responses";

/**
 * Tests for the AI streaming chat feature.
 *
 * Every test mocks /api/chat before sending a free-text message, so no real
 * OpenAI API call is made. The mock returns a complete UI message stream body
 * in the AI SDK v6 SSE format (x-vercel-ai-ui-message-stream: v1).
 *
 * CAPTCHA is disabled in the test environment via NEXT_PUBLIC_DISABLE_CAPTCHA,
 * so the first message triggers a real tRPC session-init call to the test DB
 * and then posts to the mocked /api/chat endpoint. Subsequent messages reuse
 * the same session.
 *
 * After a successful stream the terminal renders the assistant reply inside
 * `[data-testid="assistant-message"]`. The MemoizedMarkdown component parses
 * the text so markdown constructs (bold, italic, links) become HTML elements.
 */
test.describe("AI chat streaming", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTerminal(page);
    await waitForTerminalReady(page);
  });

  test("free-text message renders an assistant-message element with the reply text", async ({
    page,
  }) => {
    await mockChatSuccess(page, MOCK_AI_RESPONSES.HELLO);

    await sendAIMessage(page, "Hello");

    const reply = page.locator('[data-testid="assistant-message"]').last();
    await expect(reply).toBeVisible();
    // The mock response contains "Hello" so the rendered text must too.
    await expect(reply).toContainText("Hello");
  });

  test("markdown bold is rendered as a <strong> element inside the reply", async ({
    page,
  }) => {
    await mockChatSuccess(page, MOCK_AI_RESPONSES.WITH_BOLD);

    await sendAIMessage(page, "What do you specialise in?");

    const reply = page.locator('[data-testid="assistant-message"]').last();
    await expect(reply).toBeVisible();
    // **Generative AI** in the mock response must become a <strong> element.
    const bold = reply.locator("strong");
    await expect(bold).toBeVisible();
    await expect(bold).toContainText("Generative AI");
  });

  test("loading indicator is gone once the stream is fully received", async ({
    page,
  }) => {
    await mockChatSuccess(page, MOCK_AI_RESPONSES.HELLO);

    // sendAIMessage waits for loading to complete before returning.
    await sendAIMessage(page, "Hi");

    await expect(
      page.locator('[data-testid="loading-indicator"]'),
    ).not.toBeVisible();
  });

  test("a second AI message appends a second assistant-message element", async ({
    page,
  }) => {
    await mockChatSuccess(page, MOCK_AI_RESPONSES.HELLO);
    await sendAIMessage(page, "First message");

    const countAfterFirst = await page
      .locator('[data-testid="assistant-message"]')
      .count();
    expect(countAfterFirst).toBe(1);

    // Re-register the mock for the second request (route mocks are consumed
    // once by default; re-registering replaces the previous handler).
    await mockChatSuccess(page, MOCK_AI_RESPONSES.MULTI_PARAGRAPH);
    await sendAIMessage(page, "Second message");

    const countAfterSecond = await page
      .locator('[data-testid="assistant-message"]')
      .count();
    expect(countAfterSecond).toBe(2);
  });

  test("multi-paragraph reply is fully contained inside one assistant-message element", async ({
    page,
  }) => {
    await mockChatSuccess(page, MOCK_AI_RESPONSES.MULTI_PARAGRAPH);

    await sendAIMessage(page, "Tell me about HeadingFWD.");

    const reply = page.locator('[data-testid="assistant-message"]').last();
    await expect(reply).toBeVisible();
    await expect(reply).toContainText("HeadingFWD");
    await expect(reply).toContainText("Bas has 15+");
  });
});
