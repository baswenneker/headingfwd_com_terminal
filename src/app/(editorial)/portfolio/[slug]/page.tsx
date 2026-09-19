import { type Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../editorial.module.css";
import pf from "../../portfolio.module.css";
import { PostBody } from "~/app/_components/post-body";
import { VideoPreviews } from "~/app/_components/video-previews";
import { postAssets } from "~/content/blog/assets";
import { isComingSoonCase, visibleCases, type Case } from "~/content/cases";
import { CONTACT } from "~/content/site-content";
import { socialMeta } from "~/config/metadata";
import {
  ORGANIZATION_ID,
  PERSON_ID,
  SITE_NAME,
  SITE_URL,
} from "~/config/site";

/**
 * `/portfolio/<slug>` — one case, server-rendered on the editorial layout.
 *
 * The write-up goes through the same renderer as a blog post, so a case body
 * gets the post vocabulary: the text before the first `##` is the lead, a `##`
 * is a numbered section, a `###` a numbered item. Everything but the video
 * previews is server-rendered, so a crawler that runs no script still reads
 * the whole case.
 *
 * Pages exist only for the visible cases (`dynamicParams = false` below):
 * hidden cases and unknown slugs are a hard 404.
 */

const CASES = visibleCases();

interface CasePageProps {
  params: Promise<{ slug: string }>;
}

/** Pre-render one page per visible case. */
export function generateStaticParams() {
  return CASES.map((c) => ({ slug: c.slug }));
}

// Slugs outside generateStaticParams (hidden cases, typos) are a hard 404.
export const dynamicParams = false;

function findCase(slug: string): Case | undefined {
  return CASES.find((c) => c.slug === slug);
}

/**
 * One-line summary of a case, used verbatim for the meta description, the
 * Open Graph description and the `Article.description` in the structured
 * data — one string, so the three can never disagree. `kind` is the case's
 * own outcome summary, which makes the ideal lead.
 */
function caseDescription(c: Case): string {
  return (
    `${c.kind}. An AI engineering case by Bas Wenneker / HeadingFWD — ` +
    `sector: ${c.sector}.`
  );
}

/**
 * Structured data for one case: an `Article` wired into the site-wide graph
 * from the root layout (the same `#person` / `#organization` ids), plus the
 * `BreadcrumbList` that lets a search result show "HeadingFWD › Portfolio ›
 * Case". Coming-soon cases emit the same shape — they are real, linkable
 * pages; hidden cases have no page and therefore no structured data.
 *
 * `datePublished` comes from the case's `date` and `dateModified` from
 * `updated ?? date` — the same single source, and the same fallback, the
 * sitemap's `lastModified` uses.
 */
function caseJsonLd(c: Case) {
  const url = `${SITE_URL}/portfolio/${c.slug}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        url,
        mainEntityOfPage: url,
        headline: c.title,
        description: caseDescription(c),
        inLanguage: "en",
        author: { "@id": PERSON_ID },
        publisher: { "@id": ORGANIZATION_ID },
        articleSection: c.sector,
        keywords: c.tags,
        datePublished: c.date,
        // A case that was never revised is unchanged since publication, so it
        // says so rather than leaving a crawler to guess.
        dateModified: c.updated ?? c.date,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: SITE_NAME,
            item: `${SITE_URL}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Portfolio",
            item: `${SITE_URL}/portfolio`,
          },
          { "@type": "ListItem", position: 3, name: c.title, item: url },
        ],
      },
    ],
  };
}

export async function generateMetadata({
  params,
}: CasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const c = findCase(slug);
  if (!c) return {};

  const description = caseDescription(c);

  return {
    title: c.title,
    description,
    // "article", matching the Article node in the JSON-LD above — the two must
    // agree or a scraper gets contradictory signals.
    ...socialMeta({
      title: c.title,
      description,
      path: `/portfolio/${c.slug}`,
      type: "article",
      tags: c.tags,
      authors: ["Bas Wenneker"],
      publishedTime: c.date,
      modifiedTime: c.updated ?? c.date,
    }),
  };
}

/**
 * The hero image, when a case sets one. Its intrinsic dimensions are read from
 * the file at build time, exactly as a post image is, so the box is reserved
 * before the bytes arrive and the page never jumps mid-read.
 */
function Hero({ image, slug }: { image: NonNullable<Case["image"]>; slug: string }) {
  const resolved = postAssets(`/portfolio/${slug}`).resolve(image.src);
  if (resolved?.kind !== "raster") {
    throw new Error(
      `case hero image not found or not a raster image: "${image.src}" — ` +
        `drop it in public/portfolio/${slug}/ and reference it by name.`,
    );
  }

  return (
    <figure className={pf.hero}>
      <Image
        src={resolved.src}
        alt={image.alt}
        width={resolved.width}
        height={resolved.height}
        sizes="(max-width: 900px) 100vw, 1080px"
        priority
      />
    </figure>
  );
}

export default async function CasePage({ params }: CasePageProps) {
  const { slug } = await params;
  const c = findCase(slug);
  if (!c) notFound();

  const comingSoon = isComingSoonCase(c);

  // Sector leads the kicker, so the metadata line carries what is left:
  // period, state and role, each only when the case has it.
  const meta = [
    c.period,
    comingSoon ? "coming soon" : c.status,
    c.role,
  ].filter(Boolean);

  // Neighbouring cases, wrapping — the same order the overview shows.
  const all = CASES;
  const i = all.findIndex((x) => x.slug === c.slug);
  const prev = all[(i - 1 + all.length) % all.length]!;
  const next = all[(i + 1) % all.length]!;

  return (
    <div className={styles.shell}>
      <script
        type="application/ld+json"
        // Built from static case data above — safe to inline as JSON-LD.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(caseJsonLd(c)) }}
      />

      <article className={styles.article}>
        <div className={styles.metaBar}>
          <span className={styles.kicker}>
            Case {c.n} · {c.sector}
          </span>
          <Link href="/portfolio" className={styles.backLink}>
            ← all work
          </Link>
        </div>

        <h1 className={styles.title}>{c.title}</h1>
        <p className={pf.kind}>{c.kind}</p>
        {meta.length > 0 && <p className={pf.meta}>{meta.join("  ·  ")}</p>}

        <ul className={pf.tags}>
          {c.tags.map((tag) => (
            <li key={tag} className={pf.tag}>
              {tag}
            </li>
          ))}
        </ul>

        {c.image && <Hero image={c.image} slug={c.slug} />}

        {comingSoon ? (
          <div className={pf.comingSoon} data-case-coming-soon="">
            <p className={pf.comingSoonMark}>🚧 coming soon</p>
            <p className={pf.comingSoonText}>
              This case is being written up soon. Want to know more now, or
              build something similar? Feel free to get in touch.
            </p>
          </div>
        ) : (
          <div className={styles.body}>
            <PostBody
              markdown={c.body}
              assetBase={`/portfolio/${c.slug}`}
              lang="en"
            />
          </div>
        )}

        {!comingSoon && c.videos?.length ? (
          <VideoPreviews videos={c.videos} />
        ) : null}
      </article>

      <footer className={pf.footer}>
        <nav className={pf.buttons} aria-label="Other cases">
          <Link
            href={`/portfolio/${prev.slug}`}
            rel="prev"
            className={pf.outlineBtn}
          >
            ← prev
          </Link>
          <Link
            href={`/portfolio/${next.slug}`}
            rel="next"
            className={pf.outlineBtn}
          >
            next →
          </Link>

          {/*
           * "read the case study →" appears only when caseUrl is set. Add it in
           * cases.ts to activate the button — no change to this page needed.
           */}
          {c.caseUrl && (
            <a
              href={c.caseUrl}
              target="_blank"
              rel="noreferrer"
              className={pf.outlineBtn}
            >
              read the case study →
            </a>
          )}

          <a
            href={CONTACT.linkedin}
            target="_blank"
            rel="noreferrer"
            className={pf.ctaBtn}
          >
            work with me →
          </a>
        </nav>

        <p className={pf.footerLinks}>
          <Link href="/portfolio">← all work</Link>
          {" · "}
          <Link href="/">back to the terminal</Link>
        </p>
      </footer>
    </div>
  );
}
