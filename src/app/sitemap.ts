import { type MetadataRoute } from "next";
import { COMMAND_PAGES } from "~/app/_components/terminal-commands";
import { visibleCases } from "~/content/cases";
import { SITE_URL } from "~/config/site";

/**
 * `/sitemap.xml` — the indexable surfaces of the site. The two hand-written
 * HTML routes (terminal home, portfolio list) plus every derived deep link:
 * one URL per visible case (from `visibleCases()`) and one per registered
 * command page (from `COMMAND_PAGES`) — the same single sources of truth the
 * routes themselves are generated from, so the sitemap can never drift.
 * `/llms.txt`, the plain-text agent source, is a real crawlable URL too.
 *
 * Case entries carry `lastModified` from the case's own `updated` field — the
 * same single source that feeds `Article.dateModified` on the case page, so
 * the two dates can never drift. Everything else stays undated rather than
 * stamped with a build-time date: the metadata route runs during static
 * generation where `Date.now()` is discouraged, and an inaccurate date is
 * worse than none.
 */

export default function sitemap(): MetadataRoute.Sitemap {
  const casePages = visibleCases().map((c) => ({
    url: `${SITE_URL}/portfolio/${c.slug}`,
    ...(c.updated ? { lastModified: c.updated } : {}),
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
