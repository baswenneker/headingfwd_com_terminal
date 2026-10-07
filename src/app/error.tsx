"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./_components/terminal.module.css";
import nf from "./not-found.module.css";

/**
 * Error boundary for every page below the root layout — the terminal and the
 * editorial pages alike. Without it an uncaught render error showed Next's
 * bare default screen.
 *
 * It mirrors the 404 (`not-found.tsx`): the same terminal window, a failed
 * command as the headline, and a way out. `retry` re-renders the segment and
 * fetches it again, which clears a transient failure without a full reload.
 */
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.page}>
      <div className={styles.grid} aria-hidden="true" />

      <div className={styles.window}>
        <div className={styles.titleBar}>
          <div className={styles.trafficLights}>
            <span className={`${styles.dot} ${styles.dotRed}`} />
            <span className={`${styles.dot} ${styles.dotAmber}`} />
            <span className={`${styles.dot} ${styles.dotGreen}`} />
          </div>
          <div className={styles.titleText}>
            bas@headingfwd: ~/error
            <span className={styles.titleZsh}> — zsh</span>
          </div>
          <div className={styles.brand}>HeadingFWD</div>
        </div>

        <div className={styles.body}>
          <div className={nf.errorLine}>
            {"zsh: the page failed to render"}
            {error.digest ? ` (ref ${error.digest})` : ""}
          </div>

          <h1 className={nf.tagline}>Something went wrong on this page.</h1>

          <p className={styles.valueProp}>
            The error is on our side, not yours. Try again, or head back to the
            terminal.
          </p>

          <p className={styles.tip}>
            <button type="button" className={styles.tipCommand} onClick={retry}>
              retry
            </button>
            {" · "}
            <Link href="/" className={styles.tipCommand}>
              cd ~
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
