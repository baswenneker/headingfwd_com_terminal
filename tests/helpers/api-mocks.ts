import { type Page, type Route } from "@playwright/test";

/**
 * Mocking utilities for the /api/chat endpoint.
 *
 * The AI SDK v6 `useChat` hook expects a Server-Sent Events stream when the
 * response carries `x-vercel-ai-ui-message-stream: v1`. Each event is a
 * `data: <json>\n\n` line. The helpers here construct that exact format so
 * tests can assert UI behaviour without making real OpenAI API calls.
 *
 * All route mocks use Playwright's `page.route()`. Pass the `page` before
 * navigation or before the action that triggers the request — Playwright
 * intercepts the matching URL whenever the request is made.
 */

/**
 * SSE headers that match what the real /api/chat route sends via
 * `result.toUIMessageStreamResponse()`. The `x-vercel-ai-ui-message-stream`
 * header is the signal that tells the AI SDK client to parse the body as
 * a UI message stream rather than a plain data stream.
 */
const UI_STREAM_HEADERS: Record<string, string> = {
  "content-type": "text/event-stream",
  "cache-control": "no-cache",
  "x-vercel-ai-ui-message-stream": "v1",
};

/** Serialise a single payload object to a `data:` SSE line. */
function sseEvent(payload: object): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

/**
 * Build a complete UI message stream body for a plain text AI reply.
 *
 * Stream sequence (AI SDK v6 protocol):
 *   start → start-step → text-start → text-delta → text-end
 *   → finish-step → finish → [DONE]
 *
 * The entire content is sent as a single text-delta chunk. Playwright
 * delivers the full body at once via route.fulfill(), which the SDK client
 * parses correctly without true chunked delivery.
 */
export function createTextStream(content: string): string {
  return [
    sseEvent({ type: "start" }),
    sseEvent({ type: "start-step" }),
    sseEvent({ type: "text-start", id: "text-1" }),
    sseEvent({ type: "text-delta", id: "text-1", delta: content }),
    sseEvent({ type: "text-end", id: "text-1" }),
    sseEvent({ type: "finish-step" }),
    sseEvent({ type: "finish" }),
    "data: [DONE]\n\n",
  ].join("");
}

export interface EmailToolOptions {
  senderEmail: string;
  message: string;
  success: boolean;
  /**
   * Human-readable error description shown when success is false (e.g. a
   * rate-limit message). Ignored when success is true.
   */
  error?: string;
}

/**
 * Build a complete UI message stream body for a sendMessage tool call.
 *
 * Stream sequence:
 *   start → start-step → tool-input-start → tool-input-available
 *   → tool-output-available → finish-step → finish → [DONE]
 *
 * When success is true, the tool output is `{ success: true }` and the
 * terminal renders "✓ message sent to bas@headingfwd.com".
 *
 * When success is false, the tool output is `{ success: false, error }` and
 * the terminal renders the error string in red inside the assistant-message
 * element.
 */
export function createEmailToolStream(options: EmailToolOptions): string {
  const output = options.success
    ? { success: true, message: "Email sent successfully." }
    : {
        success: false,
        error:
          options.error ??
          "You've reached the email limit (3 per hour). Please try again later.",
      };

  return [
    sseEvent({ type: "start" }),
    sseEvent({ type: "start-step" }),
    sseEvent({
      type: "tool-input-start",
      toolCallId: "call-1",
      toolName: "sendMessage",
    }),
    sseEvent({
      type: "tool-input-available",
      toolCallId: "call-1",
      toolName: "sendMessage",
      input: {
        senderEmail: options.senderEmail,
        message: options.message,
        userConfirmed: true,
      },
    }),
    sseEvent({
      type: "tool-output-available",
      toolCallId: "call-1",
      output,
    }),
    sseEvent({ type: "finish-step" }),
    sseEvent({ type: "finish" }),
    "data: [DONE]\n\n",
  ].join("");
}

/**
 * Mock every POST to /api/chat with a successful text stream response.
 * The mock stays active until clearChatMock() is called.
 */
export async function mockChatSuccess(page: Page, content: string) {
  await page.route("**/api/chat", async (route: Route) => {
    await route.fulfill({
      status: 200,
      headers: UI_STREAM_HEADERS,
      body: createTextStream(content),
    });
  });
}

/**
 * Mock every POST to /api/chat with an HTTP error response.
 *
 * The body is JSON `{ "error": "<message>" }`. The terminal's readableError()
 * function unwraps that envelope so visitors see plain text instead of JSON.
 */
export async function mockChatError(
  page: Page,
  errorMessage: string,
  statusCode = 500,
) {
  await page.route("**/api/chat", async (route: Route) => {
    await route.fulfill({
      status: statusCode,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error: errorMessage }),
    });
  });
}

/**
 * Convenience wrapper that mocks a 429 rate-limit HTTP error from /api/chat.
 * The terminal must show the unwrapped error text, not the raw JSON object.
 */
export async function mockRateLimitError(page: Page) {
  await mockChatError(
    page,
    "Rate limit exceeded. Please try again later.",
    429,
  );
}

/**
 * Mock /api/chat to return a sendMessage tool stream with a successful result.
 * The terminal renders "✓ message sent to bas@headingfwd.com" inside the
 * assistant-message element.
 */
export async function mockEmailToolSuccess(
  page: Page,
  senderEmail: string,
  message: string,
) {
  await page.route("**/api/chat", async (route: Route) => {
    await route.fulfill({
      status: 200,
      headers: UI_STREAM_HEADERS,
      body: createEmailToolStream({ senderEmail, message, success: true }),
    });
  });
}

/**
 * Mock /api/chat to return a sendMessage tool stream with a rate-limit failure.
 * The terminal renders the error text in red inside the assistant-message
 * element. The raw JSON object must NOT be visible.
 */
export async function mockEmailToolRateLimit(page: Page, errorMsg?: string) {
  await page.route("**/api/chat", async (route: Route) => {
    await route.fulfill({
      status: 200,
      headers: UI_STREAM_HEADERS,
      body: createEmailToolStream({
        senderEmail: "visitor@example.com",
        message: "Test message",
        success: false,
        error:
          errorMsg ??
          "You've reached the email limit (3 per hour). Please try again later.",
      }),
    });
  });
}

/**
 * Remove the active /api/chat route mock so subsequent requests reach the
 * real server (or a different mock registered later).
 */
export async function clearChatMock(page: Page) {
  await page.unroute("**/api/chat");
}
