/**
 * A three-line hast builder.
 *
 * The blog's charts and stat rows are built as hast (HTML-AST) element trees
 * and attached to mdast nodes as `data.hChildren`, so react-markdown turns
 * them into real React elements. That needs an element constructor and
 * nothing else, which is not worth a dependency.
 */

import type { Element, ElementContent } from "hast";

/**
 * Attribute values as they are written here. `@types/hast` types every known
 * attribute individually — SVG geometry as strings — so numbers are widened
 * once, at the boundary, rather than stringified at 40 call sites.
 */
export type Attrs = Record<
  string,
  string | number | boolean | (string | number)[] | undefined
>;

/** Build a hast element. Strings among the children become text nodes. */
export function h(
  tagName: string,
  properties: Attrs = {},
  children: (ElementContent | string | null | undefined)[] = [],
): Element {
  return {
    type: "element",
    tagName,
    properties: properties,
    children: children
      .filter(
        (c): c is ElementContent | string => c !== null && c !== undefined,
      )
      .map((c) =>
        typeof c === "string" ? { type: "text" as const, value: c } : c,
      ),
  };
}
