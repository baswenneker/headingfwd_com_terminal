"use client";

import { usePathname } from "next/navigation";
import styles from "./terminal.module.css";
import nf from "../not-found.module.css";

/**
 * Head of the 404 body: echoes the URL the visitor tried to reach as a failed
 * `cd`, then the shell's "no such file or directory" line — exactly what a
 * real terminal prints for a bad path. usePathname() is the only reason this
 * slice is a client component; everything else on the 404 renders on the
 * server.
 */
export function NotFoundConsole() {
  const pathname = usePathname();
  // Never render an empty target: fall back to a generic token if the router
  // has not resolved a path yet, or the visitor somehow reached "/" here.
  const target = pathname && pathname !== "/" ? pathname : "/unknown";

  return (
    <>
      <div className={styles.promptLine}>
        {`bas@headingfwd:~$ cd ${target}`}
      </div>
      <div className={nf.errorLine}>
        {`cd: no such file or directory: ${target}`}
      </div>
    </>
  );
}
