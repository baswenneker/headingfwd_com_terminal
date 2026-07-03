import { test, expect } from "@playwright/test";
import {
  navigateToTerminal,
  sendAIMessage,
  waitForTerminalReady,
} from "../helpers/session";
import {
  mockEmailToolSuccess,
  mockEmailToolRateLimit,
} from "../helpers/api-mocks";
import { MOCK_TOOL_OPTIONS } from "../fixtures/mock-responses";

/**
 * Tests for the sendMessage email tool that the AI can invoke.
 *
 * The tests mock /api/chat to return a complete tool-call stream (AI SDK v6
 * format) so no real email is dispatched and no real OpenAI call is made.
 * The stream includes tool-input-start, tool-input-available, and
 * tool-output-available events that the SDK turns into a `tool-sendMessage`
 * UIMessage part. The terminal renders that part as a status line inside the
 * `[data-testid="assistant-message"]` element.
 *
 * Two paths are covered:
 *
 *   Success  — tool output { success: true } → terminal shows
 *              "✓ message sent to bas@headingfwd.com".
 *
 *   Failure  — tool output { success: false, error } → terminal shows the
 *              error text in a red line. The raw JSON object must NOT appear.
 */
test.describe("Email tool stream", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTerminal(page);
    await waitForTerminalReady(page);
  });

  test("successful tool call shows the sent-confirmation line", async ({
    page,
  }) => {
    await mockEmailToolSuccess(
      page,
      MOCK_TOOL_OPTIONS.EMAIL,
      MOCK_TOOL_OPTIONS.MESSAGE,
    );

    await sendAIMessage(page, "Please send Bas a message for me.");

    const reply = page.locator('[data-testid="assistant-message"]').last();
    await expect(reply).toBeVisible();
    // The terminal renders the success state as a styled div with this text.
    await expect(reply).toContainText("✓ message sent to bas@headingfwd.com");
  });

  test("rate-limited tool call shows the error text — not raw JSON", async ({
    page,
  }) => {
    await mockEmailToolRateLimit(page, MOCK_TOOL_OPTIONS.RATE_LIMIT_ERROR);

    await sendAIMessage(page, "Please send Bas a message.");

    const reply = page.locator('[data-testid="assistant-message"]').last();
    await expect(reply).toBeVisible();

    const text = await reply.textContent();
    // The human-readable rate-limit message must be present.
    expect(text).toContain(MOCK_TOOL_OPTIONS.RATE_LIMIT_ERROR);
    // The raw JSON object that wraps the tool output must NOT be visible to
    // the visitor — the terminal renders only the error string.
    expect(text).not.toContain('{"success"');
    expect(text).not.toContain('"error":');
  });
});
