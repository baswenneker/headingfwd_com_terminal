"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useEffect, useRef, useState } from "react";

interface CaptchaOverlayProps {
  onSuccess: (token: string) => void;
  onError?: () => void;
}

/** Elements that can hold focus inside the panel, in DOM order. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

/**
 * Full-window overlay that gates the first free-text AI message behind a
 * Cloudflare Turnstile challenge. Styled to match the terminal dark-panel
 * aesthetic using the same color tokens as the terminal window.
 *
 * The overlay is rendered absolutely inside the terminal window so it covers
 * the entire shell surface without spilling outside it.
 *
 * It behaves as a modal dialog, because that is what it is: it names itself
 * with `role="dialog"` and `aria-modal`, takes focus when it opens, keeps Tab
 * inside itself while it is up, and closes on Escape (#13 U3). Before that a
 * screen reader announced nothing when it appeared and Tab walked straight
 * out into the blurred terminal behind it.
 */
export function CaptchaOverlay({ onSuccess, onError }: CaptchaOverlayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Move focus into the dialog as it opens. The panel itself takes it
  // (tabIndex -1) rather than the widget, so the heading and the explanation
  // are read before the challenge.
  useEffect(() => {
    panelRef.current?.focus();
  }, []);

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

  /**
   * Escape closes the dialog through the same path a failed challenge takes,
   * and Tab / Shift+Tab wrap inside the panel instead of reaching the page
   * behind it. The widget's own iframe counts as one stop in the cycle.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onError?.();
      return;
    }
    if (e.key !== "Tab") return;

    const panel = panelRef.current;
    if (!panel) return;
    const stops = [
      panel,
      ...Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)),
    ];
    const first = stops[0]!;
    const last = stops[stops.length - 1]!;
    const active = document.activeElement;

    if (e.shiftKey && (active === first || !panel.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      data-testid="captcha-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="captcha-overlay-title"
      onKeyDown={handleKeyDown}
    >
      {/* Dark panel with the same surface and border language as the terminal window */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="mx-4 max-w-sm rounded-xl border border-white/10 bg-[#0a0e11] p-8"
        style={{
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.07) inset, 0 40px 90px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header — accent ">" marker echoes the terminal prompt.
            "Verification Required / Complete the check below to start
            chatting" read as a security wall thrown up between the visitor
            and the site, at the exact moment they had decided to say
            something (#13 F4). It is a bot filter; it says so. */}
        <div className="mb-4 text-center" id="captcha-overlay-title">
          <span className="text-lg font-bold text-[#2ee6f6]">{">"}</span>
          <span className="ml-2 text-[#eafbfe]">one quick check</span>
        </div>

        {/* Description. The second sentence is true today — the message the
            visitor typed is held and sent once the check passes — and nothing
            said it, so everyone feared retyping it. */}
        <p className="mb-6 text-center text-sm text-[rgba(160,178,182,0.7)]">
          Cloudflare, so the chat doesn&apos;t fill up with bots. Takes a
          second — your message is kept.
        </p>

        {/* Loading state — shown until the Turnstile widget renders.
            0.7 alpha, matching the line above: at 0.6 it resolved to 3.8:1 on
            this panel and failed axe's contrast check (#13 U3). */}
        {isLoading && !isVerifying && (
          <div className="mb-4 text-center text-sm text-[rgba(160,178,182,0.7)]">
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
