import { describe, expect, it } from "vitest";
import {
  CASES,
  caseVisibility,
  isComingSoonCase,
  isHiddenCase,
  visibleCases,
  type Case,
} from "~/content/cases";

/**
 * The publication state of a case — the three-way `visibility` field and the
 * predicates every public surface filters on.
 *
 * Tested on fixtures rather than on the live `CASES` list. Both coming-soon
 * shells were published as stated concepts (#13 F14), so no real case is in
 * that state today; the state and the placeholder it drives still exist, and
 * this is what keeps them honest if one is ever set again.
 */

function make(slug: string, visibility?: Case["visibility"]): Case {
  return {
    slug,
    n: "99",
    title: `Case ${slug}`,
    kind: "one-line outcome",
    sector: "Test",
    date: "2025-01-01",
    status: "concept",
    tags: [],
    stack: [],
    body: "A lead.\n\n## The work\n\n### Approach\n\nText.\n",
    ...(visibility ? { visibility } : {}),
  };
}

describe("caseVisibility", () => {
  it("treats an omitted field as published", () => {
    expect(caseVisibility(make("a"))).toBe("published");
    expect(isComingSoonCase(make("a"))).toBe(false);
    expect(isHiddenCase(make("a"))).toBe(false);
  });

  it("recognises a coming-soon shell", () => {
    const shell = make("b", "coming-soon");
    expect(caseVisibility(shell)).toBe("coming-soon");
    expect(isComingSoonCase(shell)).toBe(true);
    // A shell is still public: it keeps its place in the list, with a badge.
    expect(isHiddenCase(shell)).toBe(false);
  });

  it("recognises a hidden case", () => {
    const hidden = make("c", "hidden");
    expect(isHiddenCase(hidden)).toBe(true);
    expect(isComingSoonCase(hidden)).toBe(false);
  });
});

describe("visibleCases", () => {
  it("drops hidden cases and keeps published and coming-soon ones", () => {
    const list = [make("a"), make("b", "coming-soon"), make("c", "hidden")];
    expect(visibleCases(list).map((c) => c.slug)).toEqual(["a", "b"]);
  });

  it("defaults to CASES, none of which is hidden today", () => {
    expect(visibleCases()).toEqual(CASES.filter((c) => !isHiddenCase(c)));
    expect(visibleCases().length).toBeGreaterThan(0);
  });
});
