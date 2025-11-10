/**
 * Test session data fixtures
 */

export const TEST_SESSIONS = {
  /**
   * Valid, verified session
   */
  VALID: {
    sessionId: "session_test_valid",
    verified: true,
    messageCount: 0,
    expiresInMinutes: 30,
  },

  /**
   * Session with some messages already sent
   */
  WITH_MESSAGES: {
    sessionId: "session_test_with_messages",
    verified: true,
    messageCount: 5,
    expiresInMinutes: 30,
  },

  /**
   * Session near rate limit (9 messages)
   */
  NEAR_RATE_LIMIT: {
    sessionId: "session_test_near_limit",
    verified: true,
    messageCount: 9,
    expiresInMinutes: 30,
  },

  /**
   * Session at rate limit (10 messages)
   */
  AT_RATE_LIMIT: {
    sessionId: "session_test_at_limit",
    verified: true,
    messageCount: 10,
    expiresInMinutes: 30,
  },

  /**
   * Expired session
   */
  EXPIRED: {
    sessionId: "session_test_expired",
    verified: true,
    messageCount: 0,
    expiresInMinutes: -1, // Negative means expired
  },

  /**
   * Unverified session (CAPTCHA not completed)
   */
  UNVERIFIED: {
    sessionId: "session_test_unverified",
    verified: false,
    messageCount: 0,
    expiresInMinutes: 30,
  },

  /**
   * Session expiring soon (1 minute left)
   */
  EXPIRING_SOON: {
    sessionId: "session_test_expiring",
    verified: true,
    messageCount: 0,
    expiresInMinutes: 1,
  },
};

/**
 * Generate a unique test session ID
 */
export function generateTestSessionId(prefix = "test"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `session_${prefix}_${timestamp}_${random}`;
}
