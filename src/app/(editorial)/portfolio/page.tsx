import { type Metadata } from "next";
import Link from "next/link";
import styles from "../editorial.module.css";
import pf from "../portfolio.module.css";
import { isComingSoonCase, visibleCases } from "~/content/cases";
import { CONTACT } from "~/content/site-content";

/**
 * `/portfolio` — every visible case, in display order.
 *
 * The same editorial shell as `/blog`: a server-rendered page outside the
 * terminal, one card per case. The case number takes the column the post date
 * occupies on the blog overview.
 */

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Selected AI engineering & product design work by Bas Wenneker / HeadingFWD — " +
    "agents, assistants and AI workflows built to reach production.",
  alternates: {
    canonical: "/portfolio",
  },
  openGraph: {
    type: "website",
    url: "/portfolio",
    title: "Portfolio — HeadingFWD",
    description:
      "Selected AI engineering & product design work by Bas Wenneker / HeadingFWD.",
  },
};

export default function PortfolioPage() {
  const cases = visibleCases();

  return (
    <div className={styles.shell}>
      <div className={styles.metaBar}>
        <span className={styles.kicker}>Bas Wenneker · Portfolio</span>
        <Link href="/" className={styles.backLink}>
          ← back to the terminal
        </Link>
      </div>

      <h1 className={styles.title}>Portfolio</h1>
      <p className={styles.overviewLead}>
        Selected work — AI engineering &amp; product design.{" "}
        <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">
          → or view my LinkedIn profile
        </a>
      </p>

      <ul className={styles.list}>
        {cases.map((c) => (
          <li key={c.slug} className={styles.listItem}>
            <Link href={`/portfolio/${c.slug}`} className={styles.listLink}>
              <span className={`${styles.listMeta} ${pf.index}`}>{c.n}</span>
              <div>
                <h2 className={styles.listTitle}>
                  {c.title}
                  {isComingSoonCase(c) && (
                    <span className={styles.badge}>coming soon</span>
                  )}
                </h2>
                <p className={styles.listSummary}>{c.kind}</p>
                <p className={pf.listTags}>{c.tags.join(" · ")}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
