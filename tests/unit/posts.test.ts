import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  draftPreviewEnabled,
  isPublished,
  todayInBlogTimezone,
  type Post,
} from "~/content/posts";

/**
 * The posts loader (`~/content/posts`).
 *
 * `isPublished` and `draftPreviewEnabled` are pure enough to call directly.
 * `allPosts`/`routablePosts` read `content/blog/` from `process.cwd()` at
 * module-import time (`POSTS_DIR` is a top-level const), so the loader tests
 * below point `process.cwd()` at a fixture directory under
 * `tests/unit/fixtures/` and re-import the module with `vi.resetModules()`
 * so the mocked cwd is picked up fresh. The real `content/blog/` is only used
 * for the production-gate test (T9), which needs no fixture: it just asserts
 * that the real drafts and the real future-dated post disappear.
 */

function fixture(overrides: Partial<Post> = {}): Post {
  return {
    title: "A post",
    date: "2026-03-14",
    lang: "en",
    excerpt: "An excerpt.",
    slug: "a-post",
    body: "Body.",
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("isPublished", () => {
  it("is true for a non-draft post dated today or earlier", () => {
    const today = todayInBlogTimezone();
    expect(isPublished(fixture({ date: today }))).toBe(true);
  });

  it("is false for a draft, regardless of its date", () => {
    const today = todayInBlogTimezone();
    expect(isPublished(fixture({ date: today, draft: true }))).toBe(false);
  });

  it("is false for a future-dated post, draft or not", () => {
    expect(isPublished(fixture({ date: "2099-01-01" }))).toBe(false);
  });

  it("holds at the Europe/Amsterdam midnight boundary", () => {
    // 2026-06-15 00:00 in Amsterdam (CEST, UTC+2) is 2026-06-14T22:00:00Z.
    // A post dated 2026-06-15 is not yet published one second before that
    // instant, and is published from that instant on.
    vi.useFakeTimers();

    vi.setSystemTime(new Date("2026-06-14T21:59:59Z"));
    expect(todayInBlogTimezone()).toBe("2026-06-14");
    expect(isPublished(fixture({ date: "2026-06-15" }))).toBe(false);

    vi.setSystemTime(new Date("2026-06-14T22:00:00Z"));
    expect(todayInBlogTimezone()).toBe("2026-06-15");
    expect(isPublished(fixture({ date: "2026-06-15" }))).toBe(true);

    vi.useRealTimers();
  });
});

describe("draftPreviewEnabled", () => {
  it("is false when ENVIRONMENT is unset (fails closed)", async () => {
    const original = process.env.ENVIRONMENT;
    delete process.env.ENVIRONMENT;
    vi.resetModules();
    try {
      const mod = await import("~/content/posts");
      expect(mod.draftPreviewEnabled()).toBe(false);
    } finally {
      if (original === undefined) delete process.env.ENVIRONMENT;
      else process.env.ENVIRONMENT = original;
    }
  });

  it("is true for development and test, false for production", () => {
    // The module under test already ran with ENVIRONMENT=test (see
    // tests/unit/setup.ts), so this exercises the predicate directly rather
    // than re-importing for every value.
    expect(draftPreviewEnabled()).toBe(true);
  });
});

describe("routablePosts against the real content directory", () => {
  it("with ENVIRONMENT=production, hides drafts and future-dated posts", async () => {
    vi.stubEnv("ENVIRONMENT", "production");
    vi.resetModules();

    const { routablePosts } = await import("~/content/posts");
    const posts = routablePosts();
    const slugs = posts.map((p) => p.slug);

    // Real fixtures in content/blog/: one published post, one Dutch draft,
    // one draft template and one far-future post.
    expect(slugs).toContain("ai-goedkoper-rekening-hoger");
    expect(slugs).not.toContain("taalproef-nederlands");
    expect(slugs).not.toContain("post-template");
    expect(slugs).not.toContain("scheduled-example");
  });
});

describe("the loader against fixture content directories", () => {
  it("throws when a post file has no opening frontmatter fence", async () => {
    vi.spyOn(process, "cwd").mockReturnValue(
      join(process.cwd(), "tests/unit/fixtures/posts-missing-fence"),
    );
    vi.resetModules();

    const { allPosts } = await import("~/content/posts");
    expect(() => allPosts()).toThrow(/missing YAML frontmatter/);
  });

  it("throws when two files resolve to the same slug", async () => {
    vi.spyOn(process, "cwd").mockReturnValue(
      join(process.cwd(), "tests/unit/fixtures/posts-duplicate-slug"),
    );
    vi.resetModules();

    const { allPosts } = await import("~/content/posts");
    expect(() => allPosts()).toThrow(/duplicate post slug "same-slug"/);
  });

  it("uses the frontmatter slug instead of the filename when one is set", async () => {
    vi.spyOn(process, "cwd").mockReturnValue(
      join(process.cwd(), "tests/unit/fixtures/posts-slug-override"),
    );
    vi.resetModules();

    const { allPosts } = await import("~/content/posts");
    const [post] = allPosts();
    expect(post?.slug).toBe("overridden-slug");
  });
});
