import { describe, expect, it } from "vitest";
import sitemap from "~/app/sitemap";
import { COMMAND_PAGES } from "~/app/_components/terminal-commands";
import { SITE_URL } from "~/config/site";
import { visibleCases } from "~/content/cases";
import { lastModified, postPath, publishedPosts } from "~/content/posts";
import { SITE_CONTENT_UPDATED } from "~/content/site-content";

/**
 * `/sitemap.xml`, the `lastModified` rules (SEO4 and SEO5). Ten of eighteen
 * URLs used to have no date at all, and a case with no `updated` had none
 * either.
 */

const entries = sitemap();
const byUrl = new Map(entries.map((e) => [e.url, e]));

function lastmod(path: string): string | undefined {
  const entry = byUrl.get(`${SITE_URL}${path}`);
  expect(entry, `no sitemap entry for ${path}`).toBeDefined();
  const value = entry!.lastModified;
  return value === undefined ? undefined : String(value);
}

describe("sitemap lastmod", () => {
  it("is set on every url", () => {
    const missing = entries.filter((e) => e.lastModified === undefined);
    expect(missing.map((e) => e.url)).toEqual([]);
  });

  it("is never a build timestamp", () => {
    // A build stamp would carry a time of day; every date here is a plain
    // YYYY-MM-DD from content.
    for (const entry of entries) {
      expect(String(entry.lastModified)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("gives a case its revision date, else its publication date", () => {
    for (const c of visibleCases()) {
      expect(lastmod(`/portfolio/${c.slug}`)).toBe(c.updated ?? c.date);
    }
  });

  it("gives a post the same date its Article reports", () => {
    for (const post of publishedPosts()) {
      expect(lastmod(postPath(post))).toBe(lastModified(post));
    }
  });

  it("gives each list the newest date among its own children", () => {
    const newestCase = visibleCases()
      .map((c) => c.updated ?? c.date)
      .reduce((a, b) => (a > b ? a : b));
    const newestPost = publishedPosts()
      .map(lastModified)
      .reduce((a, b) => (a > b ? a : b));

    expect(lastmod("/portfolio")).toBe(newestCase);
    expect(lastmod("/blog")).toBe(newestPost);
  });

  it("gives the copy-driven pages the hand-maintained site date", () => {
    expect(lastmod("/")).toBe(SITE_CONTENT_UPDATED);
    expect(lastmod("/llms.txt")).toBe(SITE_CONTENT_UPDATED);
    for (const page of COMMAND_PAGES) {
      expect(lastmod(`/${page.token}`)).toBe(SITE_CONTENT_UPDATED);
    }
  });
});

describe("sitemap contents", () => {
  it("lists the statics, every visible case, every published post and every command page", () => {
    expect(entries.length).toBe(
      3 +
        visibleCases().length +
        publishedPosts().length +
        COMMAND_PAGES.length +
        1,
    );
  });
});
