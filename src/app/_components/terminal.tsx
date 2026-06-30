"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./terminal.module.css";

/**
 * Full-page terminal shell. Renders the cyan backdrop, the macOS-style
 * window chrome, the intro content, and a text input that auto-focuses
 * on load. Command execution and AI integration are wired in later.
 */
export function Terminal() {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input shortly after mount so the visitor can type immediately.
  // The 650ms delay matches the reference design's intentional rhythm.
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 650);
    return () => clearTimeout(timer);
  }, []);

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
        {/* Clicking anywhere in the body refocuses the hidden input. */}
        <div
          className={styles.body}
          onClick={() => inputRef.current?.focus()}
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
            <span className={styles.tipCommand}>/help</span> for commands ·{" "}
            <span className={styles.tipCommand}>/portfolio</span> to browse my
            work fullscreen · or just ask
          </div>

          {/* Divider separating the intro from the command feed area */}
          <div className={styles.divider} />

          {/* Command feed output will be rendered here in a later feature */}

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
          {/* Line count: 18 intro lines (no feed items yet) */}
          <span className={styles.statusRight}>18 lines · /help</span>
        </div>

      </div>
    </div>
  );
}
