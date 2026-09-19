import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `/blog/rss.xml`. The channel used to hardcode `<language>en</language>`
 * while its only item was `xml:lang="nl"`; it now states the language the
 * published posts share, and falls back to "en" when they disagree.
 *
 * The posts loader is mocked so the feed can be tested against sets of posts
 * that do not exist in content/blog — including an empty one.
 */

interface FakePost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  lang: "nl" | "en";
  tags?: string[];
}

function post(slug: string, lang: "nl" | "en"): FakePost {
  return {
    slug,
    title: `Post ${slug}`,
    excerpt: "Excerpt.",
    date: "2026-01-02",
    lang,
  };
}

/** Build the feed with `publishedPosts()` returning exactly these posts. */
async function feedFor(posts: FakePost[]): Promise<string> {
  vi.resetModules();
  const actual =
    await vi.importActual<typeof import("~/content/posts")>("~/content/posts");
  vi.doMock("~/content/posts", () => ({
    ...actual,
    publishedPosts: () => posts,
  }));
  const { GET } = await import("~/app/(editorial)/blog/rss.xml/route");
  return GET().text();
}

beforeEach(() => {
  vi.resetModules();
  vi.doUnmock("~/content/posts");
});

describe("rss channel language", () => {
  it("is nl when every published post is Dutch", async () => {
    const xml = await feedFor([post("een", "nl"), post("twee", "nl")]);
    expect(xml).toContain("<language>nl</language>");
  });

  it("is en when the posts disagree", async () => {
    const xml = await feedFor([post("een", "nl"), post("two", "en")]);
    expect(xml).toContain("<language>en</language>");
  });

  it("is en when nothing is published", async () => {
    const xml = await feedFor([]);
    expect(xml).toContain("<language>en</language>");
  });

  it("keeps stating each item's own language", async () => {
    const xml = await feedFor([post("een", "nl"), post("two", "en")]);
    expect(xml).toContain('<item xml:lang="nl">');
    expect(xml).toContain('<item xml:lang="en">');
  });
});

describe("rss feed of the real blog", () => {
  it("matches the language of the published posts", async () => {
    vi.resetModules();
    const { publishedPosts } = await import("~/content/posts");
    const posts = publishedPosts();
    expect(posts.length).toBeGreaterThan(0);

    const { GET } = await import("~/app/(editorial)/blog/rss.xml/route");
    const xml = await GET().text();

    const languages = new Set(posts.map((p) => p.lang));
    const expected = languages.size === 1 ? [...languages][0] : "en";
    expect(xml).toContain(`<language>${expected}</language>`);
  });
});
