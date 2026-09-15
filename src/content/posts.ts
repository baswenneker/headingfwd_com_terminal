/**
 * Canonical post data — the single source of truth for the blog.
 *
 * A post is one Markdown file with YAML frontmatter in `content/blog/`.
 * Adding a file publishes a post: the overview, the post page, the sitemap,
 * the RSS feed and `/llms.txt` all derive from `allPosts()` below, so they
 * can never drift.
 *
 * This deliberately inverts the pattern used for portfolio cases, where a
 * TypeScript module is the source and the Markdown files are generated. A
 * case is a handful of structured fields; a post is long prose. See
 * `docs/adr/0001-markdown-posts.md`.
 *
 * Frontmatter is validated with zod at load time. An invalid file throws,
 * which fails the production build rather than rendering a degraded page.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { env } from "~/env";

/** Where post sources live, relative to the repository root. */
const POSTS_DIR = join(process.cwd(), "content", "blog");

/**
 * Timezone every blog date is interpreted and rendered in. Pinning it means a
 * post's date never shifts with the build server's clock: a post dated today
 * is published from midnight in Amsterdam, wherever the build runs.
 */
export const BLOG_TIMEZONE = "Europe/Amsterdam";

/**
 * Calendar dates only (`YYYY-MM-DD`) — no times, so no timezone ambiguity.
 *
 * YAML reads an unquoted `2026-03-14` as a timestamp, so the value arrives as
 * a Date. That is the author writing a perfectly ordinary date, not an error:
 * it is folded back to its UTC calendar day before validation.
 */
const isoDate = z.preprocess(
  (value) =>
    value instanceof Date && !Number.isNaN(value.getTime())
      ? value.toISOString().slice(0, 10)
      : value,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "must be a calendar date, e.g. 2026-03-14"),
);

/**
 * The languages a post can be written in, and everything that follows from
 * the choice: the BCP 47 tag on the article element and in the structured
 * data, the Open Graph locale, and the locale the date is formatted with.
 *
 * One table, so adding a third language is one edit rather than a hunt
 * through the post page, the renderer and the date formatter.
 */
export const POST_LOCALES = {
  nl: { html: "nl", og: "nl_NL", intl: "nl-NL" },
  en: { html: "en", og: "en_US", intl: "en-GB" },
} as const;

export const POST_LANGUAGES = ["nl", "en"] as const;
export type PostLanguage = (typeof POST_LANGUAGES)[number];

const frontmatterSchema = z.object({
  /** Headline of the post — also the `<title>` and the feed item title. */
  title: z.string().min(1),
  /** Publication date. A future date withholds the post until it arrives. */
  date: isoDate,
  /** Language the post is written in. */
  lang: z.enum(POST_LANGUAGES),
  /** Overview card text, meta description and feed summary. Not the lead. */
  excerpt: z.string().min(1),
  /** URL segment. Defaults to the filename without its extension. */
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be a lowercase kebab-case slug")
    .optional(),
  /** Last substantive edit; feeds `dateModified` and the sitemap's lastmod. */
  updated: isoDate.optional(),
  /** Small label above the title, top left of the meta bar. */
  kicker: z.string().optional(),
  /** Free-form topic labels. Captured, but nothing links to them yet. */
  tags: z.array(z.string()).optional(),
  /** Unfinished work: withheld in production, previewable elsewhere. */
  draft: z.boolean().optional(),
  /** Social-preview image, relative to `public/` (e.g. `/blog/x/cover.png`). */
  image: z.string().optional(),
});

export type PostFrontmatter = z.infer<typeof frontmatterSchema>;

/** A post: its validated frontmatter, its slug, and its Markdown body. */
export interface Post extends PostFrontmatter {
  /** Resolved slug — frontmatter `slug` if present, else the filename. */
  slug: string;
  /** Everything after the frontmatter fence, verbatim. */
  body: string;
}

// ── Frontmatter parsing ──────────────────────────────────────────────────────

/**
 * Split a post source into its YAML frontmatter and its Markdown body.
 *
 * The file must open with a `---` fence on its first line and close it on a
 * line of its own. Anything else is a hard error — a post without metadata
 * has no title, date or language, so there is nothing sensible to render.
 */
function splitFrontmatter(source: string, file: string) {
  const normalised = source.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  if (!normalised.startsWith("---\n")) {
    throw new Error(
      `${file}: missing YAML frontmatter (file must start "---")`,
    );
  }
  const end = normalised.indexOf("\n---", 3);
  if (end === -1) {
    throw new Error(`${file}: frontmatter fence is never closed`);
  }
  const yaml = normalised.slice(4, end + 1);
  const body = normalised.slice(normalised.indexOf("\n", end + 1) + 1);
  return { yaml, body };
}

function loadPost(filename: string): Post {
  const source = readFileSync(join(POSTS_DIR, filename), "utf8");
  const { yaml, body } = splitFrontmatter(source, filename);

  const raw: unknown = parseYaml(yaml);
  const parsed = frontmatterSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `${filename}: invalid frontmatter — ${z.prettifyError(parsed.error)}`,
    );
  }

  return {
    ...parsed.data,
    slug: parsed.data.slug ?? filename.replace(/\.md$/, ""),
    body: body.trim(),
  };
}

// ── The post list ────────────────────────────────────────────────────────────

let cache: Post[] | undefined;

/**
 * Every post on disk, newest first, drafts and future-dated posts included.
 * Callers filter with `isPublished` / `routablePosts`; nothing else should
 * touch this list directly.
 *
 * Sorted by date descending, then by slug so that two posts sharing a date
 * keep a stable order across builds.
 *
 * The result is cached in production, where the files cannot change under a
 * running server. Outside production it is re-read on every call, so a post
 * the author is writing shows up on the next refresh without a restart.
 */
export function allPosts(): Post[] {
  if (cache && !draftPreviewEnabled()) return cache;

  let filenames: string[];
  try {
    filenames = readdirSync(POSTS_DIR)
      .filter((f) => f.endsWith(".md"))
      .sort();
  } catch {
    // No content directory yet — an empty blog, not a build failure.
    filenames = [];
  }

  const bySlug = new Map<string, string>();
  const posts = filenames.map((filename) => {
    const post = loadPost(filename);
    const claimed = bySlug.get(post.slug);
    if (claimed) {
      throw new Error(
        `duplicate post slug "${post.slug}" — claimed by both ` +
          `${claimed} and ${filename}`,
      );
    }
    bySlug.set(post.slug, filename);
    return post;
  });

  posts.sort((a, b) =>
    a.date === b.date
      ? a.slug.localeCompare(b.slug)
      : b.date.localeCompare(a.date),
  );

  cache = posts;
  return posts;
}

// ── Visibility ───────────────────────────────────────────────────────────────

/** Today's calendar date in `BLOG_TIMEZONE`, as `YYYY-MM-DD`. */
export function todayInBlogTimezone(): string {
  // "en-CA" formats as YYYY-MM-DD, which sorts and compares as a plain string.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BLOG_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/**
 * The one predicate that decides visibility everywhere.
 *
 * A post is published when it is not a draft and its date has arrived in
 * Amsterdam. An unpublished post is absent from the overview, the sitemap,
 * the feed and `/llms.txt` in every environment.
 */
export function isPublished(post: Post): boolean {
  if (post.draft) return false;
  return post.date <= todayInBlogTimezone();
}

/**
 * True outside production, where the author previews unfinished work.
 *
 * The gate is `ENVIRONMENT`, not `NODE_ENV`: the end-to-end suite runs the
 * dev server with `NODE_ENV=test`, and must see drafts the way the author
 * does. An unset `ENVIRONMENT` means production, so this fails closed.
 */
export function draftPreviewEnabled(): boolean {
  return env.ENVIRONMENT === "development" || env.ENVIRONMENT === "test";
}

/**
 * Posts that get a page: everything published, plus — outside production —
 * drafts, which render with a visible DRAFT banner and `noindex`.
 *
 * Future-dated posts never get a preview. They are withheld everywhere until
 * their date, including on their own URL, which stays a hard 404.
 */
export function routablePosts(): Post[] {
  const today = todayInBlogTimezone();
  return allPosts().filter((p) =>
    p.draft ? draftPreviewEnabled() : p.date <= today,
  );
}

/** Posts for the public surfaces: overview, sitemap, RSS feed, `/llms.txt`. */
export function publishedPosts(): Post[] {
  return allPosts().filter(isPublished);
}

/** Look up one routable post by slug. */
export function findRoutablePost(slug: string): Post | undefined {
  return routablePosts().find((p) => p.slug === slug);
}

// ── Presentation helpers ─────────────────────────────────────────────────────

/** Absolute site path of a post. */
export function postPath(post: Pick<Post, "slug">): string {
  return `/blog/${post.slug}`;
}

/**
 * A post's date in its own language — "14 maart 2026" for a Dutch post,
 * "14 March 2026" for an English one. Day, month name, year; no weekday.
 *
 * The date is anchored at noon UTC before formatting so that shifting it into
 * Amsterdam can never roll it onto the previous or next day.
 */
export function formatPostDate(date: string, lang: PostLanguage): string {
  return new Intl.DateTimeFormat(POST_LOCALES[lang].intl, {
    timeZone: BLOG_TIMEZONE,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}

/** RFC 822 date for the RSS feed, at noon Amsterdam on the post's date. */
export function toRfc822(date: string): string {
  return new Date(`${date}T12:00:00Z`).toUTCString();
}

/** The date a post was last touched: `updated` when set, else `date`. */
export function lastModified(post: Post): string {
  return post.updated ?? post.date;
}
