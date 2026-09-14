import { type Metadata } from "next";
import Link from "next/link";
import styles from "../blog.module.css";
import { BLOG } from "~/content/site-content";
import {
  draftPreviewEnabled,
  formatPostDate,
  POST_LOCALES,
  postPath,
  routablePosts,
} from "~/content/posts";

/**
 * `/blog` — every post, newest first.
 *
 * Outside production the list also carries drafts, each marked with a badge,
 * so the author can read a piece in place while writing it. Future-dated
 * posts are absent everywhere until their date arrives, preview included.
 */

const TITLE = "Blog — writing on AI engineering";

export const metadata: Metadata = {
  title: TITLE,
  description: BLOG.description,
  alternates: {
    canonical: "/blog",
    // Makes the feed discoverable from the page itself, not only by guessing
    // the URL: browsers and feed readers look for this link.
    types: { "application/rss+xml": "/blog/rss.xml" },
  },
  openGraph: {
    type: "website",
    url: "/blog",
    title: `${TITLE} — HeadingFWD`,
    description: BLOG.description,
  },
};

export default function BlogIndexPage() {
  const posts = routablePosts();
  const previewing = draftPreviewEnabled();

  return (
    <div className={styles.shell}>
      <div className={styles.metaBar}>
        <span className={styles.kicker}>Bas Wenneker · Journal</span>
        <Link href="/" className={styles.backLink}>
          ← back to the terminal
        </Link>
      </div>

      <h1 className={styles.title}>Blog</h1>
      <p className={styles.overviewLead}>{BLOG.intro}</p>

      {posts.length === 0 ? (
        <p className={styles.empty}>No posts yet. Check back soon.</p>
      ) : (
        <ul className={styles.postList}>
          {posts.map((post) => (
            // Everything in a card — the date, the title, the excerpt — is in
            // the post's own language, while the page around it is English.
            // Stating that here is what makes a screen reader pronounce a
            // Dutch title in Dutch; the post page does the same on its
            // `article` element.
            <li
              key={post.slug}
              className={styles.postItem}
              lang={POST_LOCALES[post.lang].html}
            >
              <Link href={postPath(post)} className={styles.postLink}>
                <time className={styles.postDate} dateTime={post.date}>
                  {formatPostDate(post.date, post.lang)}
                </time>
                <div>
                  <h2 className={styles.postTitle}>
                    {post.title}
                    {/* Chrome, not content: English whatever the post is. */}
                    {previewing && post.draft ? (
                      <span className={styles.draftBadge} lang="en">
                        draft
                      </span>
                    ) : null}
                  </h2>
                  <p className={styles.postExcerpt}>{post.excerpt}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
