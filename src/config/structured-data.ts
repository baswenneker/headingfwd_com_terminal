import { ORGANIZATION_ID, PERSON_ID, SITE_NAME, SITE_URL } from "~/config/site";

/**
 * The JSON-LD builders shared by every page that emits structured data.
 *
 * The root layout owns the site-wide graph — `WebSite`, `Organization`,
 * `Person` — and every graph built here wires itself into it by referencing
 * the same `@id`s instead of repeating the nodes. A page therefore emits only
 * what is its own: the article (or the collection) and its breadcrumb trail.
 *
 * A post and a case had a hand-written copy of the same `Article` +
 * `BreadcrumbList` shape, which is what issue #6 flagged; the two overviews
 * had no graph at all. One builder each, so the shape is stated once.
 *
 * Nothing here knows about Markdown, frontmatter or cases: callers pass plain
 * strings, which keeps the builders testable without the content layer.
 */

/** A schema.org node as it is serialised into the page. */
type Node = Record<string, unknown>;

/** One step of a breadcrumb trail: what it is called and where it lives. */
export interface Crumb {
  name: string;
  /** Root-relative path ("/blog"), turned into an absolute URL here. */
  path: string;
}

/** `{ "@context": …, "@graph": [...] }`, the wrapper every page emits. */
function graph(nodes: Node[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}

/**
 * A `BreadcrumbList` for one page, always starting at the site root, so a
 * search result can show "HeadingFWD › Blog › Post".
 *
 * `id` is the page's own URL; the list hangs off it as `#breadcrumb`.
 */
export function breadcrumbs(url: string, trail: Crumb[]): Node {
  return {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: [{ name: SITE_NAME, path: "/" }, ...trail].map(
      (crumb, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: crumb.name,
        item: `${SITE_URL}${crumb.path}`,
      }),
    ),
  };
}

export interface ArticleGraphInput {
  /** Absolute URL of the page. */
  url: string;
  headline: string;
  description: string;
  /** BCP 47 language of the article itself ("nl", "en"). */
  inLanguage: string;
  /** ISO date of first publication. */
  datePublished: string;
  /** ISO date of the last revision; equal to `datePublished` when never revised. */
  dateModified: string;
  keywords?: string[];
  /** Absolute image URL, when the article has one of its own. */
  image?: string;
  /** Section the article belongs to — a case's sector, say. */
  articleSection?: string;
  /** The trail BELOW the site root; the root is added here. */
  trail: Crumb[];
}

/**
 * One article — a post or a case — plus its breadcrumb.
 *
 * `author` and `publisher` resolve to the `#person` / `#organization` nodes in
 * the root layout's graph rather than repeating them, which is what lets a
 * crawler tie an article to the person who wrote it.
 */
export function articleGraph({
  url,
  headline,
  description,
  inLanguage,
  datePublished,
  dateModified,
  keywords,
  image,
  articleSection,
  trail,
}: ArticleGraphInput) {
  return graph([
    {
      "@type": "Article",
      "@id": `${url}#article`,
      url,
      mainEntityOfPage: url,
      headline,
      description,
      inLanguage,
      datePublished,
      dateModified,
      author: { "@id": PERSON_ID },
      publisher: { "@id": ORGANIZATION_ID },
      ...(articleSection ? { articleSection } : {}),
      ...(keywords && keywords.length > 0 ? { keywords } : {}),
      ...(image ? { image } : {}),
    },
    breadcrumbs(url, trail),
  ]);
}

/** One entry of a collection: a post on /blog, a case on /portfolio. */
export interface CollectionItem {
  /** Root-relative path of the item's own page. */
  path: string;
  name: string;
  description?: string;
}

export interface CollectionGraphInput {
  /** Absolute URL of the overview page. */
  url: string;
  /** "Blog" for the blog overview, "CollectionPage" for anything else. */
  type: "Blog" | "CollectionPage";
  name: string;
  description: string;
  inLanguage?: string;
  items: CollectionItem[];
  /** The trail BELOW the site root; the root is added here. */
  trail: Crumb[];
}

/**
 * An overview page: the collection itself, the ordered list of what is on it,
 * and the breadcrumb. `/blog` and `/portfolio` emitted only the root graph, so
 * a crawler saw two pages of links with nothing saying what they listed.
 *
 * The `ItemList` is `@type: ItemList` with one `ListItem` per entry in display
 * order — the same order and the same set the page renders, because both are
 * built from the same list.
 */
export function collectionGraph({
  url,
  type,
  name,
  description,
  inLanguage = "en",
  items,
  trail,
}: CollectionGraphInput) {
  return graph([
    {
      "@type": type,
      "@id": `${url}#collection`,
      url,
      name,
      description,
      inLanguage,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      publisher: { "@id": ORGANIZATION_ID },
      author: { "@id": PERSON_ID },
      mainEntity: { "@id": `${url}#list` },
    },
    {
      "@type": "ItemList",
      "@id": `${url}#list`,
      numberOfItems: items.length,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        url: `${SITE_URL}${item.path}`,
        ...(item.description ? { description: item.description } : {}),
      })),
    },
    breadcrumbs(url, trail),
  ]);
}
