import { env } from "~/env";

interface TurnstileVerificationResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Verify a Turnstile token with Cloudflare
 * @param token - The Turnstile response token from the client
 * @returns Object with success status and optional error information
 */
export async function verifyTurnstileToken(
  token: string,
): Promise<{ success: boolean; error?: string }> {
  // Skip verification if DISABLE_CAPTCHA is enabled
  if (env.NEXT_PUBLIC_DISABLE_CAPTCHA === "true") {
    console.log(
      `[${env.NODE_ENV.toUpperCase()}] Cloudflare Turnstile verification skipped (NEXT_PUBLIC_DISABLE_CAPTCHA=true)`,
    );
    return { success: true };
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
      },
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Turnstile API returned status ${response.status}`,
      };
    }

    const data =
      (await response.json()) as unknown as TurnstileVerificationResponse;

    if (!data.success) {
      const errorCodes = data["error-codes"]?.join(", ") ?? "Unknown error";
      return {
        success: false,
        error: `Turnstile verification failed: ${errorCodes}`,
      };
    }

    return { success: true };
  } catch (error: unknown) {
    console.error("Turnstile verification error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to verify Turnstile token",
    };
  }
}
