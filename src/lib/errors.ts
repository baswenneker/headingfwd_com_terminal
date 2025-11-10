/**
 * Structured error response type
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Error codes for consistent error handling
 */
export const ErrorCode = {
  // Authentication & Authorization
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  CAPTCHA_FAILED: "CAPTCHA_FAILED",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // Validation
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",

  // Configuration
  MISSING_CONFIG: "MISSING_CONFIG",

  // Database
  DATABASE_CONNECTION_FAILED: "DATABASE_CONNECTION_FAILED",
  DATABASE_MIGRATION_FAILED: "DATABASE_MIGRATION_FAILED",
  DATABASE_NOT_FOUND: "DATABASE_NOT_FOUND",
  DATABASE_AUTH_FAILED: "DATABASE_AUTH_FAILED",

  // Generic
  INTERNAL_ERROR: "INTERNAL_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Create a structured error response
 */
export function createErrorResponse(
  message: string,
  code?: ErrorCodeType,
  details?: Record<string, unknown>,
): ErrorResponse {
  return {
    error: message,
    ...(code && { code }),
    ...(details && { details }),
  };
}

/**
 * Create a JSON Response with error
 */
export function createErrorJsonResponse(
  message: string,
  status: number,
  code?: ErrorCodeType,
  details?: Record<string, unknown>,
): Response {
  return new Response(
    JSON.stringify(createErrorResponse(message, code, details)),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
}

/**
 * Log error with structured context
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>,
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // In production, this would be sent to a logging service like Sentry, LogRocket, etc.
  console.error("[Error]", {
    context,
    message: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString(),
    ...additionalInfo,
  });
}
