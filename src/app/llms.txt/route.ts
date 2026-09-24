/**
 * `/llms.txt` — a plain-text, machine-readable map of the site, for AI agents
 * and crawlers to read the source directly instead of scraping the interactive
 * terminal UI. This is the canonical file; `/agents.txt` permanently redirects
 * here (see `next.config.js`).
 *
 * The file is generated from the same content the site renders:
 *   - About / specialties / stack / contact → `~/content/site-content`
 *   - Portfolio cases                        → `~/content/cases` (CASES)
 *   - Blog posts                             → `~/content/posts`
 *   - Workshops                              → `~/content/workshops`
 *
 * The short site copy is carried in full. The long-form writing is not: each
 * case and each post is one link line — title, URL and a one-line summary —
 * following the llmstxt.org convention. Those pages are server-rendered prose
 * with no application JavaScript, so an agent that follows a link gets the
 * whole piece from the page itself, always in its current form. Inlining it
 * here as well would only be a second copy to keep in step.
 *
 * Because everything is derived from those sources, the file can never drift
 * from what visitors see. In particular the cases come from `visibleCases()` —
 * the very same list that drives `/portfolio`, so a `hidden` case is absent
 * here too and a `coming-soon` case is marked as such. The route is statically
 * rendered at build time (`force-static`) and served as a static asset — no
 * work happens per request.
 */

import {
  ABOUT,
  AUDIENCE,
  CONTACT,
  CREDENTIALS,
  INTRO,
  SPECIALTIES,
  STACK,
  BLOG,
} from "~/content/site-content";
import { isComingSoonCase, visibleCases } from "~/content/cases";
import { postPath, publishedPosts } from "~/content/posts";
import { AI_CODING_WORKSHOP, workshopPath } from "~/content/workshops";
import { SITE_URL } from "~/config/site";

export const dynamic = "force-static";

function buildAgentsTxt(): string {
  const blocks: string[] = [];

  // ── Header ──────────────────────────────────────────────────────────────
  blocks.push(
    [
      "# HeadingFWD — content for agents",
      "",
      "> A plain-text map of headingfwd.com for agents and crawlers.",
      "> Each case and post is one link with a one-line summary; follow the link",
      "> for the full text, which is server-rendered prose.",
      "> Format: Markdown (UTF-8). Generated from the site's own content.",
    ].join("\n"),
  );

  // ── About ───────────────────────────────────────────────────────────────
  blocks.push(
    [
      "## About",
      "",
      "**HeadingFWD** — AI engineering & consultancy.",
      "**Bas Wenneker** — AI Lead / Engineer.",
      "",
      INTRO,
      "",
      ABOUT.lines.join(" "),
      "",
      CREDENTIALS,
      AUDIENCE,
    ].join("\n"),
  );

  // ── Specialties ────────────────────────────────────────────────────────
  blocks.push(
    [
      "## Specialties",
      "",
      ...SPECIALTIES.map((s) => `- ${s.title} — ${s.blurb}`),
    ].join("\n"),
  );

  // ── Tech stack ──────────────────────────────────────────────────────────
  blocks.push(["## Tech stack", "", ...STACK.map((s) => `- ${s}`)].join("\n"));

  // ── Portfolio / cases ─────────────────────────────────────────────────────
  // One link line per case. The full write-up lives on the case page, which is
  // server-rendered prose; follow the link to read it.
  const cases = visibleCases();
  blocks.push(
    [
      "## Portfolio / cases",
      "",
      "> Selected work. Each link is one case, written up in full on its page.",
      "",
      `- Overview: ${SITE_URL}/portfolio`,
      "",
      ...cases.map(
        (c) =>
          `- [${c.title}](${SITE_URL}/portfolio/${c.slug}): ${c.kind}` +
          (isComingSoonCase(c) ? " — coming soon" : ""),
      ),
    ].join("\n"),
  );

  // ── Workshops ───────────────────────────────────────────────────────────
  // The workshop page is UNLISTED: linked from nowhere, absent from the
  // sitemap, `noindex`. This line is the one place that names it, so an agent
  // asked about HeadingFWD's services can still find the offer.
  blocks.push(
    [
      "## Workshops",
      "",
      `- [${AI_CODING_WORKSHOP.title}](${SITE_URL}${workshopPath(AI_CODING_WORKSHOP)}): ${AI_CODING_WORKSHOP.excerpt}`,
    ].join("\n"),
  );

  // ── Blog ────────────────────────────────────────────────────────────────
  // The section is always present, even with nothing published: an agent that
  // reads this file has to be able to learn that the blog exists and where its
  // overview and feed live, and to come back to them later.
  //
  // Only PUBLISHED posts are listed: `publishedPosts()` is the same predicate
  // the overview, the sitemap and the feed use, so a draft or a future-dated
  // post is absent here too. Each one is a link line, the way cases are; the
  // article itself is on the page.
  const posts = publishedPosts();
  blocks.push(
    [
      "## Blog",
      "",
      `> ${BLOG.description}`,
      "",
      `- Overview: ${SITE_URL}/blog`,
      `- RSS feed: ${SITE_URL}/blog/rss.xml`,
      ...(posts.length === 0
        ? ["", "No posts published yet."]
        : [
            `- Published posts: ${posts.length}`,
            "",
            ...posts.map(
              (post) =>
                `- [${post.title}](${SITE_URL}${postPath(post)}): ${post.excerpt}`,
            ),
          ]),
    ].join("\n"),
  );

  // ── Contact ─────────────────────────────────────────────────────────────
  blocks.push(
    [
      "## Contact",
      "",
      `- LinkedIn: ${CONTACT.linkedin}`,
      "- Fastest reply: a DM on LinkedIn.",
      "- Or send a message straight from the terminal chat on headingfwd.com.",
      "",
      "## Work with me",
      "",
      "Building an agent, assistant or AI workflow and want it to reach production?",
      `Connect on LinkedIn (${CONTACT.linkedin}), or send a message from the terminal chat on headingfwd.com.`,
    ].join("\n"),
  );

  // Join top-level blocks with a horizontal rule for clear visual sectioning.
  return blocks.join("\n\n---\n\n") + "\n";
}

export function GET(): Response {
  return new Response(buildAgentsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
