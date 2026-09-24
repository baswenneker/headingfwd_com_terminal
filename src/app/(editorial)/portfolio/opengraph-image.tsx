import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "~/app/_components/og-card";

/**
 * `/portfolio/opengraph-image` — the card for the portfolio overview.
 *
 * The lead repeats the page's own meta description. It is a literal here
 * rather than an import: a `page.tsx` exports only what Next's route contract
 * allows, and the copy belongs to the page, not to the metadata helper.
 */

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "HeadingFWD — Portfolio";

export default async function Image() {
  return ogCard({
    kicker: "Portfolio",
    title: "Selected work",
    lead: [
      "Selected work by Bas Wenneker / HeadingFWD —",
      "agents, assistants and AI workflows in production.",
    ],
    cta: "Bekijk het werk",
    footerUrl: "headingfwd.com/portfolio",
  });
}
