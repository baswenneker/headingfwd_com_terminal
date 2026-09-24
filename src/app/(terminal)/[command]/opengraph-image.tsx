import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "~/app/_components/og-card";
import { COMMAND_PAGES } from "~/app/_components/terminal-commands";

/**
 * `/<command>/opengraph-image` — one social card per command deep link.
 *
 * Without this file the six command pages fell back to the site-wide card, so
 * a link to `/services` previewed as the homepage. The slots come from
 * COMMAND_PAGES, the same single source the route and its metadata use, so a
 * new command page gets a card of its own with no change here.
 */

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "HeadingFWD — AI Engineering & Consultancy";

/**
 * Only the registered commands get a card, like the page itself: any other
 * segment is a 404 rather than a card rendered on demand for `/anything`.
 */
export const dynamicParams = false;

/** One card per registered command, pre-rendered alongside its page. */
export function generateStaticParams() {
  return COMMAND_PAGES.map((c) => ({ command: c.token }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ command: string }>;
}) {
  const { command } = await params;
  const page = COMMAND_PAGES.find((c) => c.token === command);

  return ogCard({
    kicker: `/${command}`,
    title: page?.title ?? "HeadingFWD",
    lead: page?.description,
    cta: "Open de terminal",
  });
}
