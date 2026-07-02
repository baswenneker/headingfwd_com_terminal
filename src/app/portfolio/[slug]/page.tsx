import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { Terminal } from "~/app/_components/terminal";
import { visibleCases, type Case } from "~/content/cases";

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

export async function generateMetadata({
  params,
}: CasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const c = findCase(slug);
  if (!c) return {};

  // `kind` is the case's one-line outcome summary — ideal description lead.
  const description =
    `${c.kind}. An AI engineering case by Bas Wenneker / HeadingFWD — ` +
    `sector: ${c.sector}.`;

  return {
    title: c.title,
    description,
    alternates: {
      canonical: `/portfolio/${c.slug}`,
    },
    openGraph: {
      type: "website",
      url: `/portfolio/${c.slug}`,
      title: `${c.title} — HeadingFWD`,
      description,
    },
  };
}

export default async function CasePage({ params }: CasePageProps) {
  const { slug } = await params;
  if (!findCase(slug)) notFound();
  return <Terminal initialCaseSlug={slug} />;
}
