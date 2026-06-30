"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useState } from "react";

interface CaptchaOverlayProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
}

/**
 * Full-window overlay that gates the first free-text AI message behind a
 * Cloudflare Turnstile challenge. Styled to match the terminal dark-panel
 * aesthetic using the same color tokens as the terminal window.
 *
 * The overlay is rendered absolutely inside the terminal window so it covers
 * the entire shell surface without spilling outside it.
 */
export function CaptchaOverlay({ onSuccess, onError }: CaptchaOverlayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSuccess = (token: string) => {
    setIsLoading(false);
    setIsVerifying(true);
    onSuccess(token);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const handleExpire = () => {
    setHasError(true);
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      data-testid="captcha-overlay"
    >
      {/* Dark panel with the same surface and border language as the terminal window */}
      <div
        className="mx-4 max-w-sm rounded-xl border border-white/10 bg-[#0a0e11] p-8"
        style={{
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.07) inset, 0 40px 90px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header — accent ">" marker echoes the terminal prompt */}
        <div className="mb-4 text-center">
          <span className="text-lg font-bold text-[#2ee6f6]">{">"}</span>
          <span className="ml-2 text-[#eafbfe]">Verification Required</span>
        </div>

        {/* Description */}
        <p className="mb-6 text-center text-sm text-[rgba(160,178,182,0.7)]">
          Complete the check below to start chatting
        </p>

        {/* Loading state — shown until the Turnstile widget renders */}
        {isLoading && !isVerifying && (
          <div className="mb-4 text-center text-sm text-[rgba(160,178,182,0.6)]">
            Loading verification…
          </div>
        )}

        {/* Verifying state — shown after the widget fires onSuccess */}
        {isVerifying && (
          <div className="mb-4 text-center text-sm text-[#2ee6f6]">
            Verifying… Please wait.
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="mb-4 rounded border border-red-800/50 bg-red-900/20 p-3 text-center text-sm text-red-400">
            Verification failed. Please refresh the page and try again.
          </div>
        )}

        {/* Turnstile widget */}
        {!isVerifying && (
          <div className="flex justify-center">
            <Turnstile
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={handleSuccess}
              onError={handleError}
              onExpire={handleExpire}
              options={{
                theme: "dark",
                size: "normal",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
