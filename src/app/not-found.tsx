import { type Metadata } from "next";
import Link from "next/link";
import styles from "./_components/terminal.module.css";
import nf from "./not-found.module.css";
import { NotFoundConsole } from "./_components/not-found-console";

/**
 * Global 404. Next.js renders this for any unmatched URL and whenever a route
 * calls notFound() — the command deep-links (`/[command]`) and case deep-links
 * (`/portfolio/[slug]`) both do for tokens/slugs outside their registries.
 *
 * It reuses the terminal window chrome (title bar, dot grid, status bar) from
 * terminal.module.css, so a wrong turn still lands the visitor inside the same
 * shell — then presents the error the terminal way: a failed `cd`, the 404
 * glyph, and the working routes as clickable commands.
 */

export const metadata: Metadata = {
  title: "404 — page not found",
  description:
    "That route doesn’t exist on headingfwd.com. Head back to the terminal, " +
    "or jump to the portfolio, services, about or contact pages.",
  // The response already carries a 404 status; say noindex explicitly so no
  // crawler ever keeps a soft-404 URL in its index.
  robots: { index: false, follow: true },
};

/** Working routes offered as terminal commands — all real, indexable pages. */
const ROUTES = [
  { cmd: "cd ~", href: "/", desc: "back to the terminal" },
  { cmd: "/portfolio", href: "/portfolio", desc: "browse my work fullscreen" },
  { cmd: "/services", href: "/services", desc: "what I help teams with" },
  { cmd: "/about", href: "/about", desc: "who I am & how I work" },
  { cmd: "/contact", href: "/contact", desc: "get in touch" },
] as const;

export default function NotFound() {
  return (
    <main className={styles.page}>
      {/* Faint repeating dot grid — sits behind the terminal window */}
      <div className={styles.grid} aria-hidden="true" />

      {/* macOS-style terminal window (same chrome as the live terminal) */}
      <div className={styles.window}>
        {/* ── Title bar ── */}
        <div className={styles.titleBar}>
          <div className={styles.trafficLights}>
            <span className={`${styles.dot} ${styles.dotRed}`} />
            <span className={`${styles.dot} ${styles.dotAmber}`} />
            <span className={`${styles.dot} ${styles.dotGreen}`} />
          </div>
          <div className={styles.titleText}>
            bas@headingfwd: ~/404
            <span className={styles.titleZsh}> — zsh</span>
          </div>
          <div className={styles.brand}>HeadingFWD</div>
        </div>

        {/* ── Body ── */}
        <div className={styles.body}>
          {/* Path-aware failed `cd` + shell error (client: usePathname). */}
          <NotFoundConsole />

          {/* 404 glyph — the page's single h1. Digits are decorative; the
              accessible name comes from aria-label. */}
          <h1 className={nf.code} aria-label="404 — page not found">
            <span aria-hidden="true">4</span>
            <span aria-hidden="true" className={nf.codeZero}>
              0
            </span>
            <span aria-hidden="true">4</span>
          </h1>
          <p className={nf.tagline}>This route doesn’t exist.</p>

          <p className={styles.valueProp}>
            The page you were heading for may have moved, been renamed, or never
            existed. No detour needed — pick a working route below, or head back
            to the terminal.
          </p>

          {/* Terminal-style comment label above the routes */}
          <div className={styles.specialitiesLabel}>{"// available routes"}</div>
          <nav className={nf.routes} aria-label="Working routes">
            {ROUTES.map((r) => (
              <Link key={r.href} href={r.href} className={nf.route}>
                <span className={nf.routeMark} aria-hidden="true">
                  →
                </span>
                <span className={nf.routeCmd}>{r.cmd}</span>
                <span className={nf.routeDesc}>{r.desc}</span>
              </Link>
            ))}
          </nav>

          <p className={styles.tip}>
            tip: type{" "}
            <Link href="/help" className={styles.tipCommand}>
              /help
            </Link>{" "}
            once you’re back, or just ask me anything
          </p>

          {/* Divider + a fresh prompt, ready for the next command */}
          <div className={styles.divider} />
          <div className={styles.promptLine}>
            {"bas@headingfwd:~$ "}
            <span className={nf.cursor} aria-hidden="true" />
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
          <span className={styles.statusRight}>error 404 · route not found</span>
        </div>
      </div>
    </main>
  );
}
