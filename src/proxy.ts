import { NextResponse, type NextRequest } from "next/server";
import { visibleCases } from "~/content/cases";
import { allPosts, draftPreviewEnabled } from "~/content/posts";

/**
 * Turns away `/blog/<slug>` and `/portfolio/<slug>` URLs that name no post or
 * case, before the dynamic route renders them.
 *
 * Without this, `next start` renders the dynamic route for any slug a crawler
 * or scanner tries, calls notFound(), and stores the result in the route
 * cache: six files per unknown URL. A rewrite to a path without a route skips
 * that render and serves global-not-found.tsx with a 404 status instead.
 *
 * The check is only "does a file exist": a draft or a future-dated post passes
 * here, and its page decides whether it is visible (and calls notFound() when
 * it is not).
 */

const CASE_SLUGS = new Set(visibleCases().map((c) => c.slug));

/** A path no route matches, so Next serves global-not-found.tsx for it. */
const NOT_FOUND_PATH = "/__not-found";

function knownPostSlug(slug: string): boolean {
  // Outside production the author may have saved the post a moment ago, so
  // leave the decision to the page, which re-reads the directory.
  if (draftPreviewEnabled()) return true;
  return allPosts().some((p) => p.slug === slug);
}

export function proxy(request: NextRequest) {
  const [, section, rawSlug = ""] = request.nextUrl.pathname.split("/");
  let slug: string;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    slug = "";
  }

  const known =
    section === "blog"
      ? slug === "rss.xml" || knownPostSlug(slug)
      : CASE_SLUGS.has(slug);
  if (known) return NextResponse.next();

  return NextResponse.rewrite(new URL(NOT_FOUND_PATH, request.url));
}

export const config = {
  // One segment only: `/blog/<slug>/opengraph-image-…` stays outside.
  matcher: ["/blog/:slug", "/portfolio/:slug"],
};
