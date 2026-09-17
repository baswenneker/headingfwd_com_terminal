import { test, expect } from "@playwright/test";
import { AI_CODING_WORKSHOP, workshopPath } from "~/content/workshops";

/**
 * Tests for the unlisted workshop page at `/workshops/ai-coding-workshop`.
 *
 * The boundary under test is the HTTP response: what a visitor who received
 * the link sees, and what a crawler or agent receives. "Unlisted" is a set of
 * absences as much as presences, so the suite checks both sides: the page
 * renders in full and `/llms.txt` names it, while the sitemap and the homepage
 * do not.
 */

const PATH = workshopPath(AI_CODING_WORKSHOP);

test.describe("Workshop page (/workshops/ai-coding-workshop)", () => {
  test("renders the title, the kicker and the page title", async ({ page }) => {
    await page.goto(PATH);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      AI_CODING_WORKSHOP.title,
    );
    await expect(
      page.getByText(AI_CODING_WORKSHOP.kicker).first(),
    ).toBeVisible();
    await expect(page).toHaveTitle(`${AI_CODING_WORKSHOP.title} — HeadingFWD`);
    await expect(page.locator("article")).toHaveAttribute("lang", "nl");
  });

  test("lays the body out as numbered sections with ten programme items", async ({
    page,
  }) => {
    await page.goto(PATH);

    // Sections carry a roman numeral; the programme is ten `###` items,
    // numbered continuously across the two day sections.
    await expect(
      page.locator("[data-post-section] [data-post-roman]").first(),
    ).toBeVisible();
    await expect(page.locator("[data-post-item-number]")).toHaveCount(10);
  });

  test("the full body is in the HTML the server sends", async ({ page }) => {
    const res = await page.request.get(PATH);
    const html = await res.text();

    expect(html).toContain("De adoptie van coding agents");
    expect(html).toContain("Het tarief is op aanvraag.");
  });

  test("links to /contact and back to the terminal", async ({ page }) => {
    await page.goto(PATH);

    await expect(
      page.locator("footer").getByRole("link", { name: "/contact" }),
    ).toHaveAttribute("href", "/contact");
    await expect(
      page.getByRole("link", { name: /terug naar de terminal/i }),
    ).toHaveAttribute("href", "/");
  });

  test("is noindex", async ({ page }) => {
    await page.goto(PATH);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });
});

test.describe("Workshop page is unlisted", () => {
  test("llms.txt names the workshop as a link line", async ({ page }) => {
    const res = await page.request.get("/llms.txt");
    const text = await res.text();

    expect(text).toContain("## Workshops");
    expect(text).toContain(PATH);
    expect(text).toContain(AI_CODING_WORKSHOP.title);
  });

  test("the sitemap does not list it", async ({ page }) => {
    const res = await page.request.get("/sitemap.xml");
    const xml = await res.text();
    expect(xml).not.toContain(AI_CODING_WORKSHOP.slug);
  });

  test("the homepage does not link to it", async ({ page }) => {
    const res = await page.request.get("/");
    const html = await res.text();
    expect(html).not.toContain(AI_CODING_WORKSHOP.slug);
  });
});
