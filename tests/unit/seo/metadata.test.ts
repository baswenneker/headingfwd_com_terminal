import { describe, expect, it } from "vitest";
import { cardTitle, socialMeta } from "~/config/metadata";
import { SITE_NAME } from "~/config/site";

/**
 * `socialMeta`, the one place the Open Graph block, the Twitter card and the
 * canonical are built. SEO1: a page that set `openGraph` and left `twitter`
 * alone served the ROOT layout's card text, because Next replaces those
 * objects per page instead of merging them.
 */

describe("cardTitle", () => {
  it("appends the brand", () => {
    expect(cardTitle("Portfolio")).toBe(`Portfolio — ${SITE_NAME}`);
  });

  it("leaves a title that already names the brand alone", () => {
    const homepage = `${SITE_NAME} — AI Engineering & Consultancy`;
    expect(cardTitle(homepage)).toBe(homepage);
  });
});

describe("socialMeta", () => {
  const meta = socialMeta({
    title: "Portfolio",
    description: "Selected work.",
    path: "/portfolio",
  });

  it("gives the Twitter card the same text as Open Graph", () => {
    expect(meta.twitter.title).toBe(meta.openGraph.title);
    expect(meta.twitter.description).toBe(meta.openGraph.description);
  });

  it("states the card type and the site name", () => {
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
    expect(meta.openGraph).toMatchObject({
      type: "website",
      siteName: SITE_NAME,
      url: "/portfolio",
      locale: "en_US",
    });
  });

  it("makes the path the canonical", () => {
    expect(meta.alternates.canonical).toBe("/portfolio");
  });

  it("passes no images, so the opengraph-image route wins", () => {
    // An explicit `images` entry beats Next's file convention, which would
    // silently disable every generated card.
    expect(meta.openGraph).not.toHaveProperty("images");
    expect(meta.twitter).not.toHaveProperty("images");
  });

  it("carries the article fields only for an article", () => {
    const article = socialMeta({
      title: "A post",
      description: "…",
      path: "/blog/a-post",
      type: "article",
      locale: "nl_NL",
      publishedTime: "2026-01-01",
      modifiedTime: "2026-02-02",
      tags: ["AI"],
      authors: ["Bas Wenneker"],
    });

    expect(article.openGraph).toMatchObject({
      type: "article",
      locale: "nl_NL",
      publishedTime: "2026-01-01",
      modifiedTime: "2026-02-02",
      tags: ["AI"],
      authors: ["Bas Wenneker"],
    });
    expect(meta.openGraph).not.toHaveProperty("publishedTime");
  });

  it("honours an explicit image on both cards", () => {
    const withImage = socialMeta({
      title: "A post",
      description: "…",
      path: "/blog/a-post",
      images: [{ url: "/blog/a-post/cover.png" }],
    });
    expect(withImage.openGraph.images).toEqual([
      { url: "/blog/a-post/cover.png" },
    ]);
    expect(withImage.twitter.images).toEqual([
      { url: "/blog/a-post/cover.png" },
    ]);
  });
});
