import { type MetadataRoute } from "next";
import { COMMAND_PAGES } from "~/app/_components/terminal-commands";
import { visibleCases } from "~/content/cases";

/**
 * `/sitemap.xml` — the indexable surfaces of the site. The two hand-written
 * HTML routes (terminal home, portfolio list) plus every derived deep link:
 * one URL per visible case (from `visibleCases()`) and one per registered
 * command page (from `COMMAND_PAGES`) — the same single sources of truth the
 * routes themselves are generated from, so the sitemap can never drift.
 * `/llms.txt`, the plain-text agent source, is a real crawlable URL too.
 *
 * `lastModified` is intentionally omitted rather than stamped with a build-time
 * date: the metadata route runs during static generation where `Date.now()` is
 * discouraged, and an inaccurate date is worse than none.
 */
const SITE_URL = "https://headingfwd.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const casePages = visibleCases().map((c) => ({
    url: `${SITE_URL}/portfolio/${c.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const commandPages = COMMAND_PAGES.map((c) => ({
    url: `${SITE_URL}/${c.token}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/portfolio`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    ...casePages,
    ...commandPages,
    {
      url: `${SITE_URL}/llms.txt`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
