/**
 * Error message fixtures for testing error scenarios
 */

export const ERROR_MESSAGES = {
  /**
   * Rate limiting errors
   */
  RATE_LIMIT: {
    MESSAGE: "Rate limit exceeded. Please try again later.",
    STATUS: 429,
  },

  /**
   * Session errors
   */
  SESSION: {
    EXPIRED: "Your session has expired. Please refresh the page.",
    INVALID: "Invalid session. Please refresh the page.",
    NOT_FOUND: "Session not found. Please start a new session.",
  },

  /**
   * API errors
   */
  API: {
    SERVER_ERROR: "An error occurred. Please try again.",
    TIMEOUT: "Request timed out. Please try again.",
    NETWORK: "Network error. Please check your connection.",
    BAD_REQUEST: "Invalid request. Please try again.",
  },

  /**
   * Validation errors
   */
  VALIDATION: {
    EMPTY_MESSAGE: "Please enter a message.",
    MESSAGE_TOO_LONG:
      "Message is too long. Please keep it under 1000 characters.",
    INVALID_COMMAND: "Invalid command. Type /help for available commands.",
  },

  /**
   * CAPTCHA errors
   */
  CAPTCHA: {
    FAILED: "CAPTCHA verification failed. Please try again.",
    EXPIRED: "CAPTCHA expired. Please verify again.",
  },

  /**
   * Database errors
   */
  DATABASE: {
    CONNECTION: "Database connection error.",
    QUERY: "Database query failed.",
  },
};

/**
 * Expected error patterns for matching in tests
 */
export const ERROR_PATTERNS = {
  RATE_LIMIT: /rate limit|too many/i,
  SESSION_EXPIRED: /expired|session/i,
  NETWORK: /network|connection/i,
  SERVER: /error|failed|wrong/i,
};
