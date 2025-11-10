import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "~/server/db";
import { rateLimitLogs } from "~/server/db/schema";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check if a rate limit has been exceeded
 * @param identifier - Unique identifier (session ID or IP hash)
 * @param action - Action type ('message' | 'session_create')
 * @param maxRequests - Maximum number of requests allowed in the time window
 * @param windowMs - Time window in milliseconds
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  maxRequests: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  // Clean up old logs (older than window)
  await db
    .delete(rateLimitLogs)
    .where(
      and(
        eq(rateLimitLogs.identifier, identifier),
        eq(rateLimitLogs.action, action),
        lt(rateLimitLogs.createdAt, windowStart),
      ),
    );

  // Count requests in current window
  const recentLogs = await db.query.rateLimitLogs.findMany({
    where: and(
      eq(rateLimitLogs.identifier, identifier),
      eq(rateLimitLogs.action, action),
      gte(rateLimitLogs.createdAt, windowStart),
    ),
  });

  const requestCount = recentLogs.length;
  const remaining = Math.max(0, maxRequests - requestCount);
  const allowed = requestCount < maxRequests;

  if (allowed) {
    // Log this request
    await db.insert(rateLimitLogs).values({
      identifier,
      action,
      createdAt: now,
    });
  }

  const resetAt = new Date(
    (recentLogs[0]?.createdAt?.getTime() ?? now.getTime()) + windowMs,
  );

  return { allowed, remaining, resetAt };
}

/**
 * Check message rate limit (default: 10 messages per minute)
 * Configurable via MESSAGE_RATE_LIMIT environment variable
 */
export async function checkMessageRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  const limit = parseInt(process.env.MESSAGE_RATE_LIMIT ?? "10", 10);
  return checkRateLimit(identifier, "message", limit, 60 * 1000);
}

/**
 * Check session creation rate limit (5 sessions per hour)
 */
export async function checkSessionRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  return checkRateLimit(identifier, "session_create", 5, 60 * 60 * 1000);
}

/**
 * Check email sending rate limit (3 emails per hour per session)
 */
export async function checkEmailRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  return checkRateLimit(identifier, "email_send", 3, 60 * 60 * 1000);
}
