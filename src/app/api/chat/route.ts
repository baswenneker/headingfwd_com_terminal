import { createHash, randomUUID } from "node:crypto";
import { openai } from "@ai-sdk/openai";
import { and, desc, eq, gte, lt, or } from "drizzle-orm";
import * as ai from "ai";
import { tool, type ModelMessage, stepCountIs } from "ai";
import { z } from "zod";
import { wrapAISDK } from "langsmith/experimental/vercel";
import { db } from "~/server/db";
import { chatMessages, chatSessions, pendingEmails } from "~/server/db/schema";
import {
  checkMessageRateLimit,
  checkEmailRateLimit,
} from "~/server/services/rate-limiter";
import { sendContactEmail } from "~/server/services/email";
import { env } from "~/env";
import { STACK } from "~/content/site-content";
import {
  createErrorJsonResponse,
  logError,
  redactSessionId,
  ErrorCode,
} from "~/lib/errors";

// Wrap AI SDK with LangSmith for tracing.
// NOTE: with LANGSMITH_TRACING=true this sends the full prompt, the user's
// text and every tool input — including the sender's email address — to
// LangSmith. Keep it off unless a trace is actually being read.
const { streamText } = wrapAISDK(ai);

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

/**
 * Chat API route using Vercel AI SDK
 * Handles streaming chat completions with OpenAI
 * Traces all interactions to LangSmith for observability
 */
const MAX_MESSAGE_LENGTH = 4000;

/** How many stored turns at most go back to the model. */
const MAX_HISTORY_TURNS = 30;
/** And how many characters of them at most. */
const MAX_HISTORY_CHARS = 60_000;
/** How long a shown preview stays confirmable. */
const PREVIEW_TTL_MS = 10 * 60 * 1000;

/**
 * The shape the route accepts. Anything else is a 400: the handler works from
 * these fields only, so a body that does not fit them has nothing to offer it.
 */
const chatRequestSchema = z.object({
  messages: z
    .array(
      z.looseObject({
        id: z.string().optional(),
        role: z.string(),
        parts: z.array(
          z.looseObject({ type: z.string(), text: z.string().optional() }),
        ),
      }),
    )
    .min(1),
  sessionId: z.string().min(1),
});

/** The text of a message, taken from its text parts only. */
function textOf(parts: { type: string; text?: string }[]): string {
  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text!)
    .join("\n")
    .trim();
}

/** A stable fingerprint of a message body, so a preview can be matched. */
function hashMessage(message: string): string {
  return createHash("sha256").update(message.trim()).digest("hex");
}

/**
 * The conversation as the server recorded it. The request contributes the new
 * user text and nothing else, so an assistant turn in the model input is one
 * this server produced and stored.
 */
async function loadHistory(sessionId: string): Promise<ModelMessage[]> {
  const rows = await db
    .select({ role: chatMessages.role, content: chatMessages.content })
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(desc(chatMessages.id))
    .limit(MAX_HISTORY_TURNS);

  const kept: typeof rows = [];
  let chars = 0;
  for (const row of rows) {
    chars += row.content.length;
    if (chars > MAX_HISTORY_CHARS) break;
    kept.push(row);
  }

  return kept
    .reverse()
    .map((row) =>
      row.role === "assistant"
        ? ({ role: "assistant", content: row.content } satisfies ModelMessage)
        : ({ role: "user", content: row.content } satisfies ModelMessage),
    );
}

export async function POST(req: Request) {
  try {
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return createErrorJsonResponse(
        "Invalid request body",
        400,
        ErrorCode.INVALID_INPUT,
      );
    }

    const parsed = chatRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return createErrorJsonResponse(
        "Invalid request body",
        400,
        ErrorCode.INVALID_INPUT,
      );
    }

    const { messages, sessionId } = parsed.data;
    const lastMessage = messages[messages.length - 1]!;

    // Validate message length using JSON stringification as approximation
    // This prevents excessively large payloads while being type-safe
    const messageSize = JSON.stringify(lastMessage).length;
    if (messageSize > MAX_MESSAGE_LENGTH) {
      return createErrorJsonResponse(
        `Message too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters.`,
        400,
        ErrorCode.INVALID_INPUT,
      );
    }

    // Only the new user text is taken from the request. Assistant, tool and
    // system parts a client sends along are dropped here and never rebuilt.
    const userText =
      lastMessage.role === "user" ? textOf(lastMessage.parts) : "";
    if (userText.length === 0) {
      return createErrorJsonResponse(
        "Invalid request body",
        400,
        ErrorCode.INVALID_INPUT,
      );
    }

    // Validate OpenAI API key is configured
    if (!env.OPENAI_API_KEY) {
      logError("Chat API", "OpenAI API key not configured", {
        session: redactSessionId(sessionId),
      });
      return createErrorJsonResponse(
        "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.",
        500,
        ErrorCode.MISSING_CONFIG,
      );
    }

    // Validate the session BEFORE the rate limiter, so an identifier that is
    // not a real session never reaches the rate-limit table.
    const session = await db.query.chatSessions.findFirst({
      where: eq(chatSessions.sessionId, sessionId),
    });

    if (!session) {
      logError("Chat API", "Session not found", {
        session: redactSessionId(sessionId),
      });
      return createErrorJsonResponse(
        "Session not found. Please refresh and start a new session.",
        404,
        ErrorCode.SESSION_NOT_FOUND,
      );
    }

    // A session only counts once it has passed the CAPTCHA at initSession.
    if (session.verified !== true) {
      logError("Chat API", "Session not verified", {
        session: redactSessionId(sessionId),
      });
      return createErrorJsonResponse(
        "Session not found. Please refresh and start a new session.",
        403,
        ErrorCode.FORBIDDEN,
      );
    }

    const now = new Date();
    if (session.expiresAt < now) {
      logError("Chat API", "Session expired", {
        session: redactSessionId(sessionId),
      });
      return createErrorJsonResponse(
        "Session expired. Please refresh and start a new session.",
        403,
        ErrorCode.SESSION_EXPIRED,
      );
    }

    // Rate limit the validated session
    const rateLimit = await checkMessageRateLimit(sessionId);
    if (!rateLimit.allowed) {
      logError("Chat API", "Rate limit exceeded", {
        session: redactSessionId(sessionId),
        remaining: rateLimit.remaining,
      });
      return createErrorJsonResponse(
        `Rate limit exceeded. Please wait before sending more messages. (${rateLimit.remaining} remaining)`,
        429,
        ErrorCode.RATE_LIMIT_EXCEEDED,
        { remaining: rateLimit.remaining },
      );
    }

    // Update session activity
    await db
      .update(chatSessions)
      .set({
        lastActivityAt: now,
        messageCount: session.messageCount + 1,
      })
      .where(eq(chatSessions.sessionId, sessionId));

    // Build the model input from the stored conversation plus the new user
    // text, and record that text before the model sees it.
    const history = await loadHistory(sessionId);
    const modelMessages: ModelMessage[] = [
      ...history,
      { role: "user", content: userText },
    ];

    await db.insert(chatMessages).values({
      sessionId,
      role: "user",
      content: userText,
      createdAt: now,
    });

    // Stream AI response with tools - automatically traced by LangSmith
    const result = streamText({
      model: openai("gpt-4.1-mini"), // Using 4.1-mini for better tool calling
      stopWhen: stepCountIs(20), // Stop after 20 steps maximum
      system: `You are Bas's AI assistant on his personal website. You're helpful, friendly, and knowledgeable about AI engineering.

## Instructions:
- Respond to user queries about Bas, his experience, expertise, and the AI engineering services he offers. Nothing else.
- Talk about Bas in the third person.
- Keep answers concise and professional.
- Everything you know about Bas is in this prompt. Your only tools are previewMessage and sendMessage, and they are for the email flow below — nothing else.

Keep responses concise and friendly.

IMPORTANT: Do NOT answer questions about Bas's personal life or anything not professional. HeadingFWD is based in Delft, the Netherlands; that is public.
Also, if being asked questions outside your knowledge, respond with "I'm sorry, I don't have that information." Do NOT make up answers.

## About Bas:
- Lives in Delft, The Netherlands
- AI Lead/Engineer specializing in Generative AI implementations
- Expertise in LangChain, LangGraph, OpenAI, Anthropic, and other LLM providers
- Builds production-ready AI agents, assistants, virtual employees and workflows
- Stack: ${STACK.join(" · ")}
- LinkedIn profile: https://www.linkedin.com/in/baswenneker

If being asked about his experience, mention:
- Started career as a software engineer while studying Computer Science at TU Delft
- Worked as an IT consultant before focusing on innovation, lean startup and design thinking
- Had a webshop and several software startups (one acquired)
- Started developing with LLMs when GPT-3 was released in 2020
- Delivered multiple AI projects for clients in various industries
- Skilled in building AI agents with LangChain and LangGraph
- Experienced with vector databases, RAG systems, and LLM integrations
- Fullstack developer with a preference for Python/FastAPI backends and TypeScript/Next.js frontends

## BLOG:
Bas publishes long-form writing on AI engineering on this site, at /blog. Everything he writes is published there first and only then reposted elsewhere.
- If someone asks whether Bas writes, blogs, or has articles: say yes and suggest "Type **/blog** to read it."
- You do NOT know the contents or titles of individual posts. Never invent one. Point people at /blog and let them read.

## LINKEDIN PROFILE SUGGESTIONS:
When users express interest in learning more about Bas, want additional details about his background, or explicitly ask about his LinkedIn:
- Suggest: "Would you like to see his LinkedIn profile? Type **/linkedin** to open it."
- This applies when users say things like: "want to know more", "tell me more", "learn more about him", "see his profile", "show me his LinkedIn", etc.
- The /linkedin command will automatically open his profile in a new tab

## EMAIL SENDING RULES:
When a user wants to send a message/email to Bas:

STEP 1 - GATHER INFO:
- Ask for their email address (if not provided)
- Ask what message they'd like to send to Bas
- If the message is just a greeting ("Hi", "Hello", "Hey") with nothing else, ask them to elaborate
- Accept ALL other messages including: "Quick question", "I need help", "Test message", etc.

STEP 2 - SHOW PREVIEW:
Once you have both email and message, call the previewMessage tool with them, then show the preview text it returns to the user exactly as returned. It has this shape (each line on its own line):

📧 Email Preview:

━━━━━━━━━━━━━━━━━━━━━━

From: [their email]

To: Bas

Message:

[their message]

━━━━━━━━━━━━━━━━━━━━━━

Should I send this email to Bas? (yes/no)

STEP 3 - WAIT FOR CONFIRMATION:
After showing the preview, if user says ANY of these words: "yes", "send", "send it", "confirm", "ok", "okay", "go ahead", "please", "do it" → IMMEDIATELY call the sendMessage tool with userConfirmed: true.

DO NOT call any other tools at this step. Do not call previewMessage again. Only call sendMessage.

If user says "no", "wait", "stop", "cancel" → DO NOT send. Respond with exactly: "No problem, the message was not sent. If you need anything else, just let me know!"

STEP 4 - AFTER SENDING:
After you call sendMessage, you MUST immediately generate a text response to confirm success. Do not just rely on the tool's return value - you must explicitly respond to the user with a message like:
"✅ Your message has been sent to Bas! He reads every one himself and replies within two working days."

IMPORTANT: Always include text in your response after calling the tool. The tool call alone is not enough - the user needs to see your confirmation message.
`,
      messages: modelMessages,
      onFinish: async ({ text }) => {
        const assistantText = text.trim();
        if (assistantText.length === 0) return;
        await db.insert(chatMessages).values({
          sessionId,
          role: "assistant",
          content: assistantText.slice(0, MAX_HISTORY_CHARS),
          createdAt: new Date(),
        });
      },
      tools: {
        previewMessage: tool({
          description:
            "Register the email preview the user is about to see. Call this once you have both the sender's email address and the message, before showing the preview. Returns the preview text to show the user verbatim.",
          inputSchema: z.object({
            // NOTE: no .email() here, for the same reason as in sendMessage.
            senderEmail: z
              .string()
              .describe(
                "The sender's email address for Bas to reply to. Must be a valid email address.",
              ),
            message: z
              .string()
              .min(10, "Message must be at least 10 characters")
              .max(2000, "Message must be less than 2000 characters")
              .describe("The message content to send to Bas"),
          }),
          execute: async ({ senderEmail, message }) => {
            if (!z.string().email().safeParse(senderEmail).success) {
              return {
                success: false,
                error:
                  "That does not look like a valid email address. Please ask the user for a valid one.",
              };
            }

            const shownAt = new Date();
            // One live preview per session, and no stale ones anywhere.
            await db
              .delete(pendingEmails)
              .where(
                or(
                  eq(pendingEmails.sessionId, sessionId),
                  lt(
                    pendingEmails.createdAt,
                    new Date(shownAt.getTime() - PREVIEW_TTL_MS),
                  ),
                ),
              );
            await db.insert(pendingEmails).values({
              sessionId,
              senderEmail: senderEmail.trim().toLowerCase(),
              messageHash: hashMessage(message),
              nonce: randomUUID(),
              createdAt: shownAt,
            });

            return {
              success: true,
              preview: [
                "📧 Email Preview:",
                "",
                "━━━━━━━━━━━━━━━━━━━━━━",
                "",
                `From: ${senderEmail.trim()}`,
                "",
                // "To: Bas", not the address. /contact deliberately does not
                // publish the address, and the preview used to hand it to
                // anyone who typed two lines into the chat (#13 F5).
                "To: Bas",
                "",
                "Message:",
                "",
                message,
                "",
                "━━━━━━━━━━━━━━━━━━━━━━",
                "",
                "Should I send this email to Bas? (yes/no)",
              ].join("\n"),
            };
          },
        }),
        sendMessage: tool({
          description:
            "Send a message to Bas via email. ONLY call this after showing the user a preview and getting explicit confirmation. The full conversation history will be included automatically.",
          inputSchema: z.object({
            // NOTE: no .email() here. Zod 4 turns it into a lookahead `pattern`
            // that the OpenAI Responses API rejects, which makes the whole
            // response come back empty. Validated in execute() instead.
            senderEmail: z
              .string()
              .describe(
                "The sender's email address for Bas to reply to. Must be a valid email address.",
              ),
            message: z
              .string()
              .min(10, "Message must be at least 10 characters")
              .max(2000, "Message must be less than 2000 characters")
              .describe("The message content to send to Bas"),
            userConfirmed: z
              .boolean()
              .describe(
                "Must be true. Only set to true if user explicitly confirmed after seeing the preview (said 'yes', 'send it', 'confirm', etc)",
              ),
          }),
          execute: async (
            { senderEmail, message, userConfirmed },
            { messages: _messages },
          ) => {
            // Safety check: Never send without confirmation
            if (!userConfirmed) {
              return {
                success: false,
                error:
                  "Cannot send email without explicit user confirmation. Please show a preview and ask the user to confirm first.",
              };
            }

            // Validate the email address here, since the tool schema cannot
            // carry a pattern the OpenAI Responses API accepts.
            if (!z.string().email().safeParse(senderEmail).success) {
              return {
                success: false,
                error:
                  "That does not look like a valid email address. Please ask the user for a valid one.",
              };
            }

            // The preview has to be one this server showed: a matching,
            // unexpired record for this session, sender and message.
            const confirmedAt = new Date();
            const pending = await db.query.pendingEmails.findFirst({
              where: and(
                eq(pendingEmails.sessionId, sessionId),
                eq(pendingEmails.senderEmail, senderEmail.trim().toLowerCase()),
                eq(pendingEmails.messageHash, hashMessage(message)),
                gte(
                  pendingEmails.createdAt,
                  new Date(confirmedAt.getTime() - PREVIEW_TTL_MS),
                ),
              ),
            });

            if (!pending) {
              return {
                success: false,
                error:
                  "No preview is waiting for confirmation. Call previewMessage with the email address and the message, show the preview to the user and ask them to confirm first.",
              };
            }

            // One preview, one send: claim the row atomically, so two
            // overlapping confirmations cannot both pass the lookup above.
            const claimed = await db
              .delete(pendingEmails)
              .where(eq(pendingEmails.id, pending.id))
              .returning({ id: pendingEmails.id });
            if (claimed.length !== 1) {
              return {
                success: false,
                error:
                  "This preview was already confirmed. Ask the user whether they want to send another message.",
              };
            }

            // Check email rate limit
            const rateLimit = await checkEmailRateLimit(sessionId);
            if (!rateLimit.allowed) {
              return {
                success: false,
                error: `You've reached the email limit (3 per hour). Please try again later. Resets at ${rateLimit.resetAt.toLocaleTimeString()}.`,
              };
            }

            // Send email with full conversation history
            const result = await sendContactEmail({
              sessionId,
              senderEmail,
              message,
              conversationHistory: modelMessages,
            });

            if (!result.success) {
              return {
                success: false,
                error:
                  result.error ??
                  "Failed to send email. Please try again or contact Bas via LinkedIn.",
              };
            }

            return {
              success: true,
              // No address of Bas's own in here: the model repeats this text,
              // and the site keeps that address off every public surface.
              message: `Your message has been sent to Bas. He can reply directly to ${senderEmail}, usually within two working days.`,
            };
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    // The detail stays in the log; the client gets one fixed sentence.
    logError("Chat API", error, { endpoint: "/api/chat" });
    return createErrorJsonResponse(
      "An error occurred processing your message",
      500,
      ErrorCode.INTERNAL_ERROR,
    );
  }
}
