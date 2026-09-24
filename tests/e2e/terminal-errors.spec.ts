import { test, expect } from "@playwright/test";
import {
  navigateToTerminal,
  sendAIMessage,
  waitForTerminalReady,
} from "../helpers/session";
import { clearChatMock, mockChatSuccess } from "../helpers/api-mocks";

/**
 * What the terminal says and does when something goes wrong on the way to the
 * AI: no connection, and a session that never got created.
 *
 * Both used to end in either a raw browser string or in silence, so the
 * assertions here are about what a visitor is told and whether their message
 * survives — not about the transport.
 */

test.describe("Terminal error handling", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTerminal(page);
    await waitForTerminalReady(page);
  });

  test("a failed session start says so and hands the message back", async ({
    page,
  }) => {
    // The session is created over tRPC before the first AI message. Kill it.
    await page.route("**/api/trpc/**", (route) => route.abort("failed"));

    const input = page.getByTestId("terminal-input");
    await input.fill("Can you help me?");
    await input.press("Enter");

    const error = page.getByTestId("error-message").last();
    await expect(error).toBeVisible({ timeout: 10000 });
    await expect(error).toContainText("Couldn't start a session");

    // The typed message is back in the input, not lost.
    await expect(input).toHaveValue("Can you help me?");
  });

  test("a dropped connection is reported in plain words", async ({ page }) => {
    // Bootstrap a real session so the failure below is the chat request, not
    // the session call.
    await mockChatSuccess(page, "Hello!");
    await sendAIMessage(page, "Hi there");
    await clearChatMock(page);

    await page.route("**/api/chat", (route) => route.abort("failed"));

    const input = page.getByTestId("terminal-input");
    await input.fill("Anyone there?");
    await input.press("Enter");

    const error = page.getByTestId("error-message").last();
    await expect(error).toBeVisible({ timeout: 10000 });
    await expect(error).toContainText("No connection");
    // The browser's own wording never reaches the feed.
    await expect(error).not.toContainText("Failed to fetch");

    // The error announces itself and the input points at it (#13 U4).
    await expect(error).toHaveAttribute("role", "alert");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAttribute(
      "aria-describedby",
      (await error.getAttribute("id")) ?? "",
    );
  });
});
