import { type MetadataRoute } from "next";
import { COMMAND_PAGES } from "~/app/_components/terminal-commands";
import { visibleCases } from "~/content/cases";
import { lastModified, postPath, publishedPosts } from "~/content/posts";
import { SITE_CONTENT_UPDATED } from "~/content/site-content";
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
 * EVERY url carries a `lastModified`, and none of them is a build timestamp:
 *
 *   - a case  → `updated ?? date`, the same pair `Article.dateModified` uses;
 *   - a post  → `lastModified(post)`, likewise;
 *   - a list  → the newest date among its own children, so `/blog` and
 *               `/portfolio` move when something is published under them;
 *   - the rest → `SITE_CONTENT_UPDATED` from `~/content/site-content`, the
 *               hand-maintained date of the copy those pages are built from.
 *
 * Stamping `Date.now()` instead would tell crawlers the entire site changed on
 * every deploy, and the metadata route runs during static generation where
 * `Date.now()` is discouraged anyway.
 */

/** The most recent of a set of ISO dates; `undefined` when there are none. */
function newest(dates: string[]): string | undefined {
  return dates.length === 0
    ? undefined
    : dates.reduce((a, b) => (a > b ? a : b));
}

/** A case's own last-changed date: its revision, else its publication. */
function caseModified(c: { updated?: string; date: string }): string {
  return c.updated ?? c.date;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const cases = visibleCases();
  const posts = publishedPosts();

  const casePages = cases.map((c) => ({
    url: `${SITE_URL}/portfolio/${c.slug}`,
    lastModified: caseModified(c),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const postPages = posts.map((p) => ({
    url: `${SITE_URL}${postPath(p)}`,
    lastModified: lastModified(p),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const commandPages = COMMAND_PAGES.map((c) => ({
    url: `${SITE_URL}/${c.token}`,
    lastModified: SITE_CONTENT_UPDATED,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: SITE_CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/portfolio`,
      lastModified: newest(cases.map(caseModified)) ?? SITE_CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: newest(posts.map(lastModified)) ?? SITE_CONTENT_UPDATED,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...casePages,
    ...postPages,
    ...commandPages,
    {
      url: `${SITE_URL}/llms.txt`,
      lastModified: SITE_CONTENT_UPDATED,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
