import { test, expect } from "@playwright/test";
import { desc } from "drizzle-orm";
import { db } from "~/server/db";
import { chatSessions } from "~/server/db/schema";
import {
  navigateToTerminal,
  sendAIMessage,
  waitForTerminalReady,
} from "../helpers/session";
import {
  addRateLimitLogs,
  expireSession,
} from "../helpers/database";
import { mockChatSuccess, clearChatMock } from "../helpers/api-mocks";

/**
 * The parts of the session lifecycle that only the REAL /api/chat handler can
 * prove: an expired session's 403 and a rate limiter's 429 as the handler
 * itself produces them, not a `page.route` stand-in for either.
 *
 * `sessionIdRef` in terminal.tsx is only ever set through a real, successful
 * `initSession` tRPC call — there is no way to hand the browser a pre-made
 * session id — so both tests let the browser create its own session first
 * (bootstrapped with one /api/chat mock, to avoid burning a real OpenAI call
 * just to get a session), then unroute the mock and manipulate the exact row
 * the browser is holding before sending the message that must hit the real
 * handler.
 */

/** The chatSessions row most recently created by the browser under test. */
async function latestSessionId(): Promise<string> {
  const [row] = await db
    .select({ sessionId: chatSessions.sessionId })
    .from(chatSessions)
    .orderBy(desc(chatSessions.id))
    .limit(1);
  if (!row) throw new Error("No chat session found — did the bootstrap message run?");
  return row.sessionId;
}

test.describe("Session lifecycle against the real handler", () => {
  test.beforeEach(async ({ page }) => {
    await navigateToTerminal(page);
    await waitForTerminalReady(page);
  });

  test("an expired session shows a visible error line", async ({ page }) => {
    // Bootstrap a real session via the real tRPC initSession call, with
    // /api/chat mocked just for this one message so no real OpenAI call is
    // made yet.
    await mockChatSuccess(page, "Hello!");
    await sendAIMessage(page, "Hi there");

    const sessionId = await latestSessionId();
    await expireSession(sessionId);

    // Remove the mock so the next request reaches the real /api/chat route,
    // which checks expiry before anything else that could involve OpenAI.
    await clearChatMock(page);

    const input = page.getByTestId("terminal-input");
    await input.fill("Are you still there?");
    await input.press("Enter");

    const errorEl = page.locator('[data-testid="error-message"]').last();
    await expect(errorEl).toBeVisible({ timeout: 10000 });
    await expect(errorEl).toContainText("Session expired");
  });

  test("the 11th message in a minute gets a real 429 from the real handler", async ({
    page,
  }) => {
    // Bootstrap a real session the same way, so its sessionId exists in the
    // database before rate-limit rows are seeded against it.
    await mockChatSuccess(page, "Hello!");
    await sendAIMessage(page, "Hi there");

    const sessionId = await latestSessionId();

    // Seed exactly MESSAGE_RATE_LIMIT prior "message" attempts. The bootstrap
    // message above never touched the rate-limit table (it was intercepted
    // by page.route before reaching the server), so this is the whole count
    // the real handler will see.
    const limit = Number(process.env.MESSAGE_RATE_LIMIT ?? "10");
    await addRateLimitLogs(sessionId, limit);

    // Remove the mock: this next request must reach the real handler, which
    // rejects on the rate limit before ever constructing a model call, so
    // OpenAI is never reached.
    await clearChatMock(page);

    const input = page.getByTestId("terminal-input");
    await input.fill("One message too many");
    await input.press("Enter");

    const errorEl = page.locator('[data-testid="error-message"]').last();
    await expect(errorEl).toBeVisible({ timeout: 10000 });
    await expect(errorEl).toContainText("Rate limit exceeded");
  });
});
