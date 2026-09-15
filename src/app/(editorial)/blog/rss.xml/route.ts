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

function buildFeed(): string {
  const posts = publishedPosts();
  const newest = posts[0];

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}${postPath(post)}`;
      return [
        // RSS 2.0 has no per-item language element, so a Dutch post carries
        // its language as `xml:lang` on the item. The channel language below
        // stays "en", the site's own language.
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
    "    <language>en</language>",
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
