import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { chatSessions, rateLimitLogs } from "~/server/db/schema";

/**
 * Database helper utilities for Playwright tests.
 *
 * Kept intentionally small: every export here is used by a real spec (see
 * tests/e2e/session-lifecycle.spec.ts). A larger set of helpers
 * (createTestSession, getSession, updateSessionMessageCount,
 * cleanupDatabase, verifyTestDatabase) used to live here unreferenced by any
 * spec — removed rather than kept as dead code (#13 T7).
 */

/**
 * Create an expired test session directly in the database — a session whose
 * `expiresAt` is already in the past, verified, never used. Useful for
 * hitting the real /api/chat handler's expired-session branch without going
 * through the CAPTCHA flow.
 */
export async function createExpiredSession() {
  const sessionId = `session_expired_${Date.now()}`;
  const now = new Date();
  const expiredTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

  const [session] = await db
    .insert(chatSessions)
    .values({
      sessionId,
      verified: true,
      messageCount: 0,
      createdAt: expiredTime,
      lastActivityAt: expiredTime,
      expiresAt: expiredTime, // Already expired
    })
    .returning();

  return session;
}

/**
 * Force an EXISTING session (one the browser already created for itself
 * through the real CAPTCHA-disabled flow) into the past. `sessionIdRef` in
 * terminal.tsx is only ever set by a real `initSession` tRPC call — there is
 * no way to hand the browser a session id created out of band — so testing
 * "the browser's own session expired under it" means aging the row the
 * browser is already holding, rather than minting an unrelated one.
 */
export async function expireSession(sessionId: string) {
  const expiredTime = new Date(Date.now() - 60 * 60 * 1000);
  await db
    .update(chatSessions)
    .set({ expiresAt: expiredTime, lastActivityAt: expiredTime })
    .where(eq(chatSessions.sessionId, sessionId));
}

/**
 * Add rate limit logs for a session.
 * Useful for testing rate limiting behavior
 */
export async function addRateLimitLogs(
  sessionId: string,
  count: number,
  action = "message",
) {
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    await db.insert(rateLimitLogs).values({
      identifier: sessionId,
      action,
      createdAt: new Date(now - i * 1000), // Spread across last N seconds
    });
  }
}
