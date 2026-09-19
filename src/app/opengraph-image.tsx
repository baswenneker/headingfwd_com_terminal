import {
  OG_CONTENT_TYPE,
  OG_INK_DIM,
  OG_SIZE,
  ogCard,
} from "~/app/_components/og-card";

/**
 * `/opengraph-image` — the site-wide social card.
 *
 * Next applies this to every route that does not declare its own. The command
 * pages, both overviews, a case and a post each declare one now, so this is
 * the card for `/` and for anything added later. A page that sets
 * `openGraph.images` in its metadata still overrides both.
 *
 * The card itself is drawn by `~/app/_components/og-card`, shared with those
 * routes; only the slots below are this page's.
 */

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "HeadingFWD — AI Engineering & Consultancy";

export default async function Image() {
  return ogCard({
    variant: "hero",
    // Laid out by hand: the ampersand is dimmed and holds the line break, so
    // "Consultancy" always lands on its own line.
    // An array, not a fragment: satori lays a fragment's children out as one
    // row, which would put "Consultancy" beside the ampersand.
    title: [
      <div key="line-1" style={{ display: "flex", gap: 18 }}>
        <span>AI Engineering</span>
        <span style={{ color: OG_INK_DIM, letterSpacing: 0 }}>&amp;</span>
      </div>,
      <span key="line-2">Consultancy</span>,
    ],
    lead: [
      "Ik bouw agents, loops en intelligente software.",
      "Training voor dev-teams en consultancy op AI-strategie.",
    ],
    cta: "Open de terminal",
  });
}
