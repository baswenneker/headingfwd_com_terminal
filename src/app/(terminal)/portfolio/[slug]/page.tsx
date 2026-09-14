import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { Terminal } from "~/app/_components/terminal";
import { visibleCases, type Case } from "~/content/cases";
import {
  ORGANIZATION_ID,
  PERSON_ID,
  SITE_NAME,
  SITE_URL,
} from "~/config/site";

/**
 * `/portfolio/<slug>` — deep link that opens the terminal straight into the
 * fullscreen portfolio overlay on one case's detail view. Esc first returns
 * to the case list, then to the terminal — identical to browsing there by
 * hand. The overlay renders the full write-up server-side, so every case is
 * individually indexable and shareable.
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
 * `dateModified` comes from the case's `updated` field, the same single
 * source the sitemap's `lastModified` uses.
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
        ...(c.updated ? { dateModified: c.updated } : {}),
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
    alternates: {
      canonical: `/portfolio/${c.slug}`,
    },
    openGraph: {
      // "article", matching the Article node in the JSON-LD below — the two
      // must agree or a scraper gets contradictory signals. Title and
      // description are unchanged, so link previews keep looking the same.
      type: "article",
      ...(c.updated ? { modifiedTime: c.updated } : {}),
      url: `/portfolio/${c.slug}`,
      title: `${c.title} — HeadingFWD`,
      description,
    },
  };
}

export default async function CasePage({ params }: CasePageProps) {
  const { slug } = await params;
  const c = findCase(slug);
  if (!c) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        // Built from static case data above — safe to inline as JSON-LD.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(caseJsonLd(c)) }}
      />
      <Terminal initialCaseSlug={slug} />
    </>
  );
}
