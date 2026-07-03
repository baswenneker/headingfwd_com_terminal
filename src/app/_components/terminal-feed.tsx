import type { ReactNode } from "react";
import { type FeedLine } from "./terminal-commands";
import styles from "./terminal.module.css";

interface TerminalFeedProps {
  lines: FeedLine[];
  /**
   * When provided, slash-command labels in "row" lines become tappable
   * buttons that call this function with the label text (e.g. "/help").
   * This lets touch visitors browse commands in the /help output by tapping
   * the label instead of typing. Pass the terminal's dispatchCommand here.
   */
  onRunCommand?: (cmd: string) => void;
}

/**
 * Renders the chronological command feed inside the terminal body.
 *
 * Each FeedLine object maps to exactly one visual style. The styles are
 * defined in terminal.module.css and use the `--accent` and `--prompt`
 * custom properties that the page container provides. This matches the
 * visual output of the reference design's `el()` renderer.
 */
export function TerminalFeed({ lines, onRunCommand }: TerminalFeedProps) {
  return (
    <div className={styles.feed}>
      {lines.map((line, i) => renderFeedLine(line, i, onRunCommand))}
    </div>
  );
}

/**
 * Renders a single FeedLine as a React node. Exported so callers that embed
 * feed lines inside a custom wrapper (e.g. a mixed command + AI feed) can
 * reuse this logic without mounting a full TerminalFeed component.
 */
export function renderFeedLine(
  line: FeedLine,
  key: number | string,
  onRunCommand?: (cmd: string) => void,
): ReactNode {
  switch (line.kind) {
    case "sp":
      return <div key={key} className={styles.feedSpacer} />;

    case "cmd":
      return (
        <div key={key} className={`${styles.feedLine} ${styles.feedCmd}`}>
          <span className={styles.feedCmdPrompt}>{"bas@headingfwd "}</span>
          <span className={styles.feedCmdAccent}>{"~$ "}</span>
          <span className={styles.feedCmdText}>{line.text}</span>
        </div>
      );

    case "head":
      return (
        <div key={key} className={`${styles.feedLine} ${styles.feedHead}`}>
          {line.text}
        </div>
      );

    case "out":
      return (
        <div key={key} className={`${styles.feedLine} ${styles.feedOut}`}>
          {line.text}
        </div>
      );

    case "dim":
      return (
        <div key={key} className={`${styles.feedLine} ${styles.feedDim}`}>
          {line.text}
        </div>
      );

    case "bullet":
      return (
        <div key={key} className={`${styles.feedLine} ${styles.feedBullet}`}>
          <span className={styles.feedBulletMark}>{"* "}</span>
          {line.text}
        </div>
      );

    case "row":
      // When the label is a slash-command and a dispatch function is provided,
      // render the label as a button so touch visitors can tap it to run the
      // command without having to type. Keyboard users continue to navigate via
      // the input field as before. stopPropagation prevents the body's
      // click-to-refocus handler from conflicting with the button action.
      return (
        <div key={key} className={`${styles.feedLine} ${styles.feedRow}`}>
          {onRunCommand && line.label.startsWith("/") ? (
            <button
              className={`${styles.feedRowLabel} ${styles.feedRowLabelBtn}`}
              onClick={(e) => {
                e.stopPropagation();
                onRunCommand(line.label);
              }}
            >
              {line.label}
            </button>
          ) : (
            <span className={styles.feedRowLabel}>{line.label}</span>
          )}
          <span className={styles.feedRowDesc}>{line.desc}</span>
        </div>
      );

    case "link":
      return (
        <div key={key} className={`${styles.feedLine} ${styles.feedLink}`}>
          <span className={styles.feedLinkLabel}>{line.label}</span>
          {/*
           * stopPropagation prevents the body's click-to-refocus handler from
           * firing when the visitor clicks a link — otherwise focus would
           * immediately return to the hidden input instead of following the link.
           */}
          <a
            href={line.href}
            target="_blank"
            rel="noreferrer"
            className={styles.feedLinkAnchor}
            onClick={(e) => e.stopPropagation()}
          >
            {line.text}
          </a>
        </div>
      );
  }
}
