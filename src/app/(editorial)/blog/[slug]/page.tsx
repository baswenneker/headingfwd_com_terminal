import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../editorial.module.css";
import blog from "../../blog.module.css";
import { PostBody } from "~/app/_components/post-body";
import { socialMeta } from "~/config/metadata";
import { articleGraph } from "~/config/structured-data";
import { SITE_URL } from "~/config/site";
import { POST_COPY } from "~/content/site-content";
import {
  draftPreviewEnabled,
  findRoutablePost,
  formatPostDate,
  lastModified,
  POST_LOCALES,
  postPath,
  routablePosts,
  type Post,
} from "~/content/posts";

/**
 * `/blog/<slug>` — one post, server-rendered outside the terminal.
 *
 * The route enumerates its slugs at build time and, in production, treats
 * anything outside that set as a hard 404, matching the case and command
 * routes. Which slugs exist depends on the environment: published posts
 * everywhere, plus drafts outside production, which render with a visible
 * banner and `noindex`. A future-dated post has no page at all until its date
 * arrives — and because the set is computed at build time, it appears only
 * after the next deploy. That is accepted, not a bug.
 */

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

/** Pre-render one page per routable post. */
export function generateStaticParams() {
  return routablePosts().map((p) => ({ slug: p.slug }));
}

/**
 * Slugs outside `generateStaticParams` render on demand rather than being
 * refused by the router, because `generateStaticParams` runs once and is not
 * re-evaluated when a file appears under a running dev server. Pinned false,
 * a post the author had just written showed up in the overview — `allPosts()`
 * skips its cache outside production for exactly that — but 404'd on its own
 * URL until the server was restarted.
 *
 * Nothing is thereby reachable that was not reachable before: `routablePosts`
 * remains the single gate, and the page below calls `notFound()` for every
 * slug `findRoutablePost` does not return. A typo, a future-dated post and —
 * in production — a draft are all still 404s, now decided by that predicate
 * instead of by the router's param list. `ENVIRONMENT` defaults to production,
 * so an unset variable still hides drafts.
 *
 * Next requires this to be a literal boolean; it cannot be computed per
 * environment, which is why the check lives in the page instead.
 */
export const dynamicParams = true;

/**
 * Structured data for one post: an `Article` wired into the site-wide graph
 * from the root layout (the same `#person` / `#organization` ids), plus the
 * `BreadcrumbList` that lets a search result show "HeadingFWD › Blog › Post".
 *
 * `dateModified` comes from `updated` when set — the same single source the
 * sitemap's `lastModified` uses, so the two can never drift.
 *
 * The shape itself lives in `~/config/structured-data`, shared with the case
 * page and the two overviews.
 */
function postJsonLd(post: Post) {
  const url = `${SITE_URL}${postPath(post)}`;

  return articleGraph({
    url,
    headline: post.title,
    description: post.excerpt,
    inLanguage: POST_LOCALES[post.lang].html,
    datePublished: post.date,
    dateModified: lastModified(post),
    keywords: post.tags,
    ...(post.image ? { image: `${SITE_URL}${post.image}` } : {}),
    trail: [
      { name: "Blog", path: "/blog" },
      { name: post.title, path: postPath(post) },
    ],
  });
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = findRoutablePost(slug);
  if (!post) return {};

  const isDraft = Boolean(post.draft);

  const social = socialMeta({
    title: post.title,
    description: post.excerpt,
    path: postPath(post),
    type: "article",
    locale: POST_LOCALES[post.lang].og,
    publishedTime: post.date,
    modifiedTime: lastModified(post),
    authors: ["Bas Wenneker"],
    ...(post.tags ? { tags: post.tags } : {}),
    // A post that sets `image` in its frontmatter still wins over the
    // generated card: an explicit `images` entry beats the file convention.
    ...(post.image ? { images: [{ url: post.image }] } : {}),
  });

  return {
    title: post.title,
    description: post.excerpt,
    // A draft is only ever reachable outside production, but say noindex
    // explicitly so a preview deployment can never be indexed.
    ...(isDraft ? { robots: { index: false, follow: false } } : {}),
    ...social,
    alternates: {
      ...social.alternates,
      types: { "application/rss+xml": "/blog/rss.xml" },
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = findRoutablePost(slug);
  if (!post) notFound();

  const isDraft = Boolean(post.draft) && draftPreviewEnabled();
  const copy = POST_COPY[post.lang];

  return (
    <div className={styles.shell}>
      <script
        type="application/ld+json"
        // Built from the post's own validated frontmatter — safe to inline.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(postJsonLd(post)) }}
      />

      {/*
        The root layout owns the `html` element and cannot see route params,
        so a Dutch post states its language here instead. The same language
        is stated in the structured data and the Open Graph locale.
      */}
      <article lang={POST_LOCALES[post.lang].html} className={styles.article}>
        <div className={styles.metaBar}>
          <span className={styles.kicker}>{post.kicker ?? "HeadingFWD"}</span>
          <time dateTime={post.date}>
            {formatPostDate(post.date, post.lang)}
          </time>
        </div>

        {isDraft ? (
          <p className={blog.draftBanner} data-post-draft-banner="">
            Draft — not published. Visible here because this is not production.
          </p>
        ) : null}

        <h1 className={styles.title}>{post.title}</h1>

        <div className={styles.body}>
          <PostBody
            markdown={post.body}
            assetBase={`/blog/${post.slug}`}
            lang={post.lang}
          />
        </div>
      </article>

      {/*
        Who wrote this and where to go next. A post used to end on "all posts ·
        back to the terminal" and nothing else, so the piece that brings in the
        most readers said least about the person who wrote it (#13 D3). In the
        post's own language, like everything else a reader reads here.
      */}
      <aside className={blog.author} lang={POST_LOCALES[post.lang].html}>
        <p>{copy.author}</p>
        <p className={blog.authorLinks}>
          <Link href="/portfolio" prefetch={false}>
            → {copy.seeTheWork}
          </Link>
          <Link href="/contact" prefetch={false}>
            → {copy.getInTouch}
          </Link>
        </p>
      </aside>

      {/*
        In the post's own language: this notice is written for a visitor who
        arrived from a copy on LinkedIn, and it has to be read to land.
      */}
      <footer className={blog.origin} lang={POST_LOCALES[post.lang].html}>
        <p>{copy.origin}</p>
        <p>
          <Link href="/blog">← {copy.allPosts}</Link>
          {" · "}
          <Link href="/">{copy.backToTerminal}</Link>
        </p>
      </footer>
    </div>
  );
}
