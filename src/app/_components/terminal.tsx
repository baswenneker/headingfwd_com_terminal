"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { api } from "~/trpc/react";
import { env } from "~/env";
import { CONTACT, CREDENTIALS } from "~/content/site-content";
import styles from "./terminal.module.css";
import { renderFeedLine } from "./terminal-feed";
import { type FeedLine, runCommand } from "./terminal-commands";
import { MemoizedMarkdown } from "./memoized-markdown";

/**
 * The CAPTCHA overlay, loaded the first time it is shown rather than with the
 * page.
 *
 * `@marsidev/react-turnstile` is the single largest thing the terminal used to
 * ship — around 730 KB raw in one chunk — and it is needed only once a visitor
 * types a free-text message, which most never do (#13 P2). A static import put
 * it in the initial script list of `/` and of all six command pages.
 *
 * `ssr: false` because the widget has no server rendering to contribute: the
 * overlay is mounted from an event handler, never during the first paint.
 */
const CaptchaOverlay = dynamic(
  () => import("./captcha-overlay").then((m) => m.CaptchaOverlay),
  { ssr: false },
);

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

/**
 * Id of the error line belonging to the latest AI turn. The input points at
 * it with aria-describedby while it is on screen, so the two are one thing to
 * a screen reader instead of two unrelated ones.
 */
const TERMINAL_ERROR_ID = "terminal-error";

/** Id of the command input — the skip link's target (#13 U11). */
const TERMINAL_INPUT_ID = "terminal-input";

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
 *
 * A dropped connection never produces a body at all: fetch rejects with a
 * TypeError whose message is the browser's own wording — "Failed to fetch" in
 * Chrome, "NetworkError when attempting to fetch resource" in Firefox — which
 * the terminal used to print verbatim (#13 U7). Those are recognised and
 * answered in the site's own voice instead.
 */
function readableError(err: unknown): string {
  const raw =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";

  if (
    err instanceof TypeError ||
    /failed to fetch|networkerror|network request failed|load failed/i.test(raw)
  ) {
    return "No connection. Check your network and try again.";
  }

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

/**
 * Reads the error code out of a failed /api/chat response, when it carries
 * one of the two that mean "this session is no longer valid".
 *
 * The route answers `{"error":"…","code":"SESSION_EXPIRED"}` (see
 * `~/lib/errors`), and the AI SDK hands the raw body over as the Error's
 * message. Anything else — a rate limit, a network failure, a malformed
 * body — returns null and is shown to the visitor as it always was.
 */
function sessionErrorCode(err: unknown): string | null {
  const raw = err instanceof Error ? err.message : "";
  try {
    const parsed: unknown = JSON.parse(raw);
    const code =
      parsed && typeof parsed === "object" && "code" in parsed
        ? (parsed as { code?: unknown }).code
        : undefined;
    return code === "SESSION_EXPIRED" || code === "SESSION_NOT_FOUND"
      ? code
      : null;
  } catch {
    return null;
  }
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
 * `initialCommand` lets a route open the terminal with one command already
 * executed in the feed — `/help`, `/about`, … — so each of those states has a
 * shareable URL. Without it the terminal starts with an empty feed.
 */
interface TerminalProps {
  /** Command token (without the slash) to pre-execute into the feed on load. */
  initialCommand?: string;
}

export function Terminal({ initialCommand }: TerminalProps = {}) {
  const [inputValue, setInputValue] = useState("");
  const [blocks, setBlocks] = useState<FeedBlock[]>(() =>
    initialCommandBlocks(initialCommand),
  );
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);

  // Session state for the AI chat.
  //
  // sessionIdRef is the single source of truth, read at request time by the
  // transport body callback and by the free-text router below. It used to be
  // shadowed by a `hasSession` boolean that no JSX read; the two could not
  // disagree until the session-expiry recovery (#13 U6) had to clear the
  // session from inside a callback, at which point a stale boolean would have
  // routed the retry straight back into the expired session.
  const [captchaVisible, setCaptchaVisible] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  // Holds the visitor's free-text message while the CAPTCHA overlay is open.
  const pendingMessageRef = useRef<string | null>(null);
  // The last free-text message dispatched to the AI, kept so an expired
  // session can be recovered by sending exactly that message again.
  const lastFreeTextRef = useRef<string | null>(null);

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
        // Through a ref, so the handler always sees the current feed rather
        // than the one that existed when useChat was first configured.
        chatErrorRef.current(err);
      },
    });

  // Latest chat-error handler, refreshed on every render. Declared after
  // useChat because the handler it holds needs setMessages.
  const chatErrorRef = useRef<(err: Error) => void>(() => undefined);

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
      return true;
    } catch (err) {
      console.error(
        "[Session Init Error]",
        err instanceof Error ? err.message : String(err),
      );
      return false;
    }
  }

  /**
   * What the terminal does when a session could not be created: say so, and
   * give the message back.
   *
   * Every path into `initSession` used to fail silently — the overlay closed,
   * the input was empty and the typed message was gone, with nothing in the
   * feed to explain it (#13 U5). The text goes back into the input so the
   * visitor only has to press Enter again.
   */
  function reportSessionFailure(text: string | null) {
    setBlocks((prev) => [
      ...prev,
      {
        type: "cmd",
        lines: [
          {
            kind: "error",
            text: "→ Couldn't start a session. Please try again.",
          },
        ],
      },
    ]);
    if (text) setInputValue(text);
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
    lastFreeTextRef.current = text;
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
    if (sessionIdRef.current) {
      dispatchAiMessage(text);
      return;
    }

    pendingMessageRef.current = text;

    if (env.NEXT_PUBLIC_DISABLE_CAPTCHA === "true") {
      // Dev / test bypass: skip the overlay and create the session with a
      // placeholder token. The server's Turnstile service returns success
      // when DISABLE_CAPTCHA is true, so any token string works here.
      const ok = await initSession("dev-bypass-token");
      pendingMessageRef.current = null;
      if (ok) {
        dispatchAiMessage(text);
      } else {
        reportSessionFailure(text);
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
    const pending = pendingMessageRef.current;
    pendingMessageRef.current = null;
    if (ok) {
      if (pending) dispatchAiMessage(pending);
    } else {
      reportSessionFailure(pending);
    }
  }

  /**
   * Recover from a session the server no longer accepts.
   *
   * After thirty minutes /api/chat answers 403 with `SESSION_EXPIRED`, and a
   * session cleared from the database answers `SESSION_NOT_FOUND`. The
   * terminal used to print "Session expired. Please refresh and start a new
   * session." and leave the visitor to do exactly that, losing the message
   * they had just typed (#13 U6).
   *
   * Instead the failed turn is taken back out of the feed and out of the
   * useChat history, the session is cleared, and the same message is sent
   * again through the normal route — which puts the CAPTCHA back up in place
   * and, once it is solved, delivers the message. Nothing is reloaded.
   */
  function handleChatError(err: Error) {
    const code = sessionErrorCode(err);
    if (!code) return;

    const text = lastFreeTextRef.current;
    if (!text) return;

    sessionIdRef.current = null;

    // Drop the turn that failed. Block and message indices stay in step
    // because the count of remaining AI blocks decides where messages is cut:
    // the N-th AI block owns messages[N*2] and messages[N*2+1].
    const remainingTurns = Math.max(
      0,
      blocks.filter((b) => b.type === "ai").length - 1,
    );
    setMessages(messages.slice(0, remainingTurns * 2));
    setBlocks((prev) => {
      const last = prev.map((b) => b.type).lastIndexOf("ai");
      const kept = last >= 0 ? prev.filter((_, i) => i !== last) : prev;
      return [
        ...kept,
        {
          type: "cmd",
          lines: [{ kind: "dim", text: "→ session expired, one more check…" }],
        },
      ];
    });

    void handleFreeText(text);
  }

  // Keep the ref that useChat's onError reaches through pointing at the
  // handler built from this render's state. In an effect rather than during
  // render: an error can only follow an interaction, and every interaction
  // comes after the commit that updated this.
  useEffect(() => {
    chatErrorRef.current = handleChatError;
  });

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
    } else if (result.action === "navigate") {
      setBlocks((prev) => [...prev, { type: "cmd", lines: result.lines }]);
      // A real page outside the terminal — see the `navigate` action in
      // terminal-commands.ts. A full navigation rather than router.push:
      // leaving for real is what drops the terminal bundle those pages never
      // load.
      setTimeout(() => window.location.assign(result.href), 140);
    } else if (result.action === "openurl") {
      setBlocks((prev) => [...prev, { type: "cmd", lines: result.lines }]);
      // Open synchronously within the triggering keypress/click so the browser
      // treats it as a user-initiated navigation, not a blocked popup. The
      // rendered link in result.lines is the fallback if it is blocked anyway.
      window.open(result.url, "_blank", "noopener,noreferrer");
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
      {/*
       * First focusable element on the page. Without it a keyboard visitor
       * who lands before the autofocus fires tabs through the tip tokens and
       * the whole feed before reaching the one control that does anything
       * (#13 U11). Hidden until focused.
       */}
      <a href={`#${TERMINAL_INPUT_ID}`} className={styles.skipLink}>
        Skip to command input
      </a>

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

          {/*
           * The one proof line above the fold. Nothing else here says what has
           * actually shipped, and a reader who decides in ten seconds decides
           * on this (#13 F1). It is a single source in site-content.ts, said
           * the same way by /about and by /llms.txt.
           */}
          <div className={styles.credentials}>{CREDENTIALS}</div>

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

          {/*
           * Hint line. Each token is an anchor to the command's own page whose
           * click is intercepted and run in the terminal instead: a crawler
           * following the homepage reaches /help, and a visitor clicking it
           * stays here and sees the output in the feed (#13 D1). `/portfolio`
           * and `/blog` are real pages outside the terminal, so their dispatch
           * still leaves — the anchor and the command agree either way.
           *
           * prefetch={false}: these are the terminal's own route group, and
           * prefetching several pages nobody asked for is the cost this file
           * already avoids in the status bar.
           */}
          <div className={styles.tip}>
            tip: type{" "}
            <Link
              href="/help"
              prefetch={false}
              className={styles.tipCommand}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dispatchCommand("/help");
              }}
            >
              /help
            </Link>
            {" "}for commands ·{" "}
            <Link
              href="/portfolio"
              prefetch={false}
              className={styles.tipCommand}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dispatchCommand("/portfolio");
              }}
            >
              /portfolio
            </Link>
            {" "}for the work ·{" "}
            <Link
              href="/blog"
              prefetch={false}
              className={styles.tipCommand}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dispatchCommand("/blog");
              }}
            >
              /blog
            </Link>
            {" "}to read what I write ·{" "}
            <Link
              href="/contact"
              prefetch={false}
              className={styles.tipCommand}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dispatchCommand("/contact");
              }}
            >
              /contact
            </Link>
            {" "}to reach me · or just ask
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

                  {/*
                   * Streamed or completed assistant response.
                   *
                   * The latest turn is a polite live region, so a screen
                   * reader hears the answer arrive instead of nothing at all
                   * (#13 U4). Older turns are not: re-announcing a finished
                   * answer because a later turn re-rendered would be noise.
                   */}
                  {assistantMsg && (
                    <div
                      className={styles.aiResponse}
                      data-testid="assistant-message"
                      aria-live={isLatestTurn ? "polite" : undefined}
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

                  {/* Error display in terminal style. role="alert" so it is
                      announced the moment it appears, and an id so the input
                      below can point at it while it is up (#13 U4). */}
                  {showError && (
                    <div
                      className={styles.aiError}
                      data-testid="error-message"
                      role="alert"
                      id={TERMINAL_ERROR_ID}
                    >
                      {"→ "}
                      {readableError(error)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/*
           * Progress, for assistive tech only. "Thinking…" is drawn in the
           * feed but nothing announced it, so a screen-reader user had no way
           * to tell a slow answer from a dead page (#13 U4). Kept out of the
           * visual feed, which already shows all of this.
           */}
          <div role="status" aria-live="polite" className={styles.srOnly}>
            {isAiInFlight
              ? "Thinking…"
              : aiTurnBlocks.length > 0 && status === "ready"
                ? "Answer complete."
                : ""}
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
              id={TERMINAL_INPUT_ID}
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
              // While an error is on screen the input says so and points at
              // it, so the message is read with the field rather than only
              // sitting above it (#13 U4).
              aria-invalid={status === "error" || undefined}
              aria-describedby={
                status === "error" ? TERMINAL_ERROR_ID : undefined
              }
            />
          </div>

          {/*
           * Without JavaScript the input above renders and does nothing: no
           * command runs, no message is sent, and the page said so nowhere
           * (#13 U8). The editorial pages need no such notice — they are
           * fully readable without script, by design.
           */}
          <noscript>
            <p className={styles.noscript}>
              This terminal needs JavaScript. Without it:{" "}
              {/* Link, not a bare anchor, only to satisfy the Next lint rule:
                  inside noscript it renders as the plain <a> it has to be. */}
              <Link href="/portfolio" prefetch={false}>
                portfolio
              </Link>
              ,{" "}
              <Link href="/blog" prefetch={false}>
                blog
              </Link>
              , or{" "}
              <a href={CONTACT.linkedin} rel="noreferrer">
                LinkedIn
              </a>
              .
            </p>
          </noscript>
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
           * Crawl path into the case pages. `/portfolio` is a real route
           * outside the terminal, so this is a plain link — clicking it leaves
           * the page, exactly as the `/portfolio` command does. Only an anchor
           * in the initial HTML gives crawlers (and visitors who don't type
           * commands) the way in: home → list → case.
           */}
          <Link className={styles.statusLink} href="/portfolio" prefetch={false}>
            portfolio
          </Link>
          {/*
           * Crawl path into the blog. `/blog` is a real route outside the
           * terminal, so this is a plain link: clicking it leaves the page,
           * which is exactly what the `/blog` command does too.
           */}
          <Link className={styles.statusLink} href="/blog" prefetch={false}>
            blog
          </Link>
          {/*
           * The one way to reach Bas that does not require typing. The status
           * bar offered the work and the writing and nothing else, so the
           * homepage had no contact affordance at all (#13 D4). `/contact` is
           * a terminal page, so this is a normal in-app link.
           */}
          <Link className={styles.statusLink} href="/contact" prefetch={false}>
            contact
          </Link>
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
              // A rejected or dismissed challenge used to close the overlay
              // and drop the message without a word (#13 U5). Same treatment
              // as a failed session call: say so, hand the text back.
              setCaptchaVisible(false);
              const pending = pendingMessageRef.current;
              pendingMessageRef.current = null;
              reportSessionFailure(pending);
            }}
          />
        )}
      </div>
    </main>
  );
}
