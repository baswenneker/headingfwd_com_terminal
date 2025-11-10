import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { chatSessions } from "~/server/db/schema";
import { verifyTurnstileToken } from "~/server/services/turnstile";
import { logError } from "~/lib/errors";

/**
 * Generate a cryptographically secure unique session ID
 */
function generateSessionId(): string {
  return `session_${randomUUID()}`;
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
      const verification = await verifyTurnstileToken(input.turnstileToken);

      if (!verification.success) {
        logError("tRPC initSession", "CAPTCHA verification failed", {
          error: verification.error,
        });
        throw new TRPCError({
          code: "FORBIDDEN",
          message: verification.error ?? "CAPTCHA verification failed",
        });
      }

      const sessionId = generateSessionId();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes

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
