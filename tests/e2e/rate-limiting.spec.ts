import { test, expect } from "@playwright/test";
import {
  navigateToTerminal,
  sendCommand,
  waitForTerminalReady,
} from "../helpers/session";
import { mockRateLimitError } from "../helpers/api-mocks";
import { MOCK_ERROR_MESSAGES } from "../fixtures/mock-responses";
import { COMMAND_TEXT } from "../fixtures/command-outputs";

/**
 * Tests for how the terminal handles rate-limit errors from /api/chat.
 *
 * When /api/chat returns a 429 HTTP response, the body is:
 *   { "error": "Rate limit exceeded. Please try again later." }
 *
 * The terminal's readableError() function unwraps that JSON envelope and
 * shows the plain text inside `[data-testid="error-message"]`. The raw JSON
 * object must never be visible to the visitor.
 *
 * Slash-commands are entirely client-side and unaffected by chat rate limits.
 * After a 429 error the input stays enabled (the terminal is not locked) and
 * slash-commands continue to produce their normal output.
 */
test.describe("Rate limiting", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTerminal(page);
    await waitForTerminalReady(page);
  });

  test("429 from /api/chat shows a readable error message — not raw JSON", async ({
    page,
  }) => {
    await mockRateLimitError(page);

    // Send a free-text message so the chat endpoint is called.
    const input = page.getByTestId("terminal-input");
    await input.fill("Tell me about your services");
    await input.press("Enter");

    // The terminal renders the unwrapped error string in [data-testid="error-message"].
    const errorEl = page.locator('[data-testid="error-message"]').last();
    await expect(errorEl).toBeVisible({ timeout: 10000 });

    const text = await errorEl.textContent();
    // The human-readable part must be present.
    expect(text).toContain(MOCK_ERROR_MESSAGES.RATE_LIMIT);
    // Raw JSON must not be shown.
    expect(text).not.toContain('{"error"');
    expect(text).not.toContain('"error":');
  });

  test("slash-commands still work normally after a chat rate-limit error", async ({
    page,
  }) => {
    // Trigger a 429 error on the AI channel.
    await mockRateLimitError(page);

    const input = page.getByTestId("terminal-input");
    await input.fill("Hello");
    await input.press("Enter");

    // Wait for the error to become visible.
    await page
      .locator('[data-testid="error-message"]')
      .last()
      .waitFor({ state: "visible", timeout: 10000 });

    // Slash-commands do not go through /api/chat, so they must succeed even
    // while the AI channel is returning errors.
    await sendCommand(page, "/help");
    await expect(page.getByText(COMMAND_TEXT.HELP.header)).toBeVisible();
  });

  test("error message is removed from view after /clear", async ({ page }) => {
    await mockRateLimitError(page);

    const input = page.getByTestId("terminal-input");
    await input.fill("Hi");
    await input.press("Enter");

    await page
      .locator('[data-testid="error-message"]')
      .last()
      .waitFor({ state: "visible", timeout: 10000 });

    // /clear resets the blocks array, which removes the AI turn block that
    // contains the error element.
    await sendCommand(page, "/clear");
    await expect(
      page.locator('[data-testid="error-message"]'),
    ).not.toBeVisible();
  });
});
