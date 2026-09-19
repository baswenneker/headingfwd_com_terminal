import { describe, expect, it } from "vitest";
import {
  articleGraph,
  breadcrumbs,
  collectionGraph,
} from "~/config/structured-data";
import { ORGANIZATION_ID, PERSON_ID, SITE_URL } from "~/config/site";

/**
 * The shared JSON-LD builders. What matters here is that every graph wires
 * itself into the root layout's `#person` / `#organization` nodes instead of
 * repeating them, and that a breadcrumb always starts at the site root.
 */

type Node = Record<string, unknown>;

function nodes(graph: unknown): Node[] {
  return (graph as { "@graph": Node[] })["@graph"];
}

function nodeOfType(graph: unknown, type: string): Node {
  const found = nodes(graph).find((n) => n["@type"] === type);
  expect(found, `no ${type} node`).toBeDefined();
  return found!;
}

describe("breadcrumbs", () => {
  it("starts at the site root and numbers from 1", () => {
    const crumbs = breadcrumbs(`${SITE_URL}/blog/a-post`, [
      { name: "Blog", path: "/blog" },
      { name: "A post", path: "/blog/a-post" },
    ]);

    expect(crumbs["@id"]).toBe(`${SITE_URL}/blog/a-post#breadcrumb`);
    expect(crumbs.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "HeadingFWD",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${SITE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "A post",
        item: `${SITE_URL}/blog/a-post`,
      },
    ]);
  });
});

describe("articleGraph", () => {
  const url = `${SITE_URL}/portfolio/a-case`;
  const graph = articleGraph({
    url,
    headline: "A case",
    description: "What it did.",
    inLanguage: "en",
    datePublished: "2025-06-19",
    dateModified: "2026-07-10",
    keywords: ["LLM"],
    articleSection: "Media",
    trail: [
      { name: "Portfolio", path: "/portfolio" },
      { name: "A case", path: "/portfolio/a-case" },
    ],
  });

  it("emits an Article and a BreadcrumbList", () => {
    expect(graph["@context"]).toBe("https://schema.org");
    expect(nodes(graph).map((n) => n["@type"])).toEqual([
      "Article",
      "BreadcrumbList",
    ]);
  });

  it("references the site-wide person and organization by id", () => {
    const article = nodeOfType(graph, "Article");
    expect(article.author).toEqual({ "@id": PERSON_ID });
    expect(article.publisher).toEqual({ "@id": ORGANIZATION_ID });
    expect(article["@id"]).toBe(`${url}#article`);
  });

  it("carries both dates, the section and the keywords", () => {
    const article = nodeOfType(graph, "Article");
    expect(article.datePublished).toBe("2025-06-19");
    expect(article.dateModified).toBe("2026-07-10");
    expect(article.articleSection).toBe("Media");
    expect(article.keywords).toEqual(["LLM"]);
  });

  it("leaves out an absent image, section and empty keywords", () => {
    const bare = articleGraph({
      url,
      headline: "A post",
      description: "…",
      inLanguage: "nl",
      datePublished: "2025-01-01",
      dateModified: "2025-01-01",
      keywords: [],
      trail: [{ name: "Blog", path: "/blog" }],
    });
    const article = nodeOfType(bare, "Article");
    expect(article).not.toHaveProperty("image");
    expect(article).not.toHaveProperty("articleSection");
    expect(article).not.toHaveProperty("keywords");
  });
});

describe("collectionGraph", () => {
  const graph = collectionGraph({
    url: `${SITE_URL}/blog`,
    type: "Blog",
    name: "Blog",
    description: "Writing.",
    items: [
      { path: "/blog/one", name: "One", description: "First." },
      { path: "/blog/two", name: "Two" },
    ],
    trail: [{ name: "Blog", path: "/blog" }],
  });

  it("emits the collection, its list and a breadcrumb", () => {
    expect(nodes(graph).map((n) => n["@type"])).toEqual([
      "Blog",
      "ItemList",
      "BreadcrumbList",
    ]);
  });

  it("points the collection at its own list", () => {
    expect(nodeOfType(graph, "Blog").mainEntity).toEqual({
      "@id": `${SITE_URL}/blog#list`,
    });
  });

  it("lists every item in order, with absolute urls", () => {
    const list = nodeOfType(graph, "ItemList");
    expect(list.numberOfItems).toBe(2);
    expect(list.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "One",
        url: `${SITE_URL}/blog/one`,
        description: "First.",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Two",
        url: `${SITE_URL}/blog/two`,
      },
    ]);
  });
});
