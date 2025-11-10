import { openai } from "@ai-sdk/openai";
import { eq } from "drizzle-orm";
import * as ai from "ai";
import { convertToModelMessages, tool, type UIMessage, stepCountIs } from "ai";
import { z } from "zod";
import { wrapAISDK } from "langsmith/experimental/vercel";
import { db } from "~/server/db";
import { chatSessions } from "~/server/db/schema";
import {
  checkMessageRateLimit,
  checkEmailRateLimit,
} from "~/server/services/rate-limiter";
import { sendContactEmail } from "~/server/services/email";
import { env } from "~/env";
import { createErrorJsonResponse, logError, ErrorCode } from "~/lib/errors";

// Wrap AI SDK with LangSmith for tracing
const { streamText } = wrapAISDK(ai);

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

/**
 * Chat API route using Vercel AI SDK
 * Handles streaming chat completions with OpenAI
 * Traces all interactions to LangSmith for observability
 */
const MAX_MESSAGE_LENGTH = 4000;

export async function POST(req: Request) {
  try {
    const { messages, sessionId } = (await req.json()) as {
      messages: UIMessage[];
      sessionId: string;
    };

    // Validate messages exist and are not empty
    if (!messages || messages.length === 0) {
      return createErrorJsonResponse(
        "No messages provided",
        400,
        ErrorCode.INVALID_INPUT,
      );
    }

    // Validate message exists
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage) {
      return createErrorJsonResponse(
        "Invalid message format",
        400,
        ErrorCode.INVALID_INPUT,
      );
    }

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

    // Validate sessionId exists
    if (!sessionId || typeof sessionId !== "string") {
      return createErrorJsonResponse(
        "Invalid session ID",
        400,
        ErrorCode.INVALID_INPUT,
      );
    }

    // Validate OpenAI API key is configured
    if (!env.OPENAI_API_KEY) {
      logError("Chat API", "OpenAI API key not configured", { sessionId });
      return createErrorJsonResponse(
        "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.",
        500,
        ErrorCode.MISSING_CONFIG,
      );
    }

    // Check rate limits FIRST (cheapest operation, prevents DB exhaustion)
    const rateLimit = await checkMessageRateLimit(sessionId);
    if (!rateLimit.allowed) {
      logError("Chat API", "Rate limit exceeded", {
        sessionId,
        remaining: rateLimit.remaining,
      });
      return createErrorJsonResponse(
        `Rate limit exceeded. Please wait before sending more messages. (${rateLimit.remaining} remaining)`,
        429,
        ErrorCode.RATE_LIMIT_EXCEEDED,
        { remaining: rateLimit.remaining },
      );
    }

    // Validate session exists and is not expired
    const session = await db.query.chatSessions.findFirst({
      where: eq(chatSessions.sessionId, sessionId),
    });

    if (!session) {
      logError("Chat API", "Session not found", { sessionId });
      return createErrorJsonResponse(
        "Session not found. Please refresh and start a new session.",
        404,
        ErrorCode.SESSION_NOT_FOUND,
      );
    }

    const now = new Date();
    if (session.expiresAt < now) {
      logError("Chat API", "Session expired", { sessionId });
      return createErrorJsonResponse(
        "Session expired. Please refresh and start a new session.",
        403,
        ErrorCode.SESSION_EXPIRED,
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

    // Filter out incomplete assistant messages (those that are still streaming or have empty content)
    // This prevents issues with convertToModelMessages when the frontend sends back incomplete streaming responses
    const cleanedMessages = messages.filter((msg) => {
      // Keep all user messages
      if (msg.role === "user") return true;

      // For assistant messages, filter out incomplete ones
      if (msg.role === "assistant") {
        // Check if message has any complete text parts
        const hasCompleteText = msg.parts.some((part) => {
          if (part.type === "text") {
            // Keep only if text is not empty and not still streaming
            return (
              part.text &&
              part.text.trim().length > 0 &&
              (!("state" in part) || part.state !== "streaming")
            );
          }
          return false;
        });
        return hasCompleteText;
      }

      // Keep other roles (system, etc.)
      return true;
    });

    // Stream AI response with tools - automatically traced by LangSmith
    const result = streamText({
      model: openai("gpt-4.1-mini"), // Using 4.1-mini for better tool calling
      stopWhen: stepCountIs(20), // Stop after 20 steps maximum
      system: `You are Bas's AI assistant on his personal website. You're helpful, friendly, and knowledgeable about AI engineering.

## Instructions:
- Respond to user queries about Bas, his experience, expertise, and the AI engineering services he offers. Nothing else.
- Talk about Bas in the third person.
- Use the available tools to get specific information about services, experience, and contact details.
- Keep answers concise and professional.

Keep responses concise and friendly. If someone asks about services or wants to get in touch, use the available tools to provide specific information.

IMPORTANT: Do NOT answer questions about Bas's personal life, location, or sensitive information. Stick to professional and AI engineering topics only.
Also, if being asked questions outside your knowledge, respond with "I'm sorry, I don't have that information." Do NOT make up answers.

## About Bas:
- Lives in Delft, The Netherlands
- AI Lead/Engineer specializing in Generative AI implementations
- Expertise in LangChain, LangGraph, OpenAI, Anthropic, and other LLM providers
- Builds production-ready AI agents, assistants, virtual employees and workflows
- Uses modern web stacks like Python, FastAPI, TypeScript and Next.js.
- LinkedIn profile: https://www.linkedin.com/in/baswenneker

If being asked about his experience, mention:
- Started career as a software engineer while studying Computer Science at TU Delft
- Worked as an IT consultant before focusing on innovation, lean startup and design thinking
- Had a webshop and several software startups (one acquired)
- Started developing with LLMs when GPT-3 was released in 2020
- Delivered multiple AI projects for clients in various industries (ASML, UWV, PGGM, BasicFit, Eneco, etc.)
- Skilled in building AI agents with LangChain and LangGraph
- Experienced with vector databases, RAG systems, and LLM integrations
- Fullstack developer with a preference for Python/FastAPI backends and TypeScript/Next.js frontends

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
Once you have both email and message, show this preview EXACTLY as formatted below (each line on its own line):

📧 Email Preview:

━━━━━━━━━━━━━━━━━━━━━━

From: [their email]

To: bas@headingfwd.com

Message:

[their message]

━━━━━━━━━━━━━━━━━━━━━━

Should I send this email to Bas? (yes/no)

STEP 3 - WAIT FOR CONFIRMATION:
After showing the preview, if user says ANY of these words: "yes", "send", "send it", "confirm", "ok", "okay", "go ahead", "please", "do it" → IMMEDIATELY call the sendMessage tool with userConfirmed: true.

DO NOT call any other tools. DO NOT call getContact. Only call sendMessage.

If user says "no", "wait", "stop", "cancel" → DO NOT send. Respond with exactly: "No problem, the message was not sent. If you need anything else, just let me know!"

STEP 4 - AFTER SENDING:
After you call sendMessage, you MUST immediately generate a text response to confirm success. Do not just rely on the tool's return value - you must explicitly respond to the user with a message like:
"✅ Your message has been sent to Bas! He'll receive it at bas@headingfwd.com and typically responds within 24-48 hours."

IMPORTANT: Always include text in your response after calling the tool. The tool call alone is not enough - the user needs to see your confirmation message.
`,
      messages: convertToModelMessages(cleanedMessages),
      tools: {
        sendMessage: tool({
          description:
            "Send a message to Bas via email. ONLY call this after showing the user a preview and getting explicit confirmation. The full conversation history will be included automatically.",
          inputSchema: z.object({
            senderEmail: z
              .string()
              .email()
              .describe("The sender's email address for Bas to reply to"),
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
              conversationHistory: convertToModelMessages(cleanedMessages),
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
              message: `Your message has been sent to Bas! He'll receive it at bas@headingfwd.com and can reply directly to ${senderEmail}. He typically responds within 24-48 hours.`,
            };
          },
        }),
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    logError("Chat API", error, { endpoint: "/api/chat" });
    return createErrorJsonResponse(
      error instanceof Error
        ? error.message
        : "An error occurred processing your message",
      500,
      ErrorCode.INTERNAL_ERROR,
    );
  }
}
