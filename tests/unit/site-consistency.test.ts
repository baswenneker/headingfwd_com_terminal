import { describe, expect, it } from "vitest";
import sitemap from "~/app/sitemap";
import { GET as llmsTxtGET } from "~/app/llms.txt/route";
import { GET as rssGET } from "~/app/(editorial)/blog/rss.xml/route";
import { COMMAND_PAGES } from "~/app/_components/terminal-commands";
import { visibleCases } from "~/content/cases";
import { postPath, publishedPosts } from "~/content/posts";
import { SITE_URL } from "~/config/site";

/**
 * Cross-surface consistency: the sitemap, `/llms.txt` and the RSS feed all
 * claim to derive from the same single sources of truth
 * (`visibleCases()` / `publishedPosts()` / `COMMAND_PAGES`). This asserts
 * that claim directly instead of trusting the doc comments.
 */

function expectedStaticUrls(): string[] {
  return [
    `${SITE_URL}/`,
    `${SITE_URL}/portfolio`,
    `${SITE_URL}/blog`,
    `${SITE_URL}/llms.txt`,
  ];
}

function expectedCaseUrls(): string[] {
  return visibleCases().map((c) => `${SITE_URL}/portfolio/${c.slug}`);
}

function expectedPostUrls(): string[] {
  return publishedPosts().map((p) => `${SITE_URL}${postPath(p)}`);
}

function expectedCommandUrls(): string[] {
  return COMMAND_PAGES.map((c) => `${SITE_URL}/${c.token}`);
}

describe("sitemap.xml", () => {
  it("lists exactly the static pages, visible cases, published posts and command pages", () => {
    const urls = sitemap().map((entry) => entry.url);
    const expected = [
      ...expectedStaticUrls(),
      ...expectedCaseUrls(),
      ...expectedPostUrls(),
      ...expectedCommandUrls(),
    ];

    expect(new Set(urls)).toEqual(new Set(expected));
    expect(urls).toHaveLength(expected.length);
  });
});

describe("/llms.txt", () => {
  it("links every visible case and every published post, and nothing else", async () => {
    const res = llmsTxtGET();
    const text = await res.text();

    for (const url of expectedCaseUrls()) {
      expect(text, `missing case link for ${url}`).toContain(`(${url})`);
    }
    for (const url of expectedPostUrls()) {
      expect(text, `missing post link for ${url}`).toContain(`(${url})`);
    }

    // Count the markdown links that point at a case or a post page and
    // confirm there are no extras (e.g. a hidden case leaking through).
    const caseOrPostLinks = [
      ...text.matchAll(
        /\]\((https:\/\/headingfwd\.com\/(?:portfolio|blog)\/[^)]+)\)/g,
      ),
    ].map((m) => m[1]);
    expect(new Set(caseOrPostLinks)).toEqual(
      new Set([...expectedCaseUrls(), ...expectedPostUrls()]),
    );
  });
});

describe("/blog/rss.xml", () => {
  it("has exactly one item per published post, each linking to its page", async () => {
    const res = rssGET();
    const xml = await res.text();

    const itemCount = (xml.match(/<item /g) ?? []).length;
    expect(itemCount).toBe(publishedPosts().length);

    for (const url of expectedPostUrls()) {
      expect(xml, `missing feed item link for ${url}`).toContain(
        `<link>${url}</link>`,
      );
    }
  });
});
