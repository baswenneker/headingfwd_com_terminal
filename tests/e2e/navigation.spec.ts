import { test, expect } from "@playwright/test";
import { publishedPosts, postPath } from "~/content/posts";
import { visibleCases } from "~/content/cases";

/**
 * Crawl paths and landmarks — the links and page structure that must exist in
 * the served HTML, not just after JavaScript has run.
 *
 * The boundary under test is the document a crawler receives and the set of
 * landmarks a screen reader announces. Assertions therefore look at `href`
 * attributes and roles rather than at click behaviour, which the command
 * suite already covers.
 */

/** The first published post and the first visible case, for the detail pages. */
const FIRST_POST = publishedPosts()[0];
const FIRST_CASE = visibleCases()[0]!;

/** Every editorial route family, so a landmark check covers all four. */
function editorialPaths(): string[] {
  const paths = ["/blog", "/portfolio", `/portfolio/${FIRST_CASE.slug}`];
  if (FIRST_POST) paths.push(postPath(FIRST_POST));
  return paths;
}

test.describe("Editorial landmarks", () => {
  for (const path of editorialPaths()) {
    test(`${path} has exactly one main landmark`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("main")).toHaveCount(1);
    });
  }
});

test.describe("Terminal crawl paths", () => {
  test("the homepage links to every command page in its served HTML", async ({
    request,
  }) => {
    const html = await (await request.get("/")).text();

    // The tip-line tokens are anchors, so a crawler that runs no script still
    // reaches /help, /portfolio and /blog from the homepage.
    for (const href of ["/help", "/portfolio", "/blog"]) {
      expect(html).toContain(`href="${href}"`);
    }
  });

  test("the status bar offers contact alongside the work and the writing", async ({
    page,
  }) => {
    await page.goto("/");
    // Two anchors to /contact: the tip-line token and the status-bar link.
    await expect(page.locator('a[href="/contact"]')).toHaveCount(2);
    await expect(
      page.getByRole("link", { name: "contact", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "/contact", exact: true }),
    ).toBeVisible();
  });

  test("the 404 status bar carries the same three links", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");

    for (const href of ["/portfolio", "/blog", "/contact"]) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
    }
  });

  test("/help renders its command rows as links to the real pages", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("terminal-input").fill("/help");
    await page.getByTestId("terminal-input").press("Enter");

    for (const href of [
      "/about",
      "/services",
      "/portfolio",
      "/blog",
      "/stack",
      "/contact",
      "/agents",
    ]) {
      await expect(page.locator(`a[href="${href}"]`).first()).toBeVisible();
    }

    // /clear has no page of its own, so it stays a button.
    await expect(page.locator('a[href="/clear"]')).toHaveCount(0);
  });

  test("clicking a /help row runs the command instead of navigating", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("terminal-input").fill("/help");
    await page.getByTestId("terminal-input").press("Enter");

    await page.locator('a[href="/about"]').first().click();

    // Still on the homepage, with the command's output in the feed.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText("$ whoami")).toBeVisible();
  });
});

test.describe("Portfolio calls to action", () => {
  test("the overview leads with contact and keeps LinkedIn second", async ({
    page,
  }) => {
    await page.goto("/portfolio");

    const lead = page.locator("p", {
      has: page.getByRole("link", { name: "→ start a conversation" }),
    });
    await expect(
      lead.getByRole("link", { name: "→ start a conversation" }),
    ).toHaveAttribute("href", "/contact");
    await expect(
      lead.getByRole("link", { name: "or connect on LinkedIn" }),
    ).toHaveAttribute("href", /linkedin\.com/);
  });

  test("a case's work-with-me button points at /contact", async ({ page }) => {
    await page.goto(`/portfolio/${FIRST_CASE.slug}`);

    await expect(
      page.getByRole("link", { name: "work with me →" }),
    ).toHaveAttribute("href", "/contact");
    await expect(
      page.getByRole("link", { name: "or connect on LinkedIn" }),
    ).toHaveAttribute("href", /linkedin\.com/);
  });
});

test.describe("Post author block", () => {
  test.skip(!FIRST_POST, "no published post to render");

  test("a post names its author and offers the work and contact", async ({
    page,
  }) => {
    await page.goto(postPath(FIRST_POST!));

    // The aside sits inside the document, above the origin footer.
    const aside = page.getByRole("complementary");
    await expect(aside).toContainText("Bas Wenneker");
    await expect(aside.locator('a[href="/portfolio"]')).toHaveCount(1);
    await expect(aside.locator('a[href="/contact"]')).toHaveCount(1);
  });
});

test.describe("Editorial footer", () => {
  /** Every destination the shared footer must offer, in reading order. */
  const FOOTER_HREFS = ["/portfolio", "/blog", "/services", "/contact", "/"];

  for (const path of editorialPaths()) {
    test(`${path} links on to the rest of the site`, async ({ page }) => {
      await page.goto(path);

      const footer = page.getByRole("contentinfo");
      await expect(footer).toContainText("AI engineering & consultancy, Delft");

      for (const href of FOOTER_HREFS) {
        await expect(footer.locator(`a[href="${href}"]`)).toHaveCount(1);
      }
      await expect(
        footer.locator('a[href*="linkedin.com"]'),
      ).toHaveCount(1);
    });
  }
});
