import { type Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "../../blog.module.css";
import { PostBody } from "~/app/_components/post-body";
import { ORGANIZATION_ID, PERSON_ID, SITE_NAME, SITE_URL } from "~/config/site";
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
 * The route enumerates its slugs at build time and treats anything outside
 * that set as a hard 404 (`dynamicParams = false`), matching the case and
 * command routes. Which slugs exist depends on the environment: published
 * posts everywhere, plus drafts outside production, which render with a
 * visible banner and `noindex`. A future-dated post has no page at all until
 * its date arrives — and because the set is computed at build time, it
 * appears only after the next deploy. That is accepted, not a bug.
 */

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

/** Pre-render one page per routable post. */
export function generateStaticParams() {
  return routablePosts().map((p) => ({ slug: p.slug }));
}

// Slugs outside generateStaticParams (drafts in production, future-dated
// posts, typos) are a hard 404.
export const dynamicParams = false;

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
  const post = findRoutablePost(slug);
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
          <p className={styles.draftBanner} data-post-draft-banner="">
            Draft — not published. Visible here because this is not production.
          </p>
        ) : null}

        <h1 className={styles.title}>{post.title}</h1>

        <div className={styles.body}>
          <PostBody post={post} />
        </div>
      </article>

      {/*
        In the post's own language: this notice is written for a visitor who
        arrived from a copy on LinkedIn, and it has to be read to land.
      */}
      <footer className={styles.origin} lang={POST_LOCALES[post.lang].html}>
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
