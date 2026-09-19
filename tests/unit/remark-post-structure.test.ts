import { describe, expect, it } from "vitest";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkDirective from "remark-directive";
import remarkRehype from "remark-rehype";
import type { Element, Root as HastRoot, RootContent } from "hast";
import { remarkPostStructure } from "~/content/blog/remark-post-structure";

/**
 * The structure plugin (`~/content/blog/remark-post-structure`), exercised
 * the way `post-body.tsx` runs it: parsed with remark-parse/remark-gfm/
 * remark-directive, transformed by the plugin, then handed to remark-rehype
 * to produce the hast tree the renderer turns into React elements. Assertions
 * read that hast tree directly (`unified`, `remark-parse` and `remark-rehype`
 * are already resolvable here as react-markdown's own dependencies — no new
 * dependency was added for this).
 */
async function render(markdown: string): Promise<HastRoot> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkDirective)
    .use(remarkPostStructure, { resolveImage: () => null })
    .use(remarkRehype);

  const mdast = processor.parse(markdown);
  return await processor.run(mdast);
}

function isElement(node: RootContent): node is Element {
  return node.type === "element";
}

/** Depth-first walk collecting every element that matches `predicate`. */
function findAll(
  nodes: RootContent[],
  predicate: (el: Element) => boolean,
  out: Element[] = [],
): Element[] {
  for (const node of nodes) {
    if (isElement(node)) {
      if (predicate(node)) out.push(node);
      findAll(node.children, predicate, out);
    }
  }
  return out;
}

function hasProp(el: Element, name: string): boolean {
  return name in el.properties;
}

/** All text in an element, gathered from every depth (e.g. a number wrapped
 * in its own `<p>`). */
function text(el: Element): string {
  return el.children
    .flatMap((c) => {
      if (c.type === "text") return [c.value];
      if (c.type === "element") return [text(c)];
      return [];
    })
    .join("");
}

describe("remarkPostStructure", () => {
  it("numbers sections with roman numerals", async () => {
    const tree = await render(
      "Lead.\n\n## First\n\nBody.\n\n## Second\n\nBody.\n\n## Third\n\nBody.\n",
    );

    const sections = findAll(tree.children, (el) =>
      hasProp(el, "data-post-section"),
    );
    expect(sections).toHaveLength(3);
    expect(
      sections.map((s) => s.properties["data-post-section-number"]),
    ).toEqual(["I", "II", "III"]);

    const romanSpans = findAll(tree.children, (el) =>
      hasProp(el, "data-post-roman"),
    );
    expect(romanSpans.map(text)).toEqual(["I", "II", "III"]);
  });

  it("numbers items continuously across section boundaries", async () => {
    const tree = await render(
      [
        "Lead.",
        "",
        "## Section one",
        "",
        "### Item A",
        "",
        "Text A.",
        "",
        "### Item B",
        "",
        "Text B.",
        "",
        "## Section two",
        "",
        "### Item C",
        "",
        "Text C.",
        "",
      ].join("\n"),
    );

    const numbers = findAll(tree.children, (el) =>
      hasProp(el, "data-post-item-number"),
    );
    expect(numbers.map(text)).toEqual(["01", "02", "03"]);

    // Item C (03) belongs to the SECOND section — that is the point.
    const secondSection = findAll(tree.children, (el) =>
      hasProp(el, "data-post-section"),
    )[1]!;
    const itemInSecondSection = findAll([secondSection], (el) =>
      hasProp(el, "data-post-item-number"),
    );
    expect(itemInSecondSection.map(text)).toEqual(["03"]);
  });

  it("a `###` written before the first `##` lands in the lead, not as an item", async () => {
    const tree = await render(
      "### Stray heading\n\nSome text before any section.\n\n## Section\n\nBody.\n",
    );

    const lead = findAll(tree.children, (el) =>
      hasProp(el, "data-post-lead"),
    )[0];
    expect(lead, "no lead wrapper was produced").toBeDefined();

    const strayHeading = findAll(lead!.children, (el) => el.tagName === "h3");
    expect(strayHeading).toHaveLength(1);
    expect(text(strayHeading[0]!)).toBe("Stray heading");

    // It must not have become a numbered item.
    const items = findAll(tree.children, (el) =>
      hasProp(el, "data-post-item-number"),
    );
    expect(items).toHaveLength(0);
  });

  it("a body that opens with a heading has no lead at all", async () => {
    const tree = await render("## Section\n\nBody with no lead paragraph.\n");

    const lead = findAll(tree.children, (el) => hasProp(el, "data-post-lead"));
    expect(lead).toHaveLength(0);

    const sections = findAll(tree.children, (el) =>
      hasProp(el, "data-post-section"),
    );
    expect(sections).toHaveLength(1);
  });
});
