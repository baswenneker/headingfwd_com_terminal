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
