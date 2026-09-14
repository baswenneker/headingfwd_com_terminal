import { test, expect } from "@playwright/test";
import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { postPath, publishedPosts } from "~/content/posts";

/**
 * Tests for the blog at `/blog`, `/blog/<slug>` and `/blog/rss.xml`.
 *
 * The boundary under test is the HTTP response of those three routes — what a
 * visitor's browser and a crawler actually receive. Nothing here asserts on
 * the shape of the parser's intermediate output, on CSS class names, or on
 * how many transform steps ran: the suite should survive a rewrite of the
 * rendering pipeline as long as the pages still read the same.
 *
 * Frontmatter and chart validation need no test of their own. An invalid file
 * throws at load time and fails the build, which is a stronger signal than an
 * assertion.
 *
 * Fixtures are real files in `content/blog/`, pinned here as constants —
 * following the deep-link suite, which pins the cases it depends on the same
 * way rather than scattering slugs through the assertions.
 */

/** The template post: a draft exercising every element of the vocabulary. */
const TEMPLATE = {
  slug: "post-template",
  title: "Everything a post can do",
  date: "15 January 2026",
  kicker: "Template · not published",
};

/** A short Dutch draft, for the per-post language and date format. */
const DUTCH = {
  slug: "taalproef-nederlands",
  title: "Een Nederlandse proefpost",
  date: "10 januari 2026",
};

/** Dated 2099: not a draft, simply not published yet. */
const SCHEDULED = { slug: "scheduled-example", title: "Scheduled for later" };

test.describe("Blog overview (/blog)", () => {
  test("lists the posts, newest first, with title, date and excerpt", async ({
    page,
  }) => {
    await page.goto("/blog");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Blog");

    const titles = await page
      .getByRole("heading", { level: 2 })
      .allTextContents();
    const template = titles.findIndex((t) => t.includes(TEMPLATE.title));
    const dutch = titles.findIndex((t) => t.includes(DUTCH.title));
    expect(template, "the template post is missing").toBeGreaterThanOrEqual(0);
    expect(dutch, "the Dutch draft is missing").toBeGreaterThanOrEqual(0);
    // 2026-01-15 is newer than 2026-01-10, so it must come first.
    expect(template).toBeLessThan(dutch);

    // Each entry carries its own date and excerpt.
    await expect(page.getByText(TEMPLATE.date)).toBeVisible();
    await expect(
      page.getByText("The reference post. Every element the blog supports", {
        exact: false,
      }),
    ).toBeVisible();
  });

  test("a draft carries a draft badge in the test environment", async ({
    page,
  }) => {
    await page.goto("/blog");

    const entry = page
      .locator("li")
      .filter({ hasText: TEMPLATE.title })
      .first();
    await expect(entry.getByText("draft", { exact: true })).toBeVisible();
  });

  test("a future-dated post is absent from the overview", async ({ page }) => {
    const res = await page.request.get("/blog");
    const html = await res.text();
    expect(html).not.toContain(SCHEDULED.slug);
    expect(html).not.toContain(SCHEDULED.title);
  });

  test("the overview links to every post it lists", async ({ page }) => {
    await page.goto("/blog");
    await expect(
      page.getByRole("link", { name: new RegExp(TEMPLATE.title) }),
    ).toHaveAttribute("href", `/blog/${TEMPLATE.slug}`);
  });
});

test.describe("Post page (/blog/<slug>)", () => {
  test("renders the title, the formatted date, the kicker and the page title", async ({
    page,
  }) => {
    await page.goto(`/blog/${TEMPLATE.slug}`);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      TEMPLATE.title,
    );
    await expect(page.getByText(TEMPLATE.kicker)).toBeVisible();
    await expect(page.locator("article time")).toHaveText(TEMPLATE.date);
    await expect(page).toHaveTitle(`${TEMPLATE.title} — HeadingFWD`);
  });

  test("the full article body is in the HTML the server sends", async ({
    page,
  }) => {
    // Raw fetch — no client JS runs, so this proves a crawler that never
    // executes a script still receives the whole article.
    const res = await page.request.get(`/blog/${TEMPLATE.slug}`);
    const html = await res.text();

    expect(html).toContain("This is the lead paragraph");
    // A phrase from the last item of the last section.
    expect(html).toContain("Tables, lists and code");
    // The footnote definitions, at the very end.
    expect(html).toContain("The second source");
  });

  test("every element of the vocabulary renders", async ({ page }) => {
    await page.goto(`/blog/${TEMPLATE.slug}`);
    const article = page.locator("article");

    // Stat row.
    await expect(
      article.locator("[data-post-stats] [data-post-stat]"),
    ).toHaveCount(3);
    await expect(article.getByText("faster to publish")).toBeVisible();

    // Section heading, numbered with a roman numeral.
    const firstSection = article.locator("[data-post-section]").first();
    await expect(firstSection.locator("[data-post-roman]")).toHaveText("I");
    await expect(firstSection.getByRole("heading", { level: 2 })).toContainText(
      "How a post is built",
    );

    // Two-column items: a label side and a body side.
    const firstItem = article.locator("[data-post-item]").first();
    await expect(firstItem.locator("[data-post-item-side]")).toBeVisible();
    await expect(firstItem.locator("[data-post-item-body]")).toBeVisible();
    await expect(firstItem.locator("[data-post-item-label]")).toHaveText(
      "Frontmatter carries the metadata",
    );

    // The aside sits in the left column, not in the body.
    await expect(
      firstItem.locator("[data-post-item-side] [data-post-aside]"),
    ).toContainText("The left column.");

    // Charts: inline SVG, drawn on the server.
    const charts = article.locator("[data-post-chart] svg");
    await expect(charts).toHaveCount(2);
    await expect(charts.first()).toHaveAttribute("viewBox", /^0 0 \d+ \d+$/);

    // Pull quote with its attribution.
    const quote = article.locator("[data-post-quote]");
    await expect(quote).toContainText("Publish on your own domain first");
    await expect(quote.locator("[data-post-quote-source]")).toHaveText(
      "On attribution",
    );

    // A figure and its caption.
    const figure = article
      .locator("figure[data-post-figure]")
      .filter({ hasText: "The caption sits under its figure." })
      .first();
    await expect(figure.locator("img")).toBeVisible();
    await expect(figure.locator("figcaption")).toContainText(
      "The caption sits under its figure.",
    );

    // An inline SVG diagram, so it can inherit the page colours.
    await expect(
      article.locator("[data-post-inline-svg] svg").first(),
    ).toBeAttached();

    // Footnote markers in the text, sources listed at the end.
    await expect(
      article.locator("sup a[href^='#user-content-fn-']"),
    ).toHaveCount(2);
    const sources = article.locator("[data-post-sources]");
    await expect(sources).toContainText("The first source");
    await expect(sources).toContainText("The second source");
  });

  test("item numbers continue across section boundaries", async ({ page }) => {
    await page.goto(`/blog/${TEMPLATE.slug}`);

    const numbers = await page
      .locator("[data-post-item-number]")
      .allTextContents();
    expect(numbers).toEqual(["01", "02", "03", "04"]);

    // 03 is the first item of the SECOND section — that is the point.
    const secondSection = page.locator("[data-post-section]").nth(1);
    await expect(
      secondSection.locator("[data-post-item-number]").first(),
    ).toHaveText("03");
  });

  test("a draft page carries a draft banner and noindex", async ({ page }) => {
    await page.goto(`/blog/${TEMPLATE.slug}`);

    await expect(page.locator("[data-post-draft-banner]")).toContainText(
      "Draft",
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });

  test("a Dutch post states Dutch and formats its date in Dutch", async ({
    page,
  }) => {
    await page.goto(`/blog/${DUTCH.slug}`);

    await expect(page.locator("article")).toHaveAttribute("lang", "nl");
    // The meta bar's own <time>: the body of this post quotes the same date.
    await expect(page.locator("article time")).toHaveText(DUTCH.date);
  });

  test("an English post states English", async ({ page }) => {
    await page.goto(`/blog/${TEMPLATE.slug}`);
    await expect(page.locator("article")).toHaveAttribute("lang", "en");
  });

  test("a post page emits Article and BreadcrumbList JSON-LD", async ({
    page,
  }) => {
    await page.goto(`/blog/${TEMPLATE.slug}`);

    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const nodes = blocks
      .map((b) => JSON.parse(b) as { "@graph": unknown[] })
      .flatMap((g) => g["@graph"]) as {
      "@type": string;
      url?: string;
      headline?: string;
      datePublished?: string;
      itemListElement?: unknown[];
    }[];

    const article = nodes.find((n) => n["@type"] === "Article");
    expect(article, "no Article node in the JSON-LD").toBeDefined();
    expect(article!.url).toBe(`https://headingfwd.com/blog/${TEMPLATE.slug}`);
    expect(article!.headline).toBe(TEMPLATE.title);
    expect(article!.datePublished).toBe("2026-01-15");

    const breadcrumb = nodes.find((n) => n["@type"] === "BreadcrumbList");
    expect(breadcrumb, "no BreadcrumbList node in the JSON-LD").toBeDefined();
    expect(breadcrumb!.itemListElement).toHaveLength(3);
  });

  test("a post page carries a self-referencing canonical", async ({ page }) => {
    await page.goto(`/blog/${TEMPLATE.slug}`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `https://headingfwd.com/blog/${TEMPLATE.slug}`,
    );
  });

  test("a post links back to the terminal", async ({ page }) => {
    await page.goto(`/blog/${TEMPLATE.slug}`);
    await expect(
      page.getByRole("link", { name: "back to the terminal" }),
    ).toHaveAttribute("href", "/");
  });

  /**
   * A chart's labels live inside its viewBox, so they shrink with the drawing
   * and no CSS unit escapes that. Stretched across a wide column the axis text
   * blows up; squeezed into a phone column it vanishes — it measured 5.5px
   * before the chart was given an intrinsic size it is never stretched past.
   * This pins the readable floor at the narrowest the body column gets.
   */
  test("chart labels stay readable from phone to desktop", async ({ page }) => {
    const measure = () =>
      page.evaluate(() => {
        const svg = document.querySelector("[data-post-chart] svg")!;
        const declared = Number(
          svg.querySelector("text")!.getAttribute("font-size"),
        );
        const viewBoxWidth = Number(svg.getAttribute("viewBox")!.split(" ")[2]);
        const rendered = svg.getBoundingClientRect().width;
        return (declared * rendered) / viewBoxWidth;
      });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/blog/${TEMPLATE.slug}`);
    expect(await measure()).toBeGreaterThanOrEqual(9.5);

    await page.setViewportSize({ width: 1440, height: 900 });
    const wide = await measure();
    expect(wide).toBeGreaterThanOrEqual(9.5);
    // And never inflated into a heading by a wide column.
    expect(wide).toBeLessThanOrEqual(16);
  });

  test("a future-dated post is a 404 on its own URL", async ({ page }) => {
    const res = await page.goto(`/blog/${SCHEDULED.slug}`);
    expect(res?.status()).toBe(404);
  });

  test("an unknown slug is a hard 404", async ({ page }) => {
    const res = await page.goto("/blog/does-not-exist");
    expect(res?.status()).toBe(404);
  });

  /**
   * Writing a post should not mean restarting the server. `allPosts()` skips
   * its cache outside production so the overview picks a new file up, but
   * `generateStaticParams` runs once — with the route refusing every slug
   * outside that set, a post appeared in the list and then 404'd when the
   * author clicked it.
   *
   * This is the only test that writes into the content directory, so it
   * cleans up in a `finally` even when an assertion fails.
   */
  test("a post added while the server runs is reachable at once", async ({
    page,
  }) => {
    const slug = "e2e-hot-pickup-check";
    const file = join(process.cwd(), "content", "blog", `${slug}.md`);

    await writeFile(
      file,
      [
        "---",
        'title: "Hot pickup check"',
        "date: 2026-02-01",
        "lang: en",
        'excerpt: "Written while the server was already running."',
        "draft: true",
        "---",
        "",
        "The lead paragraph of a post that was not there when the server started.",
        "",
        "## A section",
        "",
        "Body text.",
        "",
      ].join("\n"),
      "utf8",
    );

    try {
      const res = await page.goto(`/blog/${slug}`);
      expect(res?.status()).toBe(200);
      await expect(page.locator("article")).toContainText("Hot pickup check");
    } finally {
      await rm(file, { force: true });
    }
  });
});

test.describe("Feed, sitemap and llms.txt", () => {
  test("the feed responds with XML listing the published posts", async ({
    page,
  }) => {
    const res = await page.request.get("/blog/rss.xml");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/rss+xml");

    const xml = await res.text();
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("https://headingfwd.com/blog/rss.xml");

    // Checked against the post source itself, so the expectation cannot drift
    // when the first real post lands.
    for (const post of publishedPosts()) {
      expect(xml, `missing feed item for ${post.slug}`).toContain(
        `https://headingfwd.com/blog/${post.slug}`,
      );
    }
  });

  test("unpublished posts are absent from the feed, the sitemap and llms.txt", async ({
    page,
  }) => {
    const surfaces = await Promise.all(
      ["/blog/rss.xml", "/sitemap.xml", "/llms.txt"].map(async (path) => ({
        path,
        text: await (await page.request.get(path)).text(),
      })),
    );

    for (const { path, text } of surfaces) {
      expect(text, `${path} leaks the draft fixture`).not.toContain(
        TEMPLATE.slug,
      );
      expect(text, `${path} leaks the Dutch draft`).not.toContain(DUTCH.slug);
      expect(text, `${path} leaks the future-dated fixture`).not.toContain(
        SCHEDULED.slug,
      );
    }
  });

  test("the sitemap lists /blog and every published post", async ({ page }) => {
    const res = await page.request.get("/sitemap.xml");
    const xml = await res.text();

    expect(xml).toContain("https://headingfwd.com/blog<");
    for (const post of publishedPosts()) {
      expect(xml, `missing sitemap entry for ${post.slug}`).toContain(
        `https://headingfwd.com/blog/${post.slug}`,
      );
    }
  });

  test("llms.txt lists every published post", async ({ page }) => {
    const res = await page.request.get("/llms.txt");
    const text = await res.text();

    for (const post of publishedPosts()) {
      expect(text, `missing llms.txt entry for ${post.slug}`).toContain(
        `https://headingfwd.com/blog/${post.slug}`,
      );
    }
  });

  // The Blog section is unconditional: an agent has to be able to learn that
  // the blog exists and where to come back to, even before the first post.
  test("llms.txt names the blog overview and feed even with nothing published", async ({
    page,
  }) => {
    const res = await page.request.get("/llms.txt");
    const text = await res.text();

    expect(text).toContain("## Blog");
    expect(text).toContain("https://headingfwd.com/blog\n");
    expect(text).toContain("https://headingfwd.com/blog/rss.xml");
  });

  test("the blog overview and every post point at the feed", async ({
    page,
  }) => {
    for (const path of ["/blog", ...publishedPosts().map((p) => postPath(p))]) {
      const html = await (await page.request.get(path)).text();
      expect(html, `${path} has no feed autodiscovery`).toContain(
        'type="application/rss+xml"',
      );
    }
  });
});

test.describe("Terminal integration", () => {
  test("the home page HTML links to /blog", async ({ page }) => {
    const res = await page.request.get("/");
    const html = await res.text();
    expect(html).toContain('href="/blog"');
  });

  // Scoped to the help output: the tip line above the prompt carries a `/blog`
  // token of its own, so a bare text match would resolve to two elements.
  test("/help lists the blog command", async ({ page }) => {
    await page.goto("/help");
    await expect(
      page.getByText("long-form writing on AI engineering"),
    ).toBeVisible();
  });

  // The tip line above the prompt is the first thing a visitor reads, and its
  // command tokens are real buttons so a touch visitor never has to type.
  test("the tip line offers /blog and it navigates", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "/blog", exact: true }).click();
    await expect(page).toHaveURL("/blog");
  });

  // A wrong turn is a crawl path too: the 404 offers the working routes, and
  // the blog is one of them.
  test("the 404 page offers /blog as a working route", async ({ page }) => {
    const res = await page.goto("/this-route-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("link", { name: /\/blog/ })).toBeVisible();
  });
});
