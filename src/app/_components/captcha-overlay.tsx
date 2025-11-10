"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useState } from "react";

interface CaptchaOverlayProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
}

export function CaptchaOverlay({ onSuccess, onError }: CaptchaOverlayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSuccess = (token: string) => {
    setIsLoading(false);
    setIsVerifying(true); // Show "verifying..." message
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
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
      data-testid="captcha-overlay"
    >
      <div className="mx-4 max-w-md rounded border border-cyan-800 bg-[#1e1e1e] p-8 shadow-2xl">
        {/* Header */}
        <div className="mb-4 text-center">
          <span className="text-lg text-cyan-400">{">"}</span>
          <span className="ml-2 text-gray-100">Verification Required</span>
        </div>

        {/* Description */}
        <p className="mb-6 text-center text-sm text-gray-400">
          Please verify you&apos;re human to use the chat
        </p>

        {/* Loading State */}
        {isLoading && !isVerifying && (
          <div className="mb-4 text-center text-sm text-gray-500">
            Loading verification...
          </div>
        )}

        {/* Verifying State */}
        {isVerifying && (
          <div className="mb-4 text-center text-sm text-cyan-400">
            Verifying... Please wait.
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className="mb-4 rounded border border-red-800 bg-red-900/20 p-3 text-center text-sm text-red-400">
            Verification failed. Please refresh the page to try again.
          </div>
        )}

        {/* Turnstile Widget */}
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
