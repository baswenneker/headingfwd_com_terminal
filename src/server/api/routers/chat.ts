import { createHash, randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { inArray, lt } from "drizzle-orm";
import { z } from "zod";
import { env } from "~/env";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { chatMessages, chatSessions, pendingEmails } from "~/server/db/schema";
import { checkSessionRateLimit } from "~/server/services/rate-limiter";
import { verifyTurnstileToken } from "~/server/services/turnstile";
import { logError } from "~/lib/errors";

/**
 * Generate a cryptographically secure unique session ID
 */
function generateSessionId(): string {
  return `session_${randomUUID()}`;
}

/**
 * The client address behind this request: the first entry of
 * `x-forwarded-for` (what Vercel sets), else `x-real-ip`, else empty.
 */
function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded?.length
    ? forwarded
    : (headers.get("x-real-ip")?.trim() ?? "");
}

/**
 * A stable, non-reversible key for that client, so the address itself is
 * never stored.
 */
function clientKey(headers: Headers): string {
  const ip = clientIp(headers);
  return createHash("sha256")
    .update(ip.length > 0 ? ip : "unknown")
    .digest("hex");
}

export const chatRouter = createTRPCRouter({
  /**
   * Initialize a new chat session
   * Requires Turnstile token verification
   * Returns a session ID that must be used for subsequent messages
   */
  initSession: publicProcedure
    .input(
      z.object({
        turnstileToken: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify Turnstile token
      const verification = await verifyTurnstileToken(input.turnstileToken, {
        remoteIp: clientIp(ctx.headers),
      });

      if (!verification.success) {
        logError("tRPC initSession", "CAPTCHA verification failed", {
          error: verification.error,
        });
        throw new TRPCError({
          code: "FORBIDDEN",
          message: verification.error ?? "CAPTCHA verification failed",
        });
      }

      // Cap how many sessions one client can mint, so a solved challenge buys
      // a quota rather than an unlimited supply of them. Counted only AFTER
      // the challenge passed: a claim before verification would let five
      // garbage tokens lock every visitor behind the same address out for an
      // hour. Skipped wherever the CAPTCHA itself is switched off — the same
      // gate, dev and the e2e suite.
      if (env.NEXT_PUBLIC_DISABLE_CAPTCHA !== "true") {
        const sessionLimit = await checkSessionRateLimit(
          clientKey(ctx.headers),
        );
        if (!sessionLimit.allowed) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message:
              "Too many sessions started from this network. Please try again later.",
          });
        }
      }

      const sessionId = generateSessionId();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

      // Housekeeping, on the one call a visitor makes at most a few times an
      // hour: sessions a day past their expiry, the turns stored under them,
      // and any preview left unconfirmed.
      const staleBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const expired = await ctx.db
        .delete(chatSessions)
        .where(lt(chatSessions.expiresAt, staleBefore))
        .returning({ sessionId: chatSessions.sessionId });
      if (expired.length > 0) {
        const ids = expired.map((row) => row.sessionId);
        await ctx.db
          .delete(chatMessages)
          .where(inArray(chatMessages.sessionId, ids));
        await ctx.db
          .delete(pendingEmails)
          .where(inArray(pendingEmails.sessionId, ids));
      }
      await ctx.db
        .delete(pendingEmails)
        .where(
          lt(pendingEmails.createdAt, new Date(now.getTime() - 60 * 60 * 1000)),
        );

      // Create session in database
      await ctx.db.insert(chatSessions).values({
        sessionId,
        verified: true, // Verified via Turnstile
        messageCount: 0,
        createdAt: now,
        lastActivityAt: now,
        expiresAt,
      });

      return {
        sessionId,
        expiresAt: expiresAt.toISOString(),
      };
    }),
});
