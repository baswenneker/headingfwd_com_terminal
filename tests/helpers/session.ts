import { type Page } from "@playwright/test";

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
 *
 * Kept intentionally small: every export here is used by a real spec. A
 * larger set of helpers (setupTestSession, sendTerminalMessage,
 * getLastMessage, getAllMessages, isCaptchaVisible) used to live here
 * unreferenced by any spec — removed rather than kept as dead code (#13 T7).
 * `sessionIdRef` in terminal.tsx is only ever set by a real `initSession`
 * tRPC call, so a pre-made session cannot be handed to the browser this way;
 * see tests/helpers/database.ts's `expireSession` for how the session-expiry
 * test works around that instead.
 */

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
