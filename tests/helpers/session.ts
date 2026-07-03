import { type Page } from "@playwright/test";
import { createTestSession } from "./database";

/**
 * Navigation and interaction helpers for the terminal E2E tests.
 *
 * The terminal has two interaction modes:
 *
 *   Slash-commands (/help, /about, …) — handled entirely in the browser.
 *   Instant, no network call. Output appears in the feed as static lines.
 *
 *   Free-text messages — routed to the AI over /api/chat after a session
 *   is created via tRPC. With NEXT_PUBLIC_DISABLE_CAPTCHA=true (the test
 *   environment), the session is created automatically on the first message.
 *
 * Use `sendCommand` for slash-commands and `sendAIMessage` for free-text.
 * The unified `sendTerminalMessage` dispatches to the appropriate helper
 * based on whether the input starts with "/".
 */

/**
 * Create a verified test session directly in the database.
 * Useful for pre-seeding rate-limit state before navigating to the page.
 */
export async function setupTestSession(_page: Page) {
  const session = await createTestSession({ verified: true, messageCount: 0 });
  if (!session) throw new Error("Failed to create test session in test DB");
  return session;
}

/**
 * Navigate to the terminal homepage and wait for the page to be fully loaded.
 * Uses "networkidle" so the test waits until the initial HTML, JS and CSS
 * are all delivered before any interaction begins.
 */
export async function navigateToTerminal(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
}

/**
 * Wait until the terminal input field is visible and not disabled.
 *
 * The input is disabled while the CAPTCHA overlay is open or while the AI
 * is streaming a response. On a fresh page load with CAPTCHA disabled, the
 * input should be enabled almost immediately.
 */
export async function waitForTerminalReady(page: Page) {
  const input = page.getByTestId("terminal-input");
  await input.waitFor({ state: "visible" });
  await page.waitForFunction(
    () => {
      const el = document.querySelector('[data-testid="terminal-input"]');
      return el && !(el as HTMLInputElement).disabled;
    },
    { timeout: 10000 },
  );
}

/**
 * Type a slash-command into the terminal input and press Enter.
 *
 * Slash-commands produce output synchronously in the browser — there is no
 * network call and no `[data-testid="assistant-message"]` element appears.
 * Callers should assert the expected output text directly after this call.
 * Playwright retries assertions until the React state update has rendered.
 */
export async function sendCommand(page: Page, command: string) {
  const input = page.getByTestId("terminal-input");
  await input.fill(command);
  await input.press("Enter");
}

/**
 * Type a free-text message into the terminal and wait for the AI reply.
 *
 * With CAPTCHA disabled, the first message triggers a real tRPC session-init
 * call to the test DB, then posts to /api/chat. The caller must set up a
 * route mock for /api/chat before calling this helper.
 *
 * Waits for a new `[data-testid="assistant-message"]` to appear in the feed
 * and for the loading indicator to disappear before returning.
 */
export async function sendAIMessage(page: Page, text: string) {
  const before = await page
    .locator('[data-testid="assistant-message"]')
    .count();

  const input = page.getByTestId("terminal-input");
  await input.fill(text);
  await input.press("Enter");

  // Wait for the assistant message block to appear in the feed.
  await page.waitForFunction(
    (count: number) =>
      document.querySelectorAll('[data-testid="assistant-message"]').length >
      count,
    before,
    { timeout: 15000 },
  );

  // Wait for the AI SDK streaming to finish (loading indicator gone).
  await waitForLoadingComplete(page);
}

/**
 * Unified send helper that routes to the correct wait strategy.
 * Slash-commands (starting with "/") complete immediately.
 * Free-text messages wait for the AI response.
 */
export async function sendTerminalMessage(page: Page, message: string) {
  if (message.trim().startsWith("/")) {
    await sendCommand(page, message);
  } else {
    await sendAIMessage(page, message);
  }
}

/**
 * Return the text content of the last `[data-testid="assistant-message"]`
 * element in the terminal feed, or null if no AI reply has arrived yet.
 */
export async function getLastMessage(page: Page) {
  const messages = await page
    .locator('[data-testid="assistant-message"]')
    .all();
  if (messages.length === 0) return null;
  return messages[messages.length - 1]!.textContent();
}

/**
 * Return the text contents of all `[data-testid*="message"]` elements.
 */
export async function getAllMessages(page: Page) {
  return page.locator('[data-testid*="message"]').allTextContents();
}

/**
 * Wait until `[data-testid="loading-indicator"]` is no longer visible.
 *
 * Playwright's `state: "hidden"` matches both elements that are detached
 * from the DOM (post-streaming) and elements hidden via CSS (mid-stream but
 * text has started arriving). Returns immediately if the element is never
 * added to the DOM at all — which is the case for slash-commands.
 */
export async function waitForLoadingComplete(page: Page) {
  await page.waitForSelector('[data-testid="loading-indicator"]', {
    state: "hidden",
    timeout: 20000,
  });
}

/**
 * Return true if the CAPTCHA overlay is currently visible.
 */
export async function isCaptchaVisible(page: Page) {
  return page.getByTestId("captcha-overlay").isVisible();
}
