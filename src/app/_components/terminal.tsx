"use client";

import { useState } from "react";
import { CaptchaOverlay } from "./captcha-overlay";
import { CodeBlock } from "./code-block";
import { ChatTerminal } from "./chat-terminal";
import { env } from "~/env";

export function Terminal() {
  const isCaptchaDisabled = env.NEXT_PUBLIC_DISABLE_CAPTCHA === "true";
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [isVerified, setIsVerified] = useState(isCaptchaDisabled);
  const [isVerifying, setIsVerifying] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(
    isCaptchaDisabled ? "dev-bypass-token" : null,
  );

  const handleShowCaptcha = () => {
    if (!isVerified && !showCaptcha && !isCaptchaDisabled) {
      setShowCaptcha(true);
    }
  };

  const handleCaptchaSuccess = (token: string) => {
    setTurnstileToken(token);
    setIsVerifying(true); // Mark as verifying
    // Don't hide captcha yet - wait for session initialization to complete
  };

  const handleVerificationComplete = () => {
    setIsVerified(true);
    setIsVerifying(false);
    setShowCaptcha(false); // Hide overlay after successful session creation
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-0 md:p-8">
      {/* Terminal Window - outer container with border */}
      <div className="flex h-full w-full flex-col overflow-hidden md:h-auto md:max-h-[calc(100vh-8rem)] md:max-w-6xl md:overflow-auto md:rounded-xl md:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
        {/* macOS Window Chrome - Hidden on mobile */}
        <div className="hidden shrink-0 items-center gap-2 border-b border-gray-700/50 bg-[#3a3a3a] px-4 py-3 md:flex">
          {/* Three colored dots */}
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-gray-400"></div>
            <div className="h-3 w-3 rounded-full bg-gray-400"></div>
            <div className="h-3 w-3 rounded-full bg-gray-400"></div>
          </div>
          {/* Title */}
          <div className="ml-4 flex-1 text-center text-sm text-gray-300">
            HeadingFWD - AI Engineering & Consultancy
          </div>
        </div>

        {/* Terminal Content with fieldset inside */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[#1e1e1e] p-4 font-mono text-sm text-gray-400 md:flex-initial md:p-6">
          {/* CAPTCHA Overlay - covers entire terminal */}
          {showCaptcha && !isVerified && (
            <CaptchaOverlay onSuccess={handleCaptchaSuccess} />
          )}
          {/* Fieldset containing the content */}
          <fieldset className="border border-cyan-800 p-4 md:p-6">
            <legend className="px-2 text-gray-100">
              Bas Wenneker [AI Lead/Engineer]
            </legend>
            {/* Two column layout with vertical divider - stacks on mobile */}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-0">
              {/* Left Column - Code */}
              <div className="space-y-2 md:border-r md:border-cyan-800 md:pr-12">
                {/* Prompt */}
                <div className="mb-4">
                  <span className="animate-pulse text-cyan-400">{">"}</span>{" "}
                  <span className="text-gray-100">Working on solution...</span>
                </div>

                {/* Code snippet - NO syntax highlighting, all same color */}
                <CodeBlock />
              </div>

              {/* Right Column - Description with vertical spacing from divider */}
              <div className="space-y-6 font-mono text-sm md:pl-12">
                {/* Main description */}
                <div className="border-t border-b border-cyan-800 pt-6 pb-6 md:border-t-0 md:pt-0">
                  <p className="font-bold text-gray-100">
                    I help teams get value from Generative AI by developing
                    agents, assistants and AI workflows.
                  </p>
                </div>

                {/* Services list */}
                <div className="space-y-1 text-sm text-gray-300">
                  <div className="flex items-start gap-3">
                    <span>Specialities:</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span>*</span>
                    <span>Agentic workflow development</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span>*</span>
                    <span>AI strategy & consultancy</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span>*</span>
                    <span>Evaluation and testing</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span>*</span>
                    <span>
                      ... more, send me a{" "}
                      <a
                        href="https://www.linkedin.com/in/baswenneker"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 underline hover:text-cyan-300"
                      >
                        dm
                      </a>{" "}
                      on LinkedIn or type{" "}
                      <span className="font-bold">/contact</span> below for
                      contact info.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>

          {/* Interactive Chat Terminal */}
          <ChatTerminal
            onRequestVerification={handleShowCaptcha}
            turnstileToken={turnstileToken}
            onVerificationComplete={handleVerificationComplete}
            isVerified={isVerified}
            isVerifying={isVerifying}
          />
        </div>
      </div>
    </div>
  );
}
