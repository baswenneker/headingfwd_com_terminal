import { env } from "~/env";

interface TurnstileVerificationResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * The hosts a challenge may have been solved on. A token solved elsewhere is
 * not one of ours, so it is refused even when Cloudflare says it is valid.
 *
 * A preview deployment serves from a host that is not on this list; add its
 * host here (and to the sitekey in Cloudflare) if the CAPTCHA has to work
 * there too.
 */
function allowedHostnames(): string[] {
  const hosts = ["headingfwd.com", "www.headingfwd.com"];
  if (env.ENVIRONMENT !== "production") {
    hosts.push("localhost", "127.0.0.1");
  }
  return hosts;
}

/**
 * Verify a Turnstile token with Cloudflare
 * @param token - The Turnstile response token from the client
 * @param options.remoteIp - The client address, passed to siteverify
 * @returns Object with success status and optional error information
 */
export async function verifyTurnstileToken(
  token: string,
  options?: { remoteIp?: string },
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
          ...(options?.remoteIp ? { remoteip: options.remoteIp } : {}),
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

    // The challenge has to have been solved on one of our own pages. Fail
    // closed: a response without a hostname is not one we can place.
    const hostname = data.hostname;
    if (!hostname || !allowedHostnames().includes(hostname)) {
      return {
        success: false,
        error: "Turnstile verification failed: unexpected hostname",
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
