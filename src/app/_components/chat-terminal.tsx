"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { api } from "~/trpc/react";
import { MemoizedMarkdown } from "./memoized-markdown";

interface ChatTerminalProps {
  onRequestVerification: () => void;
  turnstileToken: string | null;
  onVerificationComplete: () => void;
  isVerified: boolean;
  isVerifying: boolean;
}

export function ChatTerminal({
  onRequestVerification,
  turnstileToken,
  onVerificationComplete,
  isVerified,
  isVerifying,
}: ChatTerminalProps) {
  // Use ref as single source of truth for sessionId to avoid race conditions
  // State is only used to trigger re-renders when sessionId changes
  const sessionIdRef = useRef<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // tRPC mutation for session initialization
  const initSession = api.chat.initSession.useMutation();

  // AI SDK's useChat hook (v5 API)
  // Explicitly specify UIMessage type to avoid type narrowing issues
  const { messages, setMessages, sendMessage, status, error, stop } =
    useChat<UIMessage>({
      transport: new DefaultChatTransport({
        api: "/api/chat",
        body: (opts?: { body?: Record<string, unknown> }) => {
          return {
            ...(opts?.body ?? {}),
            sessionId: sessionIdRef.current,
          };
        },
      }),
      messages: [
        {
          id: "welcome",
          role: "assistant" as const,
          parts: [
            {
              type: "text" as const,
              text: "Welcome! Type **/help** to see what I can do, or just ask me anything.",
            },
          ],
        },
      ],
      // Disable sending until we have a session
      onError: (error) => {
        // Log error with structured information
        console.error("[Chat Error]", {
          message: error instanceof Error ? error.message : String(error),
          error: error, // Log the full error object for debugging
          timestamp: new Date().toISOString(),
        });
      },
    });

  // Cleanup: abort any ongoing streams when component unmounts
  useEffect(() => {
    return () => {
      // Always call stop on unmount - it's safe to call even if not streaming
      void stop();
    };
    // Empty deps - only run cleanup on unmount, not on every status change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle input focus - request CAPTCHA from parent
  const handleInputFocus = () => {
    if (!isVerified) {
      onRequestVerification();
    }
  };

  // Initialize session after CAPTCHA verification
  useEffect(() => {
    if (!turnstileToken || hasSession) return;

    const initializeSession = async () => {
      try {
        const result = await initSession.mutateAsync({
          turnstileToken,
        });
        // Update ref and state atomically to avoid race conditions
        sessionIdRef.current = result.sessionId;
        setHasSession(true);
        onVerificationComplete(); // Notify parent (parent will set isVerified to true)
      } catch (error) {
        // Log error with structured information
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("[Session Init Error]", {
          message: errorMessage,
          timestamp: new Date().toISOString(),
        });
      }
    };

    void initializeSession();
    // Note: initSession and onVerificationComplete are intentionally omitted from deps
    // - initSession.mutateAsync is stable across renders
    // - onVerificationComplete should not trigger re-initialization
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnstileToken, hasSession]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Utility function to check if a message is a command
  const isCommand = (text: string): boolean => {
    return text.trim().startsWith("/");
  };

  // Execute command via dedicated API (no LLM involvement)
  const executeCommandAPI = async (
    command: string,
  ): Promise<{
    success: boolean;
    response: string;
    error?: string;
    openUrl?: string;
  }> => {
    try {
      const response = await fetch("/api/commands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command: command.trim(),
          sessionId: sessionIdRef.current,
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        response: string;
        error?: string;
        openUrl?: string;
      };

      if (!response.ok) {
        return {
          success: false,
          response: "",
          error: data.error ?? "Failed to execute command",
        };
      }

      return {
        success: true,
        response: data.response,
        openUrl: data.openUrl,
      };
    } catch (error) {
      return {
        success: false,
        response: "",
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  };

  // Custom submit handler that checks for session and commands
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedInput = input.trim();

    if (!trimmedInput || !isVerified || !hasSession) {
      return;
    }

    // Clear input immediately for better UX
    setInput("");

    // Check if it's a command
    if (isCommand(trimmedInput)) {
      // Detect URL-opening commands and open blank window immediately
      // This preserves user gesture context for mobile browsers (iOS Safari, Chrome)
      const urlOpeningCommands = ["/linkedin", "/how-i-built-this"];
      const shouldOpenUrl = urlOpeningCommands.includes(
        trimmedInput.toLowerCase(),
      );

      // Open blank window immediately (mobile-compatible pattern)
      // Note: Don't use 'noopener' here as it causes window.open() to return null
      // We need the window reference to update its location after the async call
      let newWindow: Window | null = null;
      if (shouldOpenUrl) {
        newWindow = window.open("", "_blank");
      }

      // Add user message immediately
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `user-${Date.now()}`,
          role: "user" as const,
          parts: [{ type: "text" as const, text: trimmedInput }],
        },
      ]);

      // Execute command via dedicated API (NO LLM)
      const result = await executeCommandAPI(trimmedInput);

      // Add command response
      if (result.success) {
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant" as const,
            parts: [{ type: "text" as const, text: result.response }],
          },
        ]);

        // Update the blank window's URL (mobile-compatible)
        // If window.open() was blocked, this gracefully degrades to the markdown link
        if (result.openUrl) {
          if (newWindow && !newWindow.closed) {
            try {
              newWindow.location.href = result.openUrl;
            } catch (error) {
              // If we can't update the window, close it
              console.warn("Failed to update window URL:", error);
              newWindow.close();
            }
          }
          // If window was blocked or closed, user can still click the link in markdown
        }
      } else {
        // Show error message
        // Close the blank window if it was opened
        if (newWindow && !newWindow.closed) {
          newWindow.close();
        }
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: `error-${Date.now()}`,
            role: "assistant" as const,
            parts: [
              {
                type: "text" as const,
                text: `Error: ${result.error ?? "Failed to execute command"}`,
              },
            ],
          },
        ]);
      }
      return;
    }

    // For non-command messages, use normal chat flow (with LLM)
    void sendMessage({ text: trimmedInput });
  };

  const isLoading = status === "streaming" || status === "submitted";

  // Refocus input when assistant finishes responding
  useEffect(() => {
    if (!isLoading && isVerified && hasSession) {
      inputRef.current?.focus();
    }
  }, [isLoading, isVerified, hasSession]);

  return (
    <div className="flex flex-col pt-4 pb-6">
      {/* Chat Header */}
      <div className="mb-4 flex shrink-0 flex-col gap-2 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <span className="text-cyan-400">{">"}</span>
          <span className="text-gray-100">Interactive Terminal</span>
        </div>
        <span className="text-xs text-gray-500 md:ml-0">
          {isVerified
            ? "(Type and press Enter)"
            : "(Click input below to start chatting)"}
        </span>
      </div>

      {/* Messages Container */}
      <div className="mb-6 max-h-96 space-y-3 overflow-x-hidden overflow-y-auto rounded border border-cyan-800/50 bg-black/20 p-3 md:p-4">
        {messages.map((message) => {
          const isUser = (message.role as string) === "user";
          return (
            <div
              key={message.id}
              className="space-y-1"
              data-testid={isUser ? "user-message" : "assistant-message"}
            >
              <div className="flex items-start gap-2">
                <span className={isUser ? "text-cyan-400" : "text-green-400"}>
                  {isUser ? ">" : "→"}
                </span>
                <div className="min-w-0 flex-1">
                  <span className={isUser ? "text-gray-100" : "text-gray-300"}>
                    {isUser ? "You" : "Assistant"}:
                  </span>
                  <div className="mt-1 space-y-2 break-words text-gray-300">
                    {message.parts.map((part, i) => {
                      if (part.type === "text") {
                        return (
                          <div key={`${message.id}-${i}`}>
                            {isUser ? (
                              <div className="whitespace-pre-wrap">
                                {part.text}
                              </div>
                            ) : (
                              <MemoizedMarkdown
                                content={part.text}
                                id={`${message.id}-${i}`}
                              />
                            )}
                          </div>
                        );
                      } else if (
                        typeof part.type === "string" &&
                        part.type.startsWith("tool-")
                      ) {
                        // Display any tool calls in a formatted way (generic handling)
                        const toolType = part.type as string;
                        const toolName = toolType.replace("tool-", "");

                        // Hide sendMessage tool call (email sending)
                        if (toolName === "sendMessage") {
                          return null;
                        }

                        const hasResult = "result" in part && part.result;
                        return (
                          <div
                            key={`${message.id}-${i}`}
                            className="rounded bg-cyan-900/20 p-2 text-xs text-cyan-300"
                          >
                            <div className="font-mono">{toolName}()</div>
                            {hasResult ? (
                              <pre className="mt-1 overflow-x-auto">
                                {JSON.stringify(
                                  part.result as Record<string, unknown>,
                                  null,
                                  2,
                                )}
                              </pre>
                            ) : null}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && (
          <div
            className="flex items-start gap-2"
            data-testid="loading-indicator"
          >
            <span className="text-green-400">→</span>
            <div className="min-w-0 flex-1">
              <span className="text-gray-300">Assistant:</span>
              <div className="mt-1 text-gray-400">Thinking...</div>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="flex items-start gap-2" data-testid="error-message">
            <span className="text-red-400">✗</span>
            <div className="min-w-0 flex-1">
              <span className="text-red-400">Error:</span>
              <div className="mt-1 text-red-300">
                {error instanceof Error ? error.message : String(error)}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={onSubmit} className="flex shrink-0 items-center gap-2">
        <span className="text-cyan-400">{">"}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={handleInputFocus}
          onClick={handleInputFocus}
          placeholder={
            isVerified
              ? "Type your message here..."
              : isVerifying
                ? "Verifying..."
                : "Click here to start chatting..."
          }
          className="flex-1 bg-transparent text-gray-100 outline-none placeholder:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          autoComplete="off"
          disabled={isVerifying || (isVerified && !hasSession) || isLoading}
          data-testid="terminal-input"
        />
      </form>
    </div>
  );
}
