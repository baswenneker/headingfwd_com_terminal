import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "~/app/_components/og-card";
import { findRoutablePost } from "~/content/posts";

/**
 * `/blog/<slug>/opengraph-image` — the social card for one post.
 *
 * Next picks this file up automatically for the route it sits in and adds the
 * resulting URL to the page's Open Graph and Twitter metadata, so
 * `generateMetadata` in page.tsx needs no `images` entry. A post that sets
 * `image` in its frontmatter still wins: an explicit `openGraph.images`
 * overrides the file convention.
 *
 * The card is drawn by `~/app/_components/og-card`, shared with every other
 * `opengraph-image` route; the post supplies the kicker, the title and the
 * footer line.
 */

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "HeadingFWD blog post";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = findRoutablePost(slug);

  return ogCard({
    kicker: post?.kicker ?? "Blog post",
    title: post?.title ?? "HeadingFWD",
    cta: "Lees de post",
    footerUrl: "headingfwd.com/blog",
  });
}
