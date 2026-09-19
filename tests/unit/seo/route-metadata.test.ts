import { describe, expect, it, vi } from "vitest";
import { type Metadata } from "next";

// The root layout is imported for its metadata, not for its markup, and
// `next/font/google` only exists inside Next's compiler.
vi.mock("next/font/google", () => ({
  JetBrains_Mono: () => ({ variable: "mono", className: "mono" }),
}));

import { generateMetadata as commandMetadata } from "~/app/(terminal)/[command]/page";
import { generateMetadata as caseMetadata } from "~/app/(editorial)/portfolio/[slug]/page";
import { generateMetadata as postMetadata } from "~/app/(editorial)/blog/[slug]/page";
import { metadata as blogListMetadata } from "~/app/(editorial)/blog/page";
import { metadata as portfolioListMetadata } from "~/app/(editorial)/portfolio/page";
import { metadata as rootMetadata } from "~/app/layout";
import { visibleCases } from "~/content/cases";
import { publishedPosts } from "~/content/posts";

/**
 * Every route family's metadata, end to end (SEO1 + SEO2).
 *
 * The card TEXT is asserted here; the card IMAGE is asserted by the presence
 * of an `opengraph-image` module in the same route segment, because Next
 * attaches the file-convention image when it renders the page, not when
 * `generateMetadata` returns. tests/unit/seo/og-image.test.ts renders those
 * modules and checks the bytes.
 */

const ROOT_TITLE = (rootMetadata.twitter as { title: string }).title;

/** The card text of one page, however its metadata was produced. */
function card(meta: Metadata) {
  const twitter = meta.twitter as { title?: string; description?: string };
  const openGraph = meta.openGraph as { title?: string; description?: string };
  return { twitter, openGraph };
}

function canonicalOf(meta: Metadata): unknown {
  return meta.alternates?.canonical;
}

describe("every route family carries its own card", () => {
  const firstCase = visibleCases()[0]!;
  const firstPost = publishedPosts()[0]!;

  it("has content to test against", () => {
    expect(visibleCases().length).toBeGreaterThan(0);
    expect(publishedPosts().length).toBeGreaterThan(0);
  });

  const families: [string, () => Promise<Metadata> | Metadata, string][] = [
    [
      "command page",
      () =>
        commandMetadata({ params: Promise.resolve({ command: "services" }) }),
      "/services",
    ],
    ["blog list", () => blogListMetadata, "/blog"],
    ["portfolio list", () => portfolioListMetadata, "/portfolio"],
    [
      "case",
      () => caseMetadata({ params: Promise.resolve({ slug: firstCase.slug }) }),
      `/portfolio/${firstCase.slug}`,
    ],
    [
      "post",
      () => postMetadata({ params: Promise.resolve({ slug: firstPost.slug }) }),
      `/blog/${firstPost.slug}`,
    ],
  ];

  for (const [name, load, path] of families) {
    it(`${name}: twitter title and description are its own`, async () => {
      const { twitter, openGraph } = card(await load());

      expect(twitter.title, `${name} twitter:title`).toBeTruthy();
      expect(twitter.description, `${name} twitter:description`).toBeTruthy();
      // The bug SEO1 fixed: these used to fall back to the root layout's.
      expect(twitter.title).not.toBe(ROOT_TITLE);
      // One source for both cards.
      expect(twitter.title).toBe(openGraph.title);
      expect(twitter.description).toBe(openGraph.description);
      expect(twitter.title).toContain("HeadingFWD");
    });

    it(`${name}: canonical is its own path`, async () => {
      expect(canonicalOf(await load())).toBe(path);
    });
  }
});

describe("every route family has an opengraph-image", () => {
  const modules: [string, () => Promise<unknown>][] = [
    ["root", () => import("~/app/opengraph-image")],
    [
      "command page",
      () => import("~/app/(terminal)/[command]/opengraph-image"),
    ],
    ["blog list", () => import("~/app/(editorial)/blog/opengraph-image")],
    ["post", () => import("~/app/(editorial)/blog/[slug]/opengraph-image")],
    [
      "portfolio list",
      () => import("~/app/(editorial)/portfolio/opengraph-image"),
    ],
    [
      "case",
      () => import("~/app/(editorial)/portfolio/[slug]/opengraph-image"),
    ],
  ];

  for (const [name, load] of modules) {
    it(`${name}: declares a 1200x630 png route`, async () => {
      const mod = (await load()) as {
        size: { width: number; height: number };
        contentType: string;
        alt: string;
        default: unknown;
      };
      expect(mod.size).toEqual({ width: 1200, height: 630 });
      expect(mod.contentType).toBe("image/png");
      expect(mod.alt).toBeTruthy();
      expect(typeof mod.default).toBe("function");
    });
  }
});
