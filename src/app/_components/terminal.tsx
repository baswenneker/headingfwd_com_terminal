"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { api } from "~/trpc/react";
import { env } from "~/env";
import styles from "./terminal.module.css";
import { renderFeedLine } from "./terminal-feed";
import { type FeedLine, runCommand } from "./terminal-commands";
import { PortfolioOverlay } from "./portfolio-overlay";
import { visibleCases } from "~/content/cases";
import { CaptchaOverlay } from "./captcha-overlay";
import { MemoizedMarkdown } from "./memoized-markdown";

/**
 * Cases shown in the fullscreen portfolio overlay: everything except `hidden`
 * ones. Computed once at module load (case data is static) so the overlay
 * receives a stable array reference across renders — no extra re-renders and no
 * index churn while navigating. Coming-soon cases stay in the list; the overlay
 * renders their detail as a placeholder.
 */
const PORTFOLIO_CASES = visibleCases();

// ── Feed block model ────────────────────────────────────────────────────────
//
// The terminal body is an ordered list of blocks. A command block holds the
// static lines produced by a slash-command. An AI turn block holds a single
// free-text exchange: the visitor's message plus the streaming AI response.
// Blocks are kept in the order they were created so the feed always reads
// top-to-bottom in the order events happened.

type CommandBlock = { type: "cmd"; lines: FeedLine[] };
type AiTurnBlock  = { type: "ai";  userText: string };
type FeedBlock    = CommandBlock | AiTurnBlock;

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns true when the device has a fine pointer (mouse / trackpad).
 *
 * Used to decide whether to focus the text input automatically. On touch
 * screens the on-screen keyboard should not appear until the visitor taps the
 * input deliberately; on pointer devices immediate focus is expected.
 * Returns false during server-side rendering (window is not available).
 */
function prefersAutoFocus(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

/**
 * Build the initial feed for a command deep-link URL (e.g. `/help`).
 *
 * Runs the command through the same registry as typed input, so a deep link
 * and typing `/help` produce identical feeds. runCommand is deterministic,
 * which keeps the server render and client hydration in agreement.
 */
function initialCommandBlocks(command?: string): FeedBlock[] {
  if (!command) return [];
  const result = runCommand(`/${command}`);
  return result.action === "lines"
    ? [{ type: "cmd", lines: result.lines }]
    : [];
}

/**
 * Extracts a human-readable sentence from an error thrown by the AI chat route.
 *
 * The /api/chat endpoint returns errors as JSON bodies of the shape
 * `{"error":"…"}`. When the Vercel AI SDK surfaces these as an Error object,
 * the message is the raw response text, which includes the JSON envelope.
 * This helper unwraps that envelope so visitors see a clean message instead
 * of raw JSON. If the input is not JSON, or the JSON does not contain an
 * "error" string, the raw text is returned as-is. An empty result falls back
 * to a generic prompt.
 */
function readableError(err: unknown): string {
  const raw =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "error" in parsed) {
      const e = (parsed as { error?: unknown }).error;
      if (typeof e === "string" && e.trim()) return e;
    }
  } catch {
    // raw was not JSON — fall through to the raw text
  }
  return raw.trim() || "Something went wrong. Please try again.";
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Full-page terminal shell that handles both slash-commands (instant, no
 * session) and free-text messages (routed to the AI after CAPTCHA + session).
 *
 * The body is a single chronological feed mixing static command output blocks
 * and AI conversation turns. Slash-commands never require a session or
 * CAPTCHA. Free-text messages trigger a deferred CAPTCHA on the first
 * submission; once verified, the session is created and the pending message
 * is sent to the AI. Subsequent free-text messages skip the CAPTCHA.
 *
 * When NEXT_PUBLIC_DISABLE_CAPTCHA is "true" (dev / test), the Turnstile
 * widget is skipped entirely and the session is initialised immediately with
 * a placeholder token that the server accepts in bypass mode.
 */
/**
 * Props for the terminal.
 *
 * Each prop lets a route open the terminal straight into a given state, so
 * every state has a shareable URL:
 *
 *   - `initialMode="portfolio"` — `/portfolio` — fullscreen overlay, list view.
 *   - `initialCaseSlug`         — `/portfolio/<slug>` — overlay, case detail.
 *   - `initialCommand`          — `/help`, `/about`, … — terminal with that
 *     command already executed in the feed.
 *
 * Exiting the overlay (Esc) drops back to the normal terminal underneath.
 * Defaults to the normal terminal with an empty feed.
 */
interface TerminalProps {
  initialMode?: "terminal" | "portfolio";
  /** Command token (without the slash) to pre-execute into the feed on load. */
  initialCommand?: string;
  /** Slug of the case to open in detail view; implies portfolio mode. */
  initialCaseSlug?: string;
}

export function Terminal({
  initialMode = "terminal",
  initialCommand,
  initialCaseSlug,
}: TerminalProps = {}) {
  const [inputValue, setInputValue] = useState("");
  const [blocks, setBlocks] = useState<FeedBlock[]>(() =>
    initialCommandBlocks(initialCommand),
  );
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);

  // Portfolio overlay state — all three are reset when the overlay opens so
  // each visit starts at the first project in list view. A case deep link
  // (`initialCaseSlug`) instead starts inside the overlay on that case's
  // detail view; an unknown slug falls back to plain initialMode behaviour.
  const initialCaseIndex = initialCaseSlug
    ? PORTFOLIO_CASES.findIndex((c) => c.slug === initialCaseSlug)
    : -1;
  const [mode, setMode] = useState<"terminal" | "portfolio">(
    initialCaseIndex >= 0 ? "portfolio" : initialMode,
  );
  const [pfIndex, setPfIndex] = useState(Math.max(initialCaseIndex, 0));
  const [pfDetail, setPfDetail] = useState(initialCaseIndex >= 0);

  // Session state for the AI chat.
  // sessionIdRef is the single source of truth read at request time by the
  // transport body callback; hasSession drives the UI gating logic.
  const [captchaVisible, setCaptchaVisible] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  // Holds the visitor's free-text message while the CAPTCHA overlay is open.
  const pendingMessageRef = useRef<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // tRPC mutation that creates a verified session after Turnstile challenge.
  const initSessionMutation = api.chat.initSession.useMutation();

  // AI chat hook — starts with an empty message history. The session ID is
  // injected into every request via the transport body callback so we always
  // read the latest ref value rather than a stale closure value.
  const { messages, setMessages, sendMessage, status, error, stop } =
    useChat<UIMessage>({
      // eslint-disable-next-line react-hooks/refs
      transport: new DefaultChatTransport({
        api: "/api/chat",
        // body() is invoked by the transport at request time, not during render,
        // so reading sessionIdRef.current inside it is safe and intentional.
        body: (opts?: { body?: Record<string, unknown> }) => ({
          ...(opts?.body ?? {}),
          sessionId: sessionIdRef.current,
        }),
      }),
      onError: (err: Error) => {
        console.error("[AI Chat Error]", err.message);
      },
    });

  // Abort any in-flight stream when the component unmounts.
  useEffect(() => {
    return () => {
      void stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-focus the input shortly after mount on fine-pointer devices.
  // The 650ms delay matches the reference design's initial rhythm.
  useEffect(() => {
    if (!prefersAutoFocus()) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 650);
    return () => clearTimeout(timer);
  }, []);

  // Scroll the body to the bottom whenever the feed grows or streaming
  // updates the latest AI turn.
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [blocks, messages]);

  // ── Session management ──────────────────────────────────────────────────

  /**
   * Call tRPC initSession with the given Turnstile token and store the
   * resulting session ID. When NEXT_PUBLIC_DISABLE_CAPTCHA is "true" the
   * server accepts any token without verifying against Cloudflare.
   * Returns true if the session was created, false on error.
   */
  async function initSession(turnstileToken: string): Promise<boolean> {
    try {
      const result = await initSessionMutation.mutateAsync({ turnstileToken });
      sessionIdRef.current = result.sessionId;
      setHasSession(true);
      return true;
    } catch (err) {
      console.error(
        "[Session Init Error]",
        err instanceof Error ? err.message : String(err),
      );
      return false;
    }
  }

  // ── AI message dispatch ─────────────────────────────────────────────────

  /**
   * Push an AI turn block into the feed and trigger the useChat hook.
   * Only called when sessionIdRef.current is already set.
   *
   * The N-th AI turn block maps to messages[N*2] (user) and
   * messages[N*2+1] (assistant) in the useChat messages array. This
   * correspondence is maintained as long as /clear resets both blocks and
   * messages simultaneously (which it does in dispatchCommand below).
   */
  function dispatchAiMessage(text: string) {
    if (!sessionIdRef.current) return;
    setBlocks((prev) => [...prev, { type: "ai", userText: text }]);
    void sendMessage({ text });
  }

  /**
   * Route a free-text message to the AI, creating a session first if one
   * does not yet exist.
   *
   * If no session: in dev/test mode (CAPTCHA disabled) the session is
   * created immediately using a placeholder token. In production, the
   * CAPTCHA overlay is shown and the message is held in pendingMessageRef
   * until the visitor solves the challenge.
   */
  async function handleFreeText(text: string) {
    if (hasSession) {
      dispatchAiMessage(text);
      return;
    }

    pendingMessageRef.current = text;

    if (env.NEXT_PUBLIC_DISABLE_CAPTCHA === "true") {
      // Dev / test bypass: skip the overlay and create the session with a
      // placeholder token. The server's Turnstile service returns success
      // when DISABLE_CAPTCHA is true, so any token string works here.
      const ok = await initSession("dev-bypass-token");
      if (ok) {
        pendingMessageRef.current = null;
        dispatchAiMessage(text);
      }
      return;
    }

    // Production: show the Turnstile overlay; session creation and message
    // dispatch happen in handleCaptchaSuccess once the challenge is solved.
    setCaptchaVisible(true);
  }

  /**
   * Called by CaptchaOverlay when the visitor successfully solves the
   * Turnstile challenge. Closes the overlay, creates the session, then sends
   * the message that was held in pendingMessageRef.
   */
  async function handleCaptchaSuccess(token: string) {
    setCaptchaVisible(false);
    const ok = await initSession(token);
    if (ok) {
      const pending = pendingMessageRef.current;
      pendingMessageRef.current = null;
      if (pending) dispatchAiMessage(pending);
    }
  }

  // ── Slash-command dispatch ──────────────────────────────────────────────

  /**
   * Run a slash-command string through the registry and update the feed and
   * overlay state. Shared by the keyboard Enter handler and the tappable
   * command tokens in the tip line and /help rows.
   */
  function dispatchCommand(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;

    setHistory((prev) => [trimmed, ...prev].slice(0, 40));

    const result = runCommand(trimmed);
    if (result.action === "clear") {
      // /clear wipes the visual feed and resets the AI conversation so that
      // AI turn indices remain in sync with the useChat messages array.
      void stop();
      setBlocks([]);
      setMessages([]);
    } else if (result.action === "portfolio") {
      setBlocks((prev) => [...prev, { type: "cmd", lines: result.lines }]);
      setTimeout(() => {
        setPfIndex(0);
        setPfDetail(false);
        setMode("portfolio");
      }, 140);
    } else {
      setBlocks((prev) => [...prev, { type: "cmd", lines: result.lines }]);
    }
  }

  // ── Keyboard handler ────────────────────────────────────────────────────

  /**
   * Handle keyboard input in the command field.
   *
   * Enter — routes to dispatchCommand for slash-commands or handleFreeText
   *   for everything else. Empty input is a no-op.
   *
   * ArrowUp / ArrowDown — walk backward / forward through the history buffer.
   *   Index -1 means the field is empty (no history entry selected).
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const raw = inputValue.trim();
      setInputValue("");
      setHistIdx(-1);
      if (!raw) return;

      if (raw.startsWith("/")) {
        // Slash-command: instant, no session needed. History is recorded
        // inside dispatchCommand.
        dispatchCommand(raw);
      } else {
        // Free text: record to history here (dispatchCommand handles its own)
        // then route to the AI.
        setHistory((prev) => [raw, ...prev].slice(0, 40));
        void handleFreeText(raw);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const newIdx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(newIdx);
      setInputValue(history[newIdx] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIdx = histIdx - 1;
      if (newIdx < 0) {
        setHistIdx(-1);
        setInputValue("");
      } else {
        setHistIdx(newIdx);
        setInputValue(history[newIdx] ?? "");
      }
    }
  };

  // ── Portfolio overlay ───────────────────────────────────────────────────

  /**
   * Keep the address bar in sync with the overlay while it is open:
   * `/portfolio` for the list, `/portfolio/<slug>` for a detail view — so
   * "what I'm looking at" is always shareable. Browsing (arrow keys,
   * prev/next, opening a case) rewrites the URL via history.replaceState:
   * shallow, so no reload, no history spam and no App Router round-trip.
   *
   * Terminal mode is deliberately left alone: the feed can hold many command
   * outputs, so no single URL can represent it — and rewriting would destroy
   * a command deep link like `/help` right after it loads. exitPortfolio()
   * resets the URL to `/` when the visitor leaves the overlay.
   */
  useEffect(() => {
    if (mode !== "portfolio") return;
    const clamped = Math.max(0, Math.min(pfIndex, PORTFOLIO_CASES.length - 1));
    const current = PORTFOLIO_CASES[clamped];
    const path =
      pfDetail && current ? `/portfolio/${current.slug}` : "/portfolio";
    if (window.location.pathname !== path) {
      window.history.replaceState(null, "", path);
    }
  }, [mode, pfIndex, pfDetail]);

  /**
   * Close the portfolio overlay and, on fine-pointer devices, return keyboard
   * focus to the terminal input. The 40ms delay gives React time to finish
   * the re-render so the input is visible before focus() is called.
   */
  function exitPortfolio() {
    setMode("terminal");
    // The overlay URL (/portfolio or /portfolio/<slug>) no longer matches
    // what is on screen; reset to the terminal root. replaceState mirrors how
    // the sync effect wrote the URL, keeping the history stack untouched.
    window.history.replaceState(null, "", "/");
    setTimeout(() => {
      if (prefersAutoFocus()) inputRef.current?.focus();
    }, 40);
  }

  // ── Derived values for rendering ────────────────────────────────────────

  // Collect all AI turn blocks in order so we can derive the turn index of
  // each block (the N-th AI block maps to messages[N*2] and messages[N*2+1]).
  const aiTurnBlocks = blocks.filter((b): b is AiTurnBlock => b.type === "ai");

  // True while the AI has a request in flight (waiting or streaming).
  const isAiInFlight = status === "submitted" || status === "streaming";

  // Approximate line count for the status bar: intro is fixed at 18 lines;
  // each command block contributes its line count and each AI turn adds ~2.
  const feedLineCount = blocks.reduce(
    (sum, b) => (b.type === "cmd" ? sum + b.lines.length : sum + 2),
    0,
  );

  // ── JSX ─────────────────────────────────────────────────────────────────

  return (
    <main className={styles.page}>
      {/* Faint repeating dot grid — sits behind the terminal window */}
      <div className={styles.grid} aria-hidden="true" />

      {/* macOS-style terminal window */}
      <div className={styles.window}>

        {/* ── Title bar ── */}
        <div className={styles.titleBar}>
          <div className={styles.trafficLights}>
            <span className={`${styles.dot} ${styles.dotRed}`} />
            <span className={`${styles.dot} ${styles.dotAmber}`} />
            <span className={`${styles.dot} ${styles.dotGreen}`} />
          </div>
          <div className={styles.titleText}>
            bas@headingfwd: ~/ai-engineering
            <span className={styles.titleZsh}> — zsh</span>
          </div>
          <div className={styles.brand}>HeadingFWD</div>
        </div>

        {/* ── Scrollable body ── */}
        {/*
         * On fine-pointer devices, clicking anywhere in the body refocuses
         * the hidden input so the visitor can keep typing. On touch devices
         * the handler is skipped to avoid popping the on-screen keyboard.
         */}
        <div
          ref={bodyRef}
          className={styles.body}
          onClick={() => {
            if (prefersAutoFocus()) inputRef.current?.focus();
          }}
        >
          {/* Shell prompt that precedes the intro */}
          <div className={styles.promptLine}>bas@headingfwd:~$ ./hello --who</div>

          {/* Wordmark: "Heading" in white, "FWD" in accent. The site's single
              level-one heading — names the brand for assistive tech and search. */}
          <h1 className={styles.wordmark}>
            Heading
            <span className={styles.wordmarkAccent}>FWD</span>
          </h1>

          {/* Tagline */}
          <div className={styles.subtitle}>
            AI engineering &amp; consultancy · Bas Wenneker — AI Lead / Engineer
          </div>

          {/* Value proposition */}
          <div className={styles.valueProp}>
            I help teams get real value from{" "}
            <span className={styles.valuePropAccent}>Generative AI</span> —
            designing and building{" "}
            <span className={styles.valuePropBright}>agents</span>,{" "}
            <span className={styles.valuePropBright}>assistants</span> and{" "}
            <span className={styles.valuePropBright}>AI workflows</span> that
            actually make it to production, training{" "}
            <span className={styles.valuePropBright}>dev teams</span>, and
            consulting on{" "}
            <span className={styles.valuePropBright}>AI strategy</span>.
          </div>

          {/* "// specialities" is terminal-style comment decoration */}
          <div className={styles.specialitiesLabel}>{'// specialities'}</div>
          <div className={styles.specialitiesGrid}>
            <div>
              <span className={styles.specialityBullet}>*</span>
              Agentic workflow development
            </div>
            <div>
              <span className={styles.specialityBullet}>*</span>
              AI strategy &amp; consulting
            </div>
            <div>
              <span className={styles.specialityBullet}>*</span>
              Agentic coding training for dev teams
            </div>
            <div>
              <span className={styles.specialityBullet}>*</span>
              AI techniques: RAG, graphs, memory and more
            </div>
          </div>

          {/* Hint line — command tokens are real buttons for touch visitors */}
          <div className={styles.tip}>
            tip: type{" "}
            <button
              className={styles.tipCommand}
              onClick={(e) => {
                e.stopPropagation();
                dispatchCommand("/help");
              }}
            >
              /help
            </button>
            {" "}for commands ·{" "}
            <button
              className={styles.tipCommand}
              onClick={(e) => {
                e.stopPropagation();
                dispatchCommand("/portfolio");
              }}
            >
              /portfolio
            </button>
            {" "}to browse my work fullscreen · or just ask
          </div>

          {/* Divider separating the intro from the chronological feed */}
          <div className={styles.divider} />

          {/* ── Chronological feed: command blocks + AI turns ── */}
          <div className={styles.feed}>
            {blocks.map((block, blockIdx) => {
              // ── Command block ──────────────────────────────────
              if (block.type === "cmd") {
                return (
                  <Fragment key={blockIdx}>
                    {block.lines.map((line, lineIdx) =>
                      renderFeedLine(line, lineIdx, dispatchCommand),
                    )}
                  </Fragment>
                );
              }

              // ── AI turn block ──────────────────────────────────
              //
              // The N-th AI turn (0-indexed within aiTurnBlocks) maps to
              // messages[N*2] (user message) and messages[N*2+1] (assistant).
              // This is valid as long as /clear resets both arrays together.
              const turnIdx = aiTurnBlocks.indexOf(block);
              const isLatestTurn = turnIdx === aiTurnBlocks.length - 1;

              const userMsg = messages[turnIdx * 2];
              const assistantMsg = messages[turnIdx * 2 + 1];

              // Determine what to show for this turn.
              // isInFlight: this specific turn is still being processed.
              const isInFlight = isLatestTurn && isAiInFlight;

              // hasStreamedText: the assistant has produced at least one
              // non-empty text part (content is already arriving).
              const hasStreamedText = assistantMsg?.parts.some(
                (p) =>
                  p.type === "text" &&
                  (p as { type: "text"; text: string }).text.trim().length > 0,
              );

              // Show "Thinking…" while submitted (no response yet) OR while
              // streaming but the first text token has not yet arrived.
              const showThinking =
                isInFlight && (status === "submitted" || !hasStreamedText);

              // Show cursor on the last text part while streaming.
              const showCursor = isLatestTurn && status === "streaming";

              // Show an error line when this is the latest turn and the
              // request ended in an error state.
              const showError = isLatestTurn && status === "error";

              return (
                <div key={blockIdx} className={styles.aiTurn}>
                  {/*
                   * Echo the visitor's typed message in the same prompt style
                   * as slash-commands so the feed reads consistently.
                   *
                   * userMsg may be undefined for a split second before the
                   * useChat hook processes the new message; block.userText is
                   * always available immediately.
                   */}
                  <div className={`${styles.feedLine} ${styles.feedCmd}`}>
                    <span className={styles.feedCmdPrompt}>
                      {"bas@headingfwd "}
                    </span>
                    <span className={styles.feedCmdAccent}>{"~$ "}</span>
                    <span className={styles.feedCmdText}>
                      {userMsg
                        ? (userMsg.parts.find(
                            (p): p is { type: "text"; text: string } =>
                              p.type === "text",
                          )?.text ?? block.userText)
                        : block.userText}
                    </span>
                  </div>

                  {/*
                   * "Thinking…" indicator — visible throughout the entire
                   * in-flight phase (submitted + streaming). The loading-
                   * indicator data-testid lets E2E tests verify when the
                   * response is complete.
                   */}
                  {isInFlight && (
                    <div
                      className={styles.aiThinking}
                      data-testid="loading-indicator"
                      style={showThinking ? undefined : { display: "none" }}
                      aria-hidden={!showThinking}
                    >
                      Thinking…
                    </div>
                  )}

                  {/* Streamed or completed assistant response */}
                  {assistantMsg && (
                    <div
                      className={styles.aiResponse}
                      data-testid="assistant-message"
                    >
                      {assistantMsg.parts.map((part, partIdx) => {
                        // Render the email-send tool outcome as a terminal-style
                        // status line so the visitor always sees what happened,
                        // even on failure (e.g. rate-limit exhausted).
                        if (part.type === "tool-sendMessage") {
                          // The generic UIMessage type does not carry the specific
                          // tool parameter, so we cast to the shape we know the
                          // sendMessage tool produces at runtime. The double cast
                          // through unknown is required because tool-${string}
                          // and "tool-sendMessage" are not directly comparable
                          // by the TypeScript checker.
                          const toolPart = part as unknown as {
                            type: "tool-sendMessage";
                            state: string;
                            output?: {
                              success: boolean;
                              message?: string;
                              error?: string;
                            };
                            errorText?: string;
                          };

                          if (toolPart.state === "output-available") {
                            if (toolPart.output?.success) {
                              return (
                                <div
                                  key={partIdx}
                                  className={styles.toolSent}
                                >
                                  {"✓ message sent to bas@headingfwd.com"}
                                </div>
                              );
                            }
                            // Tool ran but returned a failure (e.g. rate limit).
                            // Show the error text in the same red style used for
                            // network/stream errors so it is clearly a problem.
                            return (
                              <div
                                key={partIdx}
                                className={styles.aiError}
                              >
                                {"→ "}
                                {toolPart.output?.error ??
                                  "Failed to send your message."}
                              </div>
                            );
                          }

                          if (toolPart.state === "output-error") {
                            // The tool threw an exception rather than returning
                            // a structured failure; show the raw error text.
                            return (
                              <div
                                key={partIdx}
                                className={styles.aiError}
                              >
                                {"→ "}
                                {toolPart.errorText ??
                                  "Failed to send your message."}
                              </div>
                            );
                          }

                          // While the tool's input is still being built or the
                          // execution is pending, show a dim placeholder.
                          return (
                            <div
                              key={partIdx}
                              className={styles.toolSending}
                            >
                              {"✉ sending your message…"}
                            </div>
                          );
                        }

                        if (part.type !== "text") {
                          // Skip other non-text parts (reasoning, step-start, etc.).
                          return null;
                        }
                        const textPart = part as { type: "text"; text: string };
                        if (!textPart.text) return null;
                        const isLastPart =
                          partIdx === assistantMsg.parts.length - 1;
                        return (
                          <Fragment key={partIdx}>
                            <MemoizedMarkdown
                              content={textPart.text}
                              id={`ai-${blockIdx}-${partIdx}`}
                            />
                            {showCursor && isLastPart && (
                              <span
                                className={styles.aiCursor}
                                aria-hidden="true"
                              />
                            )}
                          </Fragment>
                        );
                      })}
                    </div>
                  )}

                  {/* Error display in terminal style */}
                  {showError && (
                    <div
                      className={styles.aiError}
                      data-testid="error-message"
                    >
                      {"→ "}
                      {readableError(error)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Input row ── */}
          <div className={styles.inputRow}>
            <span className={styles.inputPrompt}>
              {/* Full prefix hides on narrow viewports */}
              <span className={styles.inputPromptFull}>bas@headingfwd </span>
              <span className={styles.inputPromptAccent}>~$</span>
            </span>
            <input
              ref={inputRef}
              className={styles.input}
              type="text"
              aria-label="Terminal command input — type a command like /help or ask a question"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                captchaVisible
                  ? "complete verification to continue…"
                  : isAiInFlight
                    ? "AI is responding…"
                    : "type a command…"
              }
              disabled={captchaVisible || isAiInFlight}
              spellCheck={false}
              autoComplete="off"
              data-testid="terminal-input"
            />
          </div>
        </div>

        {/* ── Status bar ── */}
        <div className={styles.statusBar}>
          <span className={styles.statusOnline}>
            <span className={styles.statusDot} />
            online
          </span>
          <span>main</span>
          <span>utf-8</span>
          {/*
           * Plain-text source for AI agents & crawlers. Points at the
           * statically-generated /llms.txt (see app/llms.txt/route.ts).
           * The descriptive label collapses to just "llms.txt" on narrow
           * screens to keep the status bar compact.
           */}
          <a
            className={styles.statusAgents}
            href="/llms.txt"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className={styles.statusAgentsDot} />
            <span className={styles.statusAgentsFull}>
              Plaintext version for agents (llms.txt)
            </span>
            <span className={styles.statusAgentsShort}>llms.txt</span>
          </a>
          {/*
           * Line count: 18 for the fixed intro block; feedLineCount for the
           * growing command + AI turn content.
           */}
          <span className={styles.statusRight}>
            {18 + feedLineCount} lines · /help
          </span>
        </div>

        {/*
         * CAPTCHA overlay — shown on the first free-text message in
         * production. Rendered inside .window so it covers exactly the
         * terminal surface (absolute positioning relative to position:relative
         * on .window). Hidden when captchaVisible is false.
         */}
        {captchaVisible && (
          <CaptchaOverlay
            onSuccess={(token) => {
              void handleCaptchaSuccess(token);
            }}
            onError={() => {
              setCaptchaVisible(false);
              pendingMessageRef.current = null;
            }}
          />
        )}
      </div>

      {/*
       * Portfolio overlay — rendered on top of the window when the visitor
       * opens /portfolio. Absolutely positioned inside .page so it covers the
       * full viewport.
       */}
      {mode === "portfolio" && (
        <PortfolioOverlay
          cases={PORTFOLIO_CASES}
          pfIndex={pfIndex}
          pfDetail={pfDetail}
          onSetPfIndex={setPfIndex}
          onSetPfDetail={setPfDetail}
          onExit={exitPortfolio}
        />
      )}
    </main>
  );
}
