/**
 * `/blog/rss.xml` — the blog's feed.
 *
 * Built from `publishedPosts()`, the same list the overview and the sitemap
 * use, so a draft or a future-dated post can never leak into it. The route is
 * statically rendered at build time and served as a static asset.
 *
 * `/blog/rss.xml` is a static segment and therefore wins over the sibling
 * `[slug]` route; the feed is not reachable as a post.
 */

import { SITE_NAME, SITE_URL } from "~/config/site";
import { BLOG } from "~/content/site-content";
import {
  lastModified,
  POST_LOCALES,
  postPath,
  publishedPosts,
  toRfc822,
} from "~/content/posts";

export const dynamic = "force-static";

const FEED_URL = `${SITE_URL}/blog/rss.xml`;

/** Escape the five characters XML cannot carry as text. */
function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * The channel's language: the one every published post shares, else "en".
 *
 * RSS 2.0 has a single `<language>` for the whole channel, so a feed whose
 * only item was Dutch used to announce itself as English. When the posts
 * disagree the channel falls back to the site's own language and each item
 * keeps saying what it is in `xml:lang`.
 */
function channelLanguage(posts: { lang: keyof typeof POST_LOCALES }[]): string {
  const languages = new Set(posts.map((p) => POST_LOCALES[p.lang].html));
  const only = [...languages];
  return only.length === 1 ? only[0]! : "en";
}

function buildFeed(): string {
  const posts = publishedPosts();
  const newest = posts[0];

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}${postPath(post)}`;
      return [
        // RSS 2.0 has no per-item language element, so a Dutch post carries
        // its language as `xml:lang` on the item, whatever the channel says.
        `    <item xml:lang="${POST_LOCALES[post.lang].html}">`,
        `      <title>${xml(post.title)}</title>`,
        `      <link>${xml(url)}</link>`,
        `      <guid isPermaLink="true">${xml(url)}</guid>`,
        `      <description>${xml(post.excerpt)}</description>`,
        `      <pubDate>${toRfc822(post.date)}</pubDate>`,
        ...(post.tags ?? []).map((t) => `      <category>${xml(t)}</category>`),
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${xml(`${SITE_NAME} — Blog`)}</title>`,
    `    <link>${SITE_URL}/blog</link>`,
    `    <description>${xml(BLOG.description)}</description>`,
    `    <language>${channelLanguage(posts)}</language>`,
    `    <atom:link href="${FEED_URL}" rel="self" type="application/rss+xml" />`,
    ...(newest
      ? [`    <lastBuildDate>${toRfc822(lastModified(newest))}</lastBuildDate>`]
      : []),
    items,
    "  </channel>",
    "</rss>",
    "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function GET(): Response {
  return new Response(buildFeed(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
