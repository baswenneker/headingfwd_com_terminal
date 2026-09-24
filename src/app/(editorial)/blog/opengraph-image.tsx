import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "~/app/_components/og-card";
import { BLOG } from "~/content/site-content";

/**
 * `/blog/opengraph-image` — the card for the blog overview.
 *
 * The post pages have had their own card all along; the overview fell back to
 * the site-wide one, so a link to `/blog` previewed as the homepage. The lead
 * is `BLOG.description`, the same string the meta description and the feed's
 * channel description use.
 */

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "HeadingFWD — Blog";

export default async function Image() {
  return ogCard({
    kicker: "Blog",
    title: "Writing on AI engineering",
    lead: BLOG.description,
    cta: "Lees de posts",
    footerUrl: "headingfwd.com/blog",
  });
}
