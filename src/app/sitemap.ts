import { type MetadataRoute } from "next";
import { COMMAND_PAGES } from "~/app/_components/terminal-commands";
import { visibleCases } from "~/content/cases";
import { lastModified, postPath, publishedPosts } from "~/content/posts";
import { SITE_URL } from "~/config/site";

/**
 * `/sitemap.xml` — the indexable surfaces of the site. The two hand-written
 * HTML routes (terminal home, portfolio list) plus every derived deep link:
 * one URL per visible case (from `visibleCases()`) and one per registered
 * command page (from `COMMAND_PAGES`) — the same single sources of truth the
 * routes themselves are generated from, so the sitemap can never drift.
 * `/llms.txt`, the plain-text agent source, is a real crawlable URL too.
 *
 * The blog adds `/blog` plus one URL per PUBLISHED post — `publishedPosts()`,
 * the same predicate the overview and the feed use, so a draft or a
 * future-dated post is absent here as well.
 *
 * Case and post entries carry `lastModified` from their own `updated` field — the
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

  const postPages = publishedPosts().map((p) => ({
    url: `${SITE_URL}${postPath(p)}`,
    lastModified: lastModified(p),
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
    {
      url: `${SITE_URL}/blog`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...casePages,
    ...postPages,
    ...commandPages,
    {
      url: `${SITE_URL}/llms.txt`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
