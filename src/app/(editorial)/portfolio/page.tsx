import { type Metadata } from "next";
import Link from "next/link";
import styles from "../editorial.module.css";
import pf from "../portfolio.module.css";
import { socialMeta } from "~/config/metadata";
import { SITE_URL } from "~/config/site";
import { collectionGraph } from "~/config/structured-data";
import { isComingSoonCase, visibleCases } from "~/content/cases";
import { CONTACT } from "~/content/site-content";

/**
 * `/portfolio` — every visible case, in display order.
 *
 * The same editorial shell as `/blog`: a server-rendered page outside the
 * terminal, one card per case. The case number takes the column the post date
 * occupies on the blog overview.
 */

// "AI engineering & product design" promised a fifth service the site never
// offers — it existed only because case 03 is a product-management engagement,
// which that case's card now says for itself (#13 F10). One string for the
// meta tag, both social cards and the JSON-LD; the OG image route repeats it.
const DESCRIPTION =
  "Selected work by Bas Wenneker / HeadingFWD — agents, assistants and AI " +
  "workflows in production.";

export const metadata: Metadata = {
  title: "Portfolio",
  description: DESCRIPTION,
  // One description for the meta tag and both cards — the Open Graph block
  // used to carry a shortened variant, which is one string too many.
  ...socialMeta({
    title: "Portfolio",
    description: DESCRIPTION,
    path: "/portfolio",
  }),
};

/**
 * Structured data for the overview: a `CollectionPage`, the `ItemList` of the
 * visible cases in display order and the two-step breadcrumb. A coming-soon
 * case is listed — it has a real, linkable page; a hidden one is absent here
 * as it is everywhere, because both come from `visibleCases()`.
 */
function portfolioJsonLd() {
  return collectionGraph({
    url: `${SITE_URL}/portfolio`,
    type: "CollectionPage",
    name: "Portfolio",
    description: DESCRIPTION,
    items: visibleCases().map((c) => ({
      path: `/portfolio/${c.slug}`,
      name: c.title,
      description: c.kind,
    })),
    trail: [{ name: "Portfolio", path: "/portfolio" }],
  });
}

export default function PortfolioPage() {
  const cases = visibleCases();

  return (
    <div className={styles.shell}>
      <script
        type="application/ld+json"
        // Built from static case data — safe to inline as JSON-LD.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(portfolioJsonLd()) }}
      />
      <div className={styles.metaBar}>
        <span className={styles.kicker}>Bas Wenneker · Portfolio</span>
        <Link href="/" prefetch={false} className={styles.backLink}>
          ← back to the terminal
        </Link>
      </div>

      <h1 className={styles.title}>Portfolio</h1>
      {/*
       * The overview's one call to action used to be a LinkedIn profile link,
       * so the page that shows the work sent whoever it convinced off the
       * site (#13 D7). /contact leads now; LinkedIn stays as the alternative.
       */}
      <p className={styles.overviewLead}>
        Selected work — agents, assistants and AI workflows in production.{" "}
        <Link href="/contact" prefetch={false}>
          → start a conversation
        </Link>
        {" · "}
        <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">
          or connect on LinkedIn
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
                {c.note && <p className={pf.listNote}>{c.note}</p>}
                <p className={pf.listTags}>{c.tags.join(" · ")}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
