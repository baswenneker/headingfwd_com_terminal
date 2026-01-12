import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/server/db";
import { chatSessions } from "~/server/db/schema";
import { createErrorJsonResponse, logError, ErrorCode } from "~/lib/errors";
import {
  executeCommand,
  getAvailableCommands,
} from "~/server/services/command-executor";

/**
 * Commands API Route
 *
 * Handles command execution without LLM involvement.
 * Commands provide instant responses and don't count toward rate limits.
 */

// Allow responses up to 10 seconds (though commands are typically instant)
export const maxDuration = 10;

const CommandRequestSchema = z.object({
  command: z.string().min(1).max(256),
  sessionId: z.string(),
});

/**
 * POST /api/commands
 * Execute a command and return the response immediately
 */
export async function POST(req: Request) {
  try {
    // Parse and validate request
    const body = (await req.json()) as unknown;
    const validatedRequest = CommandRequestSchema.safeParse(body);

    if (!validatedRequest.success) {
      return createErrorJsonResponse(
        "Invalid request format",
        400,
        ErrorCode.INVALID_INPUT,
        { errors: validatedRequest.error.issues },
      );
    }

    const { command, sessionId } = validatedRequest.data;

    // Validate command format (must start with /)
    if (!command.startsWith("/")) {
      return createErrorJsonResponse(
        "Commands must start with /",
        400,
        ErrorCode.INVALID_INPUT,
      );
    }

    // NOTE: We intentionally skip rate limiting for commands
    // Commands are instant, don't consume LLM credits, and should be freely accessible
    // This allows users to query /help, /contact, etc. without hitting limits

    // Validate session exists and is not expired
    const session = await db.query.chatSessions.findFirst({
      where: eq(chatSessions.sessionId, sessionId),
    });

    if (!session) {
      logError("Commands API", "Session not found", { sessionId, command });
      return createErrorJsonResponse(
        "Session not found. Please refresh and start a new session.",
        404,
        ErrorCode.SESSION_NOT_FOUND,
      );
    }

    const now = new Date();
    if (session.expiresAt < now) {
      logError("Commands API", "Session expired", { sessionId, command });
      return createErrorJsonResponse(
        "Session expired. Please refresh and start a new session.",
        403,
        ErrorCode.SESSION_EXPIRED,
      );
    }

    // Execute command (NO LLM involved)
    const result = await executeCommand(command);

    if (!result.success) {
      logError("Commands API", "Command execution failed", {
        sessionId,
        command,
        error: result.error,
      });
      return createErrorJsonResponse(
        result.error ?? "Unknown command",
        result.statusCode ?? 400,
        ErrorCode.INVALID_INPUT,
      );
    }

    // Update session activity (same as chat API)
    await db
      .update(chatSessions)
      .set({
        lastActivityAt: now,
        messageCount: session.messageCount + 1,
      })
      .where(eq(chatSessions.sessionId, sessionId));

    // Return command response (non-streaming JSON)
    return new Response(
      JSON.stringify({
        success: true,
        command,
        response: result.response,
        openUrl: result.openUrl,
        metadata: result.metadata,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    logError("Commands API", "Unexpected error", { error });
    return createErrorJsonResponse(
      error instanceof Error ? error.message : "Internal server error",
      500,
      ErrorCode.INTERNAL_ERROR,
    );
  }
}

/**
 * GET /api/commands
 * List all available commands
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    // Optional: validate session for security
    if (sessionId) {
      const session = await db.query.chatSessions.findFirst({
        where: eq(chatSessions.sessionId, sessionId),
      });

      if (!session || session.expiresAt < new Date()) {
        return createErrorJsonResponse(
          "Invalid or expired session",
          403,
          ErrorCode.SESSION_EXPIRED,
        );
      }
    }

    // Return list of available commands
    const commands = getAvailableCommands();

    return new Response(
      JSON.stringify({
        success: true,
        commands,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    logError("Commands API", "Failed to fetch commands", { error });
    return createErrorJsonResponse(
      "Failed to fetch commands",
      500,
      ErrorCode.INTERNAL_ERROR,
    );
  }
}
