import { type Metadata } from "next";
import { SITE_NAME } from "~/config/site";

/**
 * One builder for every page's social metadata.
 *
 * Next does not merge `openGraph` or `twitter` across the layout/page
 * boundary: a page that sets `openGraph` and leaves `twitter` alone serves its
 * own Open Graph tags next to the ROOT layout's Twitter tags. That is exactly
 * what happened — every route but `/` advertised the site-wide title and
 * description in its `twitter:*` tags while `og:*` was page-specific.
 *
 * So the two are built together, from one title and one description, and every
 * `generateMetadata` in the app spreads the result. The " — HeadingFWD" suffix
 * on a card title lives here too, instead of being hand-appended per page next
 * to the root's `title.template`.
 *
 * `path` is a root-relative path ("/blog/my-post"). Next resolves it against
 * `metadataBase` from the root layout, so the emitted `og:url` and the
 * canonical are absolute.
 */

type OpenGraph = NonNullable<Metadata["openGraph"]>;
type Twitter = NonNullable<Metadata["twitter"]>;
type Alternates = NonNullable<Metadata["alternates"]>;

export interface SocialMetaInput {
  /** Page title, WITHOUT the brand suffix — the same string as `title`. */
  title: string;
  /** Page description, the same string as `description`. */
  description: string;
  /** Root-relative path of this page, used for `og:url` and the canonical. */
  path: string;
  /** Open Graph object type. "article" for a post or a case. */
  type?: "website" | "article";
  /** Open Graph locale, e.g. "nl_NL" for a Dutch post. */
  locale?: string;
  /**
   * Explicit card images. Leave undefined to let Next's `opengraph-image`
   * file convention fill them in: an explicit entry beats the generated card.
   */
  images?: OpenGraph["images"];
  /** `article:published_time` — first publication, ISO date. */
  publishedTime?: string;
  /** `article:modified_time` — last revision, ISO date. */
  modifiedTime?: string;
  /** `article:tag` entries. */
  tags?: string[];
  /** `article:author` entries. */
  authors?: string[];
}

export interface SocialMeta {
  openGraph: OpenGraph;
  twitter: Twitter;
  alternates: Alternates;
}

/**
 * The title as a social card shows it. The root layout's `title.template`
 * appends " — HeadingFWD" to the `<title>` element but reaches neither
 * `og:title` nor `twitter:title`, so the suffix is added here — unless the
 * title already names the brand, as the homepage's does.
 */
export function cardTitle(title: string): string {
  return title.includes(SITE_NAME) ? title : `${title} — ${SITE_NAME}`;
}

export function socialMeta({
  title,
  description,
  path,
  type = "website",
  locale = "en_US",
  images,
  publishedTime,
  modifiedTime,
  tags,
  authors,
}: SocialMetaInput): SocialMeta {
  const shared = {
    url: path,
    siteName: SITE_NAME,
    title: cardTitle(title),
    description,
    locale,
    ...(images ? { images } : {}),
  };

  const openGraph: OpenGraph =
    type === "article"
      ? {
          ...shared,
          type: "article",
          ...(publishedTime ? { publishedTime } : {}),
          ...(modifiedTime ? { modifiedTime } : {}),
          ...(tags ? { tags } : {}),
          ...(authors ? { authors } : {}),
        }
      : { ...shared, type: "website" };

  return {
    openGraph,
    // `summary_large_image` everywhere: every route has a 1200×630 card, either
    // its own `opengraph-image` route or the site-wide one.
    twitter: {
      card: "summary_large_image",
      title: cardTitle(title),
      description,
      ...(images ? { images } : {}),
    },
    alternates: { canonical: path },
  };
}
