import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { chatSessions, chatMessages, rateLimitLogs } from "~/server/db/schema";

/**
 * Database helper utilities for Playwright tests
 * Handles database cleanup and session management
 */

/**
 * Clean up all test data from the database
 * Should be called before or after each test
 */
export async function cleanupDatabase() {
  try {
    // Delete in reverse order of dependencies
    // Silently ignore if tables don't exist yet
    try {
      await db.delete(chatMessages);
    } catch (e) {
      // Table might not exist yet, ignore
    }
    try {
      await db.delete(rateLimitLogs);
    } catch (e) {
      // Table might not exist yet, ignore
    }
    try {
      await db.delete(chatSessions);
    } catch (e) {
      // Table might not exist yet, ignore
    }
  } catch (error) {
    console.error("Failed to cleanup database:", error);
    throw error;
  }
}

/**
 * Create a test session directly in the database
 * Useful for bypassing the CAPTCHA flow in tests
 */
export async function createTestSession(options?: {
  verified?: boolean;
  messageCount?: number;
  expiresInMinutes?: number;
}) {
  const sessionId = `session_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + (options?.expiresInMinutes ?? 30) * 60 * 1000,
  );

  const [session] = await db
    .insert(chatSessions)
    .values({
      sessionId,
      verified: options?.verified ?? true,
      messageCount: options?.messageCount ?? 0,
      createdAt: now,
      lastActivityAt: now,
      expiresAt,
    })
    .returning();

  return session;
}

/**
 * Get session by ID from the database
 */
export async function getSession(sessionId: string) {
  const [session] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.sessionId, sessionId));

  return session;
}

/**
 * Update session message count
 */
export async function updateSessionMessageCount(
  sessionId: string,
  count: number,
) {
  await db
    .update(chatSessions)
    .set({
      messageCount: count,
      lastActivityAt: new Date(),
    })
    .where(eq(chatSessions.sessionId, sessionId));
}

/**
 * Create expired test session
 * Useful for testing session expiry handling
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
 * Add rate limit logs for a session
 * Useful for testing rate limiting behavior
 */
export async function addRateLimitLogs(
  sessionId: string,
  count: number,
  action: string = "message",
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

/**
 * Verify database is using in-memory SQLite
 * This ensures we're not accidentally affecting real data
 */
export function verifyTestDatabase() {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl !== ":memory:" && !dbUrl?.includes("test")) {
    throw new Error(
      `Tests must use in-memory or test database. Current: ${dbUrl}`,
    );
  }
}
