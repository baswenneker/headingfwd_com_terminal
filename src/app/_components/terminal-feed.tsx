import { type FeedLine } from "./terminal-commands";
import styles from "./terminal.module.css";

interface TerminalFeedProps {
  lines: FeedLine[];
}

/**
 * Renders the chronological command feed inside the terminal body.
 *
 * Each FeedLine object maps to exactly one visual style. The styles are
 * defined in terminal.module.css and use the `--accent` and `--prompt`
 * custom properties that the page container provides. This matches the
 * visual output of the reference design's `el()` renderer.
 */
export function TerminalFeed({ lines }: TerminalFeedProps) {
  return (
    <div className={styles.feed}>
      {lines.map((line, i) => renderLine(line, i))}
    </div>
  );
}

function renderLine(line: FeedLine, key: number): React.ReactNode {
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
      return (
        <div key={key} className={`${styles.feedLine} ${styles.feedRow}`}>
          <span className={styles.feedRowLabel}>{line.label}</span>
          <span className={styles.feedRowDesc}>{line.desc}</span>
        </div>
      );

    case "job":
      return (
        <div key={key} className={`${styles.feedLine} ${styles.feedJob}`}>
          <span className={styles.feedJobNum}>{line.num}</span>
          <span className={styles.feedJobName}>{line.name}</span>
          <span className={styles.feedJobDesc}>{"— " + line.desc}</span>
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
