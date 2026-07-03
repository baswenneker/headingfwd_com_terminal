/**
 * Text fixtures for mocked AI responses used in E2E tests.
 *
 * These strings are returned by the mocked /api/chat route so tests can
 * assert UI behaviour (markdown rendering, tool results, error handling)
 * without making real OpenAI API calls.
 */

export const MOCK_AI_RESPONSES = {
  /** Plain greeting for basic streaming tests. */
  HELLO: "Hello! I can answer questions about Bas and HeadingFWD.",

  /**
   * Response with a markdown bold span to verify the markdown renderer
   * converts **text** to <strong>.
   */
  WITH_BOLD:
    "I specialise in **Generative AI** engineering and consulting.",

  /**
   * Multi-paragraph response used to verify that multiple lines render
   * inside a single assistant-message element.
   */
  MULTI_PARAGRAPH:
    "HeadingFWD helps teams build real AI products.\n\nBas has 15+ years of software experience and 5+ years with Generative AI.",
};

export const MOCK_TOOL_OPTIONS = {
  /** Sender address used in email tool stream tests. */
  EMAIL: "visitor@example.com",
  /** Message body used in email tool stream tests. */
  MESSAGE: "I'd love to discuss an AI project with you.",

  /**
   * Error string carried by the tool output when the rate limit is exceeded.
   * The terminal renders this as plain text — the raw JSON wrapper must
   * never be shown to the visitor.
   */
  RATE_LIMIT_ERROR:
    "You've reached the email limit (3 per hour). Please try again later.",
};

export const MOCK_ERROR_MESSAGES = {
  /**
   * Error text returned by a 429 HTTP response from /api/chat.
   * The terminal's readableError() function extracts this from the JSON
   * envelope so the visitor sees the plain message.
   */
  RATE_LIMIT: "Rate limit exceeded. Please try again later.",
};
