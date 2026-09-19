import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "~/app/_components/og-card";
import { visibleCases } from "~/content/cases";

/**
 * `/portfolio/<slug>/opengraph-image` — the social card for one case.
 *
 * No case carries its own image, so all seven case pages previewed as the
 * homepage. The card states what the case page's meta bar states: the case
 * number and its sector as the kicker, the title, and `kind` — the one-line
 * outcome summary — as the lead.
 */

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "HeadingFWD — portfolio case";

/** One card per visible case, matching the page's own static params. */
export function generateStaticParams() {
  return visibleCases().map((c) => ({ slug: c.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = visibleCases().find((x) => x.slug === slug);

  return ogCard({
    kicker: c ? `Case ${c.n} · ${c.sector}` : "Portfolio",
    title: c?.title ?? "HeadingFWD",
    lead: c?.kind,
    cta: "Lees de case",
    footerUrl: "headingfwd.com/portfolio",
  });
}
