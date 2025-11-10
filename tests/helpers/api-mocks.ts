import { type Page, type Route } from "@playwright/test";

/**
 * API mocking utilities for Playwright tests
 * Handles mocking of external API calls (primarily OpenAI)
 */

export interface MockStreamingOptions {
  content: string;
  delay?: number; // Delay between chunks in ms
  chunkSize?: number; // Number of words per chunk
  includeThinking?: boolean;
}

/**
 * Create a Server-Sent Events (SSE) formatted streaming response
 * Matches the format expected by Vercel AI SDK
 */
export function createSSEStream(options: MockStreamingOptions): string {
  const { content, includeThinking = false } = options;
  const parts: string[] = [];

  // Add thinking indicator if requested
  if (includeThinking) {
    parts.push('0:"Thinking..."\n');
  }

  // Split content into words for progressive streaming
  const words = content.split(" ");
  let accumulated = "";

  for (const word of words) {
    accumulated += (accumulated ? " " : "") + word;
    // Format: 0:"partial content"\n
    parts.push(`0:"${accumulated.replace(/"/g, '\\"')}"\n`);
  }

  return parts.join("");
}

/**
 * Mock a successful chat API streaming response
 */
export async function mockChatSuccess(
  page: Page,
  responseContent: string,
  options?: {
    delay?: number;
    chunkSize?: number;
  },
) {
  await page.route("**/api/chat", async (route: Route) => {
    const sseStream = createSSEStream({
      content: responseContent,
      ...options,
    });

    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
      body: sseStream,
    });
  });
}

/**
 * Mock a chat API error response
 */
export async function mockChatError(
  page: Page,
  errorMessage: string,
  statusCode = 500,
) {
  await page.route("**/api/chat", async (route: Route) => {
    await route.fulfill({
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: errorMessage,
      }),
    });
  });
}

/**
 * Mock a rate limit error (429)
 */
export async function mockRateLimitError(page: Page) {
  await mockChatError(
    page,
    "Rate limit exceeded. Please try again later.",
    429,
  );
}

/**
 * Mock command API responses
 * Commands don't need streaming, just simple JSON responses
 */
export async function mockCommandSuccess(
  page: Page,
  commandResponses: Record<string, string>,
) {
  await page.route("**/api/commands", async (route: Route) => {
    const request = route.request();

    if (request.method() === "POST") {
      const postData = request.postDataJSON() as { command: string };
      const command = postData.command.toLowerCase().trim();

      const response = commandResponses[command] ?? {
        response: "Unknown command. Type `/help` for available commands.",
        success: false,
      };

      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          response:
            typeof response === "string"
              ? response
              : (response.response ?? response),
          success: typeof response === "object" ? response.success : true,
        }),
      });
    } else if (request.method() === "GET") {
      // Return list of available commands
      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commands: Object.keys(commandResponses),
        }),
      });
    }
  });
}

/**
 * Mock the session init tRPC call
 */
export async function mockSessionInit(
  page: Page,
  sessionId: string,
  success = true,
) {
  await page.route("**/trpc/chat.initSession*", async (route: Route) => {
    if (success) {
      await route.fulfill({
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          result: {
            data: {
              sessionId,
              success: true,
            },
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: {
            message: "Failed to verify CAPTCHA",
          },
        }),
      });
    }
  });
}

/**
 * Remove all API mocks from a page
 */
export async function clearAllMocks(page: Page) {
  await page.unroute("**/api/chat");
  await page.unroute("**/api/commands");
  await page.unroute("**/trpc/chat.initSession*");
}

/**
 * Create a mock streaming response that simulates network delay
 */
export async function mockSlowChatResponse(page: Page, content: string) {
  await mockChatSuccess(page, content, {
    delay: 100, // 100ms between chunks
    chunkSize: 5, // 5 words per chunk
  });
}

/**
 * Mock a chat response with markdown content
 */
export async function mockChatWithMarkdown(page: Page, markdown: string) {
  await mockChatSuccess(page, markdown);
}

/**
 * Mock a chat response that includes tool usage
 */
export async function mockChatWithTools(
  page: Page,
  content: string,
  toolCalls: Array<{ name: string; result: string }>,
) {
  let sseStream = "";

  // Add tool calls
  for (const tool of toolCalls) {
    sseStream += `9:{"toolCallId":"${tool.name}","toolName":"${tool.name}","args":{}}\n`;
    sseStream += `a:{"toolCallId":"${tool.name}","result":"${tool.result}"}\n`;
  }

  // Add final content
  sseStream += createSSEStream({ content });

  await page.route("**/api/chat", async (route: Route) => {
    await route.fulfill({
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
      body: sseStream,
    });
  });
}
