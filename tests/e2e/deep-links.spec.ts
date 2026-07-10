import { test, expect } from "@playwright/test";
import { sendCommand, waitForTerminalReady } from "../helpers/session";

/**
 * Tests for the shareable deep-link URLs.
 *
 * Every terminal state has a URL:
 *
 *   /portfolio/<slug>  — overlay open on one case's detail view
 *   /help, /about, …   — terminal with that command pre-executed
 *                        (the COMMAND_PAGES registry in terminal-commands.ts)
 *
 * While the overlay is open, browsing keeps the address bar in sync via
 * history.replaceState; leaving the overlay resets the URL to `/`. Command
 * deep links keep their URL (the sync effect only runs in portfolio mode).
 * Slugs and commands outside the registries are hard 404s
 * (`dynamicParams = false` on both dynamic routes).
 */

// First and second visible case, in CASES order (src/content/cases.ts).
const CASE_1 = { slug: "ai-writing-assistant", title: "AI Writing Assistant" };
const CASE_2 = {
  slug: "hintsay-linkedin",
  title: "Hintsay: AI writing assistant for LinkedIn",
};
// A coming-soon case renders its teaser placeholder instead of a write-up.
const TEASER = {
  slug: "chatbot-qa-hub",
  title: "Chatbot: a Q&A hub for your team",
};

test.describe("Case deep links (/portfolio/<slug>)", () => {
  test("direct load opens the overlay on the case detail view", async ({
    page,
  }) => {
    await page.goto(`/portfolio/${CASE_1.slug}`);

    await expect(
      page.getByRole("heading", { level: 2, name: CASE_1.title }),
    ).toBeVisible();
    // Detail view, not the list: the back-to-list button is present.
    await expect(
      page.getByRole("button", { name: "back to all work" }),
    ).toBeVisible();
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
  });

  test("browsing in the overlay keeps the URL in sync", async ({ page }) => {
    await page.goto(`/portfolio/${CASE_1.slug}`);
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { level: 2, name: CASE_1.title }),
    ).toBeVisible();

    // → next case: the address bar follows via replaceState.
    await page.keyboard.press("ArrowRight");
    await expect(
      page.getByRole("heading", { level: 2, name: CASE_2.title }),
    ).toBeVisible();
    await expect(page).toHaveURL(`/portfolio/${CASE_2.slug}`);

    // Esc: back to the list → /portfolio. Esc again: exit overlay → /.
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL("/portfolio");
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL("/");
    await expect(page.getByTestId("terminal-input")).toBeVisible();
  });

  test("opening a case from the /portfolio list updates the URL", async ({
    page,
  }) => {
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle");

    // exact: true — "AI Writing Assistant" is also a case-insensitive
    // substring of the Hintsay row's title, so a loose match is ambiguous.
    await page.getByText(CASE_1.title, { exact: true }).click();
    await expect(
      page.getByRole("button", { name: "back to all work" }),
    ).toBeVisible();
    await expect(page).toHaveURL(`/portfolio/${CASE_1.slug}`);
  });

  test("a coming-soon case deep link shows its teaser placeholder", async ({
    page,
  }) => {
    await page.goto(`/portfolio/${TEASER.slug}`);

    await expect(
      page.getByRole("heading", { level: 2, name: TEASER.title }),
    ).toBeVisible();
    await expect(page.getByText("🚧 coming soon")).toBeVisible();
  });

  test("an unknown slug is a hard 404", async ({ page }) => {
    const res = await page.goto("/portfolio/does-not-exist");
    expect(res?.status()).toBe(404);
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

    for (const slug of [CASE_1.slug, CASE_2.slug, TEASER.slug]) {
      expect(xml).toContain(`https://headingfwd.com/portfolio/${slug}`);
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
});
