"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./terminal.module.css";
import { TerminalFeed } from "./terminal-feed";
import { type FeedLine, runCommand } from "./terminal-commands";
import { PortfolioOverlay } from "./portfolio-overlay";
import { PROJECTS } from "./terminal-projects";

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
 * Full-page terminal shell with a live command layer.
 *
 * Visitors type slash-commands (/help, /about, /services, /work, /stack,
 * /contact, /clear, /portfolio) into the input at the bottom. Each command
 * echoes the typed line and appends styled output to the feed above. Arrow
 * keys recall previous commands; clicking anywhere in the body refocuses the
 * input so the keyboard stays ready.
 */
export function Terminal() {
  const [inputValue, setInputValue] = useState("");
  const [feed, setFeed] = useState<FeedLine[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);

  // Portfolio overlay state — all three are reset to defaults when the
  // overlay opens so each visit starts at the first project in list view.
  const [mode, setMode] = useState<"terminal" | "portfolio">("terminal");
  const [pfIndex, setPfIndex] = useState(0);
  const [pfDetail, setPfDetail] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Auto-focus the input shortly after mount on devices with a precise pointer
  // (mouse / trackpad). The 650ms delay matches the reference design's rhythm.
  // On touch screens the auto-focus is deliberately skipped: popping the
  // on-screen keyboard before the visitor has expressed intent to type is
  // disruptive. Touch users tap the input field themselves when ready.
  useEffect(() => {
    if (!prefersAutoFocus()) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 650);
    return () => clearTimeout(timer);
  }, []);

  // Scroll the body to the bottom whenever new lines land in the feed,
  // including after /clear (which resets to an empty array).
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [feed]);

  /**
   * Run a command string through the registry and update the feed and overlay
   * state. Shared by the keyboard Enter handler and the tappable command tokens
   * in the tip line and /help rows. The caller is responsible for clearing the
   * text input when it was the source of the raw string.
   */
  function dispatchCommand(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;

    // Record in history (most-recent first, capped at 40 entries).
    setHistory((prev) => [trimmed, ...prev].slice(0, 40));

    const result = runCommand(trimmed);
    if (result.action === "clear") {
      setFeed([]);
    } else if (result.action === "portfolio") {
      // Append the echo + launch message, then open the overlay after
      // a short delay (~140ms) that matches the reference design's rhythm.
      setFeed((prev) => [...prev, ...result.lines]);
      setTimeout(() => {
        setPfIndex(0);
        setPfDetail(false);
        setMode("portfolio");
      }, 140);
    } else {
      setFeed((prev) => [...prev, ...result.lines]);
    }
  }

  /**
   * Handle keyboard input in the command field.
   *
   * Enter — trims the input, clears the field, routes through dispatchCommand.
   *   Empty input is a no-op.
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
      dispatchCommand(raw);
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

  /**
   * Close the portfolio overlay and, on fine-pointer devices, return keyboard
   * focus to the terminal input. The 40ms delay gives React time to finish the
   * re-render so the input is visible and focusable before focus() is called.
   * On touch devices the focus is skipped to avoid popping the on-screen
   * keyboard immediately after the visitor dismisses the portfolio.
   */
  function exitPortfolio() {
    setMode("terminal");
    setTimeout(() => {
      if (prefersAutoFocus()) inputRef.current?.focus();
    }, 40);
  }

  return (
    <div className={styles.page}>
      {/* Faint repeating dot grid — sits behind the terminal window */}
      <div className={styles.grid} aria-hidden="true" />

      {/* macOS-style terminal window */}
      <div className={styles.window}>

        {/* ── Title bar ── */}
        <div className={styles.titleBar}>
          {/* Traffic-light close/minimise/maximise dots */}
          <div className={styles.trafficLights}>
            <span className={`${styles.dot} ${styles.dotRed}`} />
            <span className={`${styles.dot} ${styles.dotAmber}`} />
            <span className={`${styles.dot} ${styles.dotGreen}`} />
          </div>

          {/* Centered window title; the "— zsh" segment hides on narrow viewports */}
          <div className={styles.titleText}>
            bas@headingfwd: ~/ai-engineering
            <span className={styles.titleZsh}> — zsh</span>
          </div>

          {/* Right-hand brand label — hidden on narrow viewports */}
          <div className={styles.brand}>HeadingFWD</div>
        </div>

        {/* ── Scrollable body ── */}
        {/*
         * On fine-pointer devices (mouse / trackpad), clicking anywhere in the
         * body refocuses the hidden input so the visitor can keep typing without
         * manually clicking the field. On touch devices the handler is skipped:
         * forcing focus here would pop the on-screen keyboard unintentionally.
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

          {/* Wordmark: "Heading" white, "FWD" + arrows in accent */}
          <div className={styles.wordmark}>
            Heading
            <span className={styles.wordmarkAccent}>FWD</span>
            <span className={styles.wordmarkArrows}>
              {/* ›› — › rendered as HTML entities */}
              {" "}&rsaquo;&rsaquo;&mdash;&rsaquo;
            </span>
          </div>

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
            actually make it to production.
          </div>

          {/* "// specialities" is terminal-style comment decoration, not a JS comment */}
          <div className={styles.specialitiesLabel}>{'// specialities'}</div>
          <div className={styles.specialitiesGrid}>
            <div>
              <span className={styles.specialityBullet}>*</span> Agentic
              workflow development
            </div>
            <div>
              <span className={styles.specialityBullet}>*</span> AI strategy
              &amp; consultancy
            </div>
            <div>
              <span className={styles.specialityBullet}>*</span> Evaluation
              &amp; testing
            </div>
            <div>
              <span className={styles.specialityBullet}>*</span> Assistants
              &amp; copilots, production-ready
            </div>
          </div>

          {/* Hint line pointing visitors toward commands */}
          <div className={styles.tip}>
            tip: type{" "}
            {/*
             * These command tokens are real buttons so a touch visitor can tap
             * one to run the command without typing. stopPropagation prevents
             * the body's click handler from interfering with the dispatch.
             */}
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

          {/* Divider separating the intro from the command feed area */}
          <div className={styles.divider} />

          {/* Live command feed — grows as the visitor types commands */}
          <TerminalFeed lines={feed} onRunCommand={dispatchCommand} />

          {/* Input row */}
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
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="type a command…"
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>

        {/* ── Status bar ── */}
        <div className={styles.statusBar}>
          {/* Pulsing online indicator */}
          <span className={styles.statusOnline}>
            <span className={styles.statusDot} />
            online
          </span>
          <span>main</span>
          <span>utf-8</span>
          {/*
           * Line count: 18 accounts for the fixed intro block; feed.length
           * adds the growing command output. Matches the reference formula.
           */}
          <span className={styles.statusRight}>{18 + feed.length} lines · /help</span>
        </div>

      </div>

      {/*
       * Portfolio overlay — rendered on top of the window when the visitor
       * opens /portfolio. Absolutely positioned inside .page so it covers the
       * full viewport. The overlay manages its own keyboard focus; exiting it
       * returns focus to the terminal input via exitPortfolio.
       */}
      {mode === "portfolio" && (
        <PortfolioOverlay
          projects={PROJECTS}
          pfIndex={pfIndex}
          pfDetail={pfDetail}
          onSetPfIndex={setPfIndex}
          onSetPfDetail={setPfDetail}
          onExit={exitPortfolio}
        />
      )}
    </div>
  );
}
