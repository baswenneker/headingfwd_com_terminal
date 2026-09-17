import { type Metadata } from "next";
import Link from "next/link";
import styles from "../../editorial.module.css";
import workshop from "../../workshop.module.css";
import { PostBody } from "~/app/_components/post-body";
import { POST_LOCALES } from "~/content/posts";
import { AI_CODING_WORKSHOP, workshopPath } from "~/content/workshops";

/**
 * `/workshops/ai-coding-workshop` — the offer page for the two-day AI coding
 * workshop, server-rendered on the editorial layout.
 *
 * The page is UNLISTED: Bas shares the link with one company at a time. It is
 * linked from nowhere, absent from the sitemap and `noindex`; only `/llms.txt`
 * names it. There is no structured data for the same reason — nothing indexes
 * the page, so an `Article` graph would serve no one. See
 * `docs/adr/0004-unlisted-offer-page.md`.
 *
 * A static route rather than a `[slug]` one: there is a single workshop, and a
 * loader that enumerates one item would be machinery without a job.
 */

const WORKSHOP = AI_CODING_WORKSHOP;
const PATH = workshopPath(WORKSHOP);

export const metadata: Metadata = {
  title: WORKSHOP.title,
  description: WORKSHOP.excerpt,
  alternates: { canonical: PATH },
  robots: { index: false, follow: true },
  openGraph: {
    type: "website",
    url: PATH,
    title: `${WORKSHOP.title} — HeadingFWD`,
    description: WORKSHOP.excerpt,
    locale: POST_LOCALES[WORKSHOP.lang].og,
  },
};

export default function WorkshopPage() {
  return (
    <div className={styles.shell}>
      {/*
        The root layout owns the `html` element, so the Dutch page states its
        language here — the same value the Open Graph locale carries.
      */}
      <article
        lang={POST_LOCALES[WORKSHOP.lang].html}
        className={styles.article}
      >
        <div className={styles.metaBar}>
          <span className={styles.kicker}>{WORKSHOP.kicker}</span>
          <Link href="/" className={styles.backLink}>
            ← terug naar de terminal
          </Link>
        </div>

        <h1 className={styles.title}>{WORKSHOP.title}</h1>

        <div className={styles.body}>
          <PostBody
            markdown={WORKSHOP.body}
            assetBase={PATH}
            lang={WORKSHOP.lang}
          />
        </div>
      </article>

      <footer
        className={workshop.footer}
        lang={POST_LOCALES[WORKSHOP.lang].html}
      >
        <p>
          Interesse? Stuur me een bericht via{" "}
          <Link href="/contact">/contact</Link>.
        </p>
      </footer>
    </div>
  );
}
