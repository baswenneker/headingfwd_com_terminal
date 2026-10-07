import { test, expect } from "@playwright/test";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { COMMAND_PAGES } from "~/app/_components/terminal-commands";
import { visibleCases } from "~/content/cases";
import { publishedPosts } from "~/content/posts";

/**
 * Behaviour that only a production build shows: status codes as `next start`
 * sends them, the proxy in src/proxy.ts, and what lands in the route cache.
 * Runs with `pnpm test:e2e:prod` (playwright.prod.config.ts); the dev suite
 * skips everything tagged `@prod`.
 *
 * Production means drafts are hidden, so a draft's URL is a 404 here while the
 * dev suite previews it.
 */

const NOT_FOUND = [
  "/clear",
  "/nope",
  "/blog/does-not-exist",
  "/blog/scheduled-example", // future-dated
  "/blog/post-template", // draft
  "/portfolio/nope",
];

const NOT_FOUND_TITLE = "404 — page not found — HeadingFWD";

/** Where `next start` writes rendered pages it caches at request time. */
const ROUTE_CACHE = join(process.cwd(), ".next", "server", "route-cache");

async function routeCacheFiles(): Promise<string[]> {
  try {
    return await readdir(ROUTE_CACHE, { recursive: true });
  } catch {
    return [];
  }
}

test.describe("Production build", { tag: "@prod" }, () => {
  test("unknown, draft and future-dated URLs are a 404", async ({ page }) => {
    for (const path of NOT_FOUND) {
      const res = await page.request.get(path);
      expect(res.status(), `${path} should be a 404`).toBe(404);
    }
  });

  test("every command, a post and a case are a 200", async ({ page }) => {
    const post = publishedPosts()[0];
    const kase = visibleCases()[0];
    expect(post, "needs at least one published post").toBeDefined();
    const paths = [
      "/",
      "/blog",
      "/blog/rss.xml",
      "/portfolio",
      ...COMMAND_PAGES.map((c) => `/${c.token}`),
      `/blog/${post!.slug}`,
      `/portfolio/${kase!.slug}`,
    ];
    for (const path of paths) {
      const res = await page.request.get(path);
      expect(res.status(), `${path} should be a 200`).toBe(200);
    }
  });

  for (const path of ["/nope", "/blog/does-not-exist", "/portfolio/nope"]) {
    test(`${path} has the 404 title and no canonical`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveTitle(NOT_FOUND_TITLE);
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    });
  }

  test("unknown post and case slugs add nothing to the route cache", async ({
    page,
  }) => {
    const before = await routeCacheFiles();
    for (let i = 0; i < 10; i++) {
      const blog = await page.request.get(`/blog/e2e-unknown-${i}`);
      const kase = await page.request.get(`/portfolio/e2e-unknown-${i}`);
      expect(blog.status()).toBe(404);
      expect(kase.status()).toBe(404);
    }
    // The cache is written after the response is sent.
    await page.waitForTimeout(500);
    const after = await routeCacheFiles();
    expect(after.filter((f) => !before.includes(f))).toEqual([]);
  });
});
