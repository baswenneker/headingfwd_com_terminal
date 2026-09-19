import { test, expect } from "@playwright/test";
import { sendCommand, waitForTerminalReady } from "../helpers/session";
import { isComingSoonCase, visibleCases } from "~/content/cases";

/**
 * Tests for the portfolio pages and the shareable command deep links.
 *
 *   /portfolio, /portfolio/<slug> — server-rendered editorial pages, outside
 *                                   the terminal, like the blog
 *   /help, /about, …              — terminal with that command pre-executed
 *                                   (COMMAND_PAGES in terminal-commands.ts)
 *
 * A case page is prose: it ships no terminal at all, and the write-up goes
 * through the same renderer as a blog post, so it carries the post vocabulary
 * (`data-post-lead`, `data-post-section`, `data-post-roman`). Slugs and
 * commands outside the registries are hard 404s (`dynamicParams = false` on
 * both dynamic routes).
 */

// First and second visible case, in CASES order (src/content/cases.ts).
const CASE_1 = { slug: "ai-writing-assistant", title: "AI Writing Assistant" };
const CASE_2 = {
  slug: "hintsay-linkedin",
  title: "Hintsay: AI writing assistant for LinkedIn",
};
// Both former coming-soon shells are published concepts now (#13 F14), so no
// case renders the teaser placeholder. The placeholder and the `coming-soon`
// visibility it hangs off still exist; `tests/unit/cases.test.ts` covers the
// predicate that drives them, on a fixture rather than on live content.

test.describe("Case pages (/portfolio/<slug>)", () => {
  test("direct load renders the case page, not the terminal", async ({
    page,
  }) => {
    await page.goto(`/portfolio/${CASE_1.slug}`);

    await expect(
      page.getByRole("heading", { level: 1, name: CASE_1.title }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "← all work" }).first(),
    ).toHaveAttribute("href", "/portfolio");
    // The terminal is a different half of the site; none of it ships here.
    await expect(page.getByTestId("terminal-input")).toHaveCount(0);
    // Per-case SEO metadata from generateMetadata.
    await expect(page).toHaveTitle(`${CASE_1.title} — HeadingFWD`);
  });

  test("the case write-up is server-rendered into the initial HTML", async ({
    page,
  }) => {
    // Raw HTML fetch — no client JS runs, so this proves the full write-up
    // is served server-side (indexable), not rendered after hydration.
    const res = await page.request.get(`/portfolio/${CASE_1.slug}`);
    const html = await res.text();
    expect(html).toContain(CASE_1.title);
    expect(html).toContain("sentence-by-sentence"); // phrase from the case body
    // Rendered by the post pipeline, so the editorial hooks are present.
    expect(html).toContain("data-post-lead");
    expect(html).toContain("data-post-roman");
  });

  test("the case body carries the post vocabulary", async ({ page }) => {
    await page.goto(`/portfolio/${CASE_1.slug}`);

    // The text before the first `##` is the lead, so the opening sentence of
    // the write-up sits inside it rather than in a section.
    await expect(page.locator("[data-post-lead]")).toContainText(
      "A generative-AI writing assistant",
    );
    // Sections are numbered by the renderer, starting at I.
    await expect(page.locator("[data-post-roman]").first()).toHaveText("I");
  });

  test("prev and next are real links that wrap around", async ({ page }) => {
    // The ring holds only written-up cases: a prev/next button promises
    // something to read, so the coming-soon shells are skipped (#13 D6).
    const ring = visibleCases().filter((c) => !isComingSoonCase(c));
    const last = ring[ring.length - 1]!;

    await page.goto(`/portfolio/${CASE_1.slug}`);

    // CASE_1 is the first case, so "prev" wraps to the last one in the ring.
    await expect(page.getByRole("link", { name: "← prev" })).toHaveAttribute(
      "href",
      `/portfolio/${last.slug}`,
    );
    await expect(page.getByRole("link", { name: "next →" })).toHaveAttribute(
      "href",
      `/portfolio/${CASE_2.slug}`,
    );

    await page.getByRole("link", { name: "next →" }).click();
    await expect(page).toHaveURL(`/portfolio/${CASE_2.slug}`);
    await expect(
      page.getByRole("heading", { level: 1, name: CASE_2.title }),
    ).toBeVisible();
  });

  test("opening a case from the /portfolio list lands on its page", async ({
    page,
  }) => {
    await page.goto("/portfolio");

    // exact: true — "AI Writing Assistant" is also a case-insensitive
    // substring of the Hintsay row's title, so a loose match is ambiguous.
    await page.getByText(CASE_1.title, { exact: true }).click();
    await expect(page).toHaveURL(`/portfolio/${CASE_1.slug}`);
    await expect(
      page.getByRole("heading", { level: 1, name: CASE_1.title }),
    ).toBeVisible();
  });

  test("every case a reader is handed on to has a write-up", async ({
    page,
  }) => {
    // The invariant behind #13 D6: a prev/next button promises something to
    // read, so the ring only ever contains written-up cases. It holds whether
    // or not a coming-soon shell exists right now (#13 F14).
    const readable = visibleCases()
      .filter((c) => !isComingSoonCase(c))
      .map((c) => `/portfolio/${c.slug}`);

    for (const c of visibleCases()) {
      await page.goto(`/portfolio/${c.slug}`);
      for (const name of ["← prev", "next →"]) {
        const href = await page
          .getByRole("link", { name })
          .getAttribute("href");
        expect(readable, `${name} on /portfolio/${c.slug}`).toContain(href);
      }
    }
  });

  test("an unknown slug is a hard 404", async ({ page }) => {
    const res = await page.goto("/portfolio/does-not-exist");
    expect(res?.status()).toBe(404);
  });
});

/**
 * Crawl path and structured data.
 *
 * Search engines must be able to reach every case by following links from the
 * home page — not only through the sitemap. These tests read the raw served
 * HTML (no client JS), so they prove what a crawler actually receives.
 */
test.describe("Internal links & structured data", () => {
  test("the /portfolio HTML links to every visible case", async ({ page }) => {
    const res = await page.request.get("/portfolio");
    const html = await res.text();

    // Checked against the case source itself, so the count cannot drift when
    // a case is added, hidden or renamed.
    const cases = visibleCases();
    expect(cases.length).toBeGreaterThan(0);
    for (const c of cases) {
      expect(html, `missing link to ${c.slug}`).toContain(
        `href="/portfolio/${c.slug}"`,
      );
    }
  });

  test("the home page HTML links to /portfolio", async ({ page }) => {
    const res = await page.request.get("/");
    const html = await res.text();
    expect(html).toContain('href="/portfolio"');
  });

  test("the portfolio link in the status bar leaves for the overview", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForTerminalReady(page);

    // exact: true — the tip line carries a "/portfolio" token as well since
    // #13 D1, and a loose name match would find both.
    await page.getByRole("link", { name: "portfolio", exact: true }).click();
    await expect(page).toHaveURL("/portfolio");
    await expect(
      page.getByRole("heading", { level: 1, name: "Portfolio" }),
    ).toBeVisible();
  });

  test("the /portfolio command navigates out of the terminal", async ({
    page,
  }) => {
    await page.goto("/");
    await waitForTerminalReady(page);

    await sendCommand(page, "/portfolio");
    await expect(page).toHaveURL("/portfolio");
    await expect(
      page.getByRole("heading", { level: 1, name: "Portfolio" }),
    ).toBeVisible();
  });

  test("a case page emits Article and BreadcrumbList JSON-LD", async ({
    page,
  }) => {
    await page.goto(`/portfolio/${CASE_1.slug}`);

    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const graphs = blocks.map((b) => JSON.parse(b) as { "@graph": unknown[] });
    const nodes = graphs.flatMap((g) => g["@graph"]) as {
      "@type": string;
      url?: string;
      itemListElement?: unknown[];
    }[];

    const article = nodes.find((n) => n["@type"] === "Article");
    expect(article, "no Article node in the JSON-LD").toBeDefined();
    expect(article!.url).toBe(
      `https://headingfwd.com/portfolio/${CASE_1.slug}`,
    );

    const breadcrumb = nodes.find((n) => n["@type"] === "BreadcrumbList");
    expect(breadcrumb, "no BreadcrumbList node in the JSON-LD").toBeDefined();
    expect(breadcrumb!.itemListElement).toHaveLength(3);
  });
});

test.describe("Command deep links (/help, /about, …)", () => {
  test("/help loads the terminal with the help output already in the feed", async ({
    page,
  }) => {
    await page.goto("/help");
    await waitForTerminalReady(page);

    await expect(page.getByText("available commands")).toBeVisible();
    await expect(page).toHaveTitle("Help — terminal commands — HeadingFWD");
  });

  test("/contact loads with the contact links rendered", async ({ page }) => {
    await page.goto("/contact");
    await waitForTerminalReady(page);

    await expect(
      page.getByRole("link", { name: "linkedin.com/in/baswenneker" }),
    ).toBeVisible();
  });

  test("a command deep link keeps its URL and stays interactive", async ({
    page,
  }) => {
    await page.goto("/help");
    await page.waitForLoadState("networkidle");
    await waitForTerminalReady(page);

    // The portfolio URL-sync effect must not rewrite a terminal-mode URL.
    await expect(page).toHaveURL("/help");

    // The terminal underneath is fully interactive, and typing further
    // commands never rewrites the URL (a feed has no single URL).
    await sendCommand(page, "/about");
    await expect(page.getByText("$ whoami")).toBeVisible();
    await expect(page).toHaveURL("/help");
  });

  test("unregistered commands have no page: /clear, easter eggs and typos are 404", async ({
    page,
  }) => {
    for (const path of ["/clear", "/whoami", "/nope"]) {
      const res = await page.goto(path);
      expect(res?.status(), `${path} should be a 404`).toBe(404);
    }
  });
});

test.describe("Sitemap", () => {
  test("sitemap.xml lists every case URL and every command URL", async ({
    page,
  }) => {
    const res = await page.request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const xml = await res.text();

    for (const c of visibleCases()) {
      expect(xml).toContain(`https://headingfwd.com/portfolio/${c.slug}`);
    }
    for (const token of [
      "help",
      "about",
      "services",
      "stack",
      "contact",
      "agents",
    ]) {
      expect(xml).toContain(`https://headingfwd.com/${token}`);
    }
  });

  test("case entries carry a lastmod date from the case's `updated` field", async ({
    page,
  }) => {
    const res = await page.request.get("/sitemap.xml");
    const xml = await res.text();

    const dated = visibleCases().find((c) => c.updated);
    expect(dated, "no visible case has an `updated` value to assert on")
      .toBeDefined();

    // The <url> block for that case must carry a <lastmod>.
    const block = xml
      .split("<url>")
      .find((b) => b.includes(`/portfolio/${dated!.slug}<`));
    expect(block, `no sitemap entry for ${dated!.slug}`).toBeDefined();
    expect(block).toContain("<lastmod>");
    expect(block).toContain(dated!.updated!);
  });
});

test.describe("llms.txt", () => {
  // A case is one link line — title, URL and `kind` — not the write-up. The
  // case page is server-rendered prose, so an agent that follows the link
  // reads the whole thing, always in its current form.
  test("every visible case is a link line, not an inlined write-up", async ({
    page,
  }) => {
    const res = await page.request.get("/llms.txt");
    const text = await res.text();

    const cases = visibleCases();
    expect(cases.length).toBeGreaterThan(0);
    for (const c of cases) {
      const suffix = c.visibility === "coming-soon" ? " — coming soon" : "";
      expect(text, `missing llms.txt link line for ${c.slug}`).toContain(
        `- [${c.title}](https://headingfwd.com/portfolio/${c.slug}): ${c.kind}${suffix}`,
      );
    }

    expect(text).toContain("https://headingfwd.com/portfolio\n");
    // The old shape inlined each body under a `## 01 — Title` heading.
    expect(text, "llms.txt still inlines case bodies").not.toContain(
      `## ${cases[0]!.n} — ${cases[0]!.title}`,
    );
  });
});
