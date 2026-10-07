import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../editorial.module.css";
import blog from "../../blog.module.css";
import { PostBody } from "~/app/_components/post-body";
import { ORGANIZATION_ID, PERSON_ID, SITE_NAME, SITE_URL } from "~/config/site";
import { POST_COPY } from "~/content/site-content";
import {
  draftPreviewEnabled,
  formatPostDate,
  lastModified,
  POST_LOCALES,
  postPath,
  type Post,
} from "~/content/posts";
import { getRoutablePost, getRoutablePosts } from "~/content/cached-posts";

/**
 * `/blog/<slug>` — one post, server-rendered outside the terminal.
 *
 * The route prerenders one page per routable post at build time. Which slugs
 * exist depends on the environment: published posts everywhere, plus drafts
 * outside production, which render with a visible banner and `noindex`.
 *
 * A slug outside that set renders on demand, so a post that reaches its date
 * after the deploy gets a page without a rebuild, and a post the author has
 * just written is reachable under a running dev server. Nothing is thereby
 * reachable that should not be: `getRoutablePost` is the single gate, and the
 * page calls `notFound()` for every slug it does not return. A typo, a
 * future-dated post and — in production — a draft are all hard 404s.
 * `ENVIRONMENT` defaults to production, so an unset variable still hides
 * drafts.
 */

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Pre-render one page per routable post.
 *
 * With Cache Components the list must not be empty, or the build fails. With
 * nothing published — every post a draft or scheduled — it names one slug no
 * post can have (frontmatter slugs are lowercase kebab-case), which
 * prerenders as a 404. A scheduled post then still goes live on its date.
 */
export async function generateStaticParams() {
  const posts = await getRoutablePosts();
  if (posts.length === 0) return [{ slug: "_none" }];
  return posts.map((p) => ({ slug: p.slug }));
}

/**
 * A slug that does not resolve must be a hard 404, so the page reads it and
 * calls `notFound()` before anything streams. That puts URL data outside
 * `<Suspense>`, which Partial Prefetching's navigation check flags; this
 * opts the route out of that check only. The page is still fully static,
 * and the links into it set `prefetch`, so a prefetch carries the whole page.
 */
export const instant = false;

/**
 * Structured data for one post: an `Article` wired into the site-wide graph
 * from the root layout (the same `#person` / `#organization` ids), plus the
 * `BreadcrumbList` that lets a search result show "HeadingFWD › Blog › Post".
 *
 * `dateModified` comes from `updated` when set — the same single source the
 * sitemap's `lastModified` uses, so the two can never drift.
 */
function postJsonLd(post: Post) {
  const url = `${SITE_URL}${postPath(post)}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        url,
        mainEntityOfPage: url,
        headline: post.title,
        description: post.excerpt,
        inLanguage: POST_LOCALES[post.lang].html,
        datePublished: post.date,
        dateModified: lastModified(post),
        author: { "@id": PERSON_ID },
        publisher: { "@id": ORGANIZATION_ID },
        ...(post.tags ? { keywords: post.tags } : {}),
        ...(post.image ? { image: `${SITE_URL}${post.image}` } : {}),
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: SITE_NAME,
            item: `${SITE_URL}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Blog",
            item: `${SITE_URL}/blog`,
          },
          { "@type": "ListItem", position: 3, name: post.title, item: url },
        ],
      },
    ],
  };
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getRoutablePost(slug);
  if (!post) return {};

  const isDraft = Boolean(post.draft);

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: postPath(post),
      types: { "application/rss+xml": "/blog/rss.xml" },
    },
    // A draft is only ever reachable outside production, but say noindex
    // explicitly so a preview deployment can never be indexed.
    ...(isDraft ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: "article",
      url: postPath(post),
      title: `${post.title} — HeadingFWD`,
      description: post.excerpt,
      locale: POST_LOCALES[post.lang].og,
      publishedTime: post.date,
      modifiedTime: lastModified(post),
      authors: ["Bas Wenneker"],
      ...(post.tags ? { tags: post.tags } : {}),
      ...(post.image ? { images: [{ url: post.image }] } : {}),
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getRoutablePost(slug);
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
