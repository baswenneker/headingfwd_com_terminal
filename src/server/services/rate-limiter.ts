import { and, asc, eq, gte, lt, lte, or } from "drizzle-orm";
import { env } from "~/env";
import { db } from "~/server/db";
import { rateLimitLogs } from "~/server/db/schema";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * The longest window any caller below uses. Rows older than this are of no use
 * to any identifier, so every call sweeps them away regardless of identifier.
 */
const MAX_WINDOW_MS = 60 * 60 * 1000;

/**
 * Check if a rate limit has been exceeded
 *
 * The row for this request is written *before* the count is taken, so two
 * calls that overlap can never both read a stale count: the n-th writer always
 * counts at least n rows. By default a request that lands over the cap keeps
 * its row for the rest of the window — the window counts attempts, not
 * successes. With `countDenied: false` a refused request removes its own row
 * again, so a client that keeps retrying past the cap does not push its own
 * reset further out. The row still exists while the count is taken, so the
 * overlap guarantee above holds either way.
 *
 * @param identifier - Unique identifier (session ID or IP hash)
 * @param action - Action type ('message' | 'session_create')
 * @param maxRequests - Maximum number of requests allowed in the time window
 * @param windowMs - Time window in milliseconds
 * @param options.countDenied - Whether a refused request uses up a slot (default true)
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  maxRequests: number,
  windowMs: number,
  options: { countDenied?: boolean } = {},
): Promise<RateLimitResult> {
  const countDenied = options.countDenied ?? true;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);
  const globalCutoff = new Date(now.getTime() - MAX_WINDOW_MS);

  // Housekeeping in one statement: this identifier's rows that fell out of its
  // window, plus every row older than the longest window we ever look at.
  await db
    .delete(rateLimitLogs)
    .where(
      or(
        lt(rateLimitLogs.createdAt, globalCutoff),
        and(
          eq(rateLimitLogs.identifier, identifier),
          eq(rateLimitLogs.action, action),
          lt(rateLimitLogs.createdAt, windowStart),
        ),
      ),
    );

  // Claim a slot first, then count the slots claimed up to and including this
  // one. The row id orders the claims, so overlapping calls each see their own
  // position in the queue instead of a shared, stale total.
  const [claim] = await db
    .insert(rateLimitLogs)
    .values({ identifier, action, createdAt: now })
    .returning({ id: rateLimitLogs.id });

  const recentLogs = await db
    .select({ createdAt: rateLimitLogs.createdAt })
    .from(rateLimitLogs)
    .where(
      and(
        eq(rateLimitLogs.identifier, identifier),
        eq(rateLimitLogs.action, action),
        gte(rateLimitLogs.createdAt, windowStart),
        claim ? lte(rateLimitLogs.id, claim.id) : undefined,
      ),
    )
    .orderBy(asc(rateLimitLogs.createdAt));

  const requestCount = recentLogs.length;
  const remaining = Math.max(0, maxRequests - requestCount);
  const allowed = requestCount <= maxRequests;

  if (!allowed && !countDenied && claim) {
    await db.delete(rateLimitLogs).where(eq(rateLimitLogs.id, claim.id));
  }

  const resetAt = new Date(
    (recentLogs[0]?.createdAt?.getTime() ?? now.getTime()) + windowMs,
  );

  return { allowed, remaining, resetAt };
}

/**
 * A limit read from the environment. An empty, non-numeric, zero or negative
 * value falls back to the default instead of becoming `NaN` (which refuses
 * every request) or a cap that lets nobody through.
 */
export function limitFromEnv(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Check message rate limit (default: 10 messages per minute)
 * Configurable via MESSAGE_RATE_LIMIT environment variable
 */
export async function checkMessageRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  const limit = limitFromEnv(env.MESSAGE_RATE_LIMIT, 10);
  return checkRateLimit(identifier, "message", limit, 60 * 1000);
}

/**
 * Check session creation rate limit (default: 20 sessions per hour per client)
 * Configurable via SESSION_RATE_LIMIT environment variable. A refused attempt
 * does not count: an office behind one address that hits the cap gets its
 * slots back as the oldest sessions age out, however often it retries.
 */
export async function checkSessionRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  const limit = limitFromEnv(env.SESSION_RATE_LIMIT, 20);
  return checkRateLimit(identifier, "session_create", limit, MAX_WINDOW_MS, {
    countDenied: false,
  });
}

/**
 * Check email sending rate limit (3 emails per hour per session)
 */
export async function checkEmailRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  return checkRateLimit(identifier, "email_send", 3, MAX_WINDOW_MS);
}
