/**
 * The remark plugin that turns a post's Markdown into the editorial layout.
 *
 * The author-facing contract it honours — see `CONTEXT.md` and the template
 * post in `content/blog/` — is:
 *
 *   lead paragraph      everything before the first `##`
 *   stat row            a ```stats fenced block of JSON
 *   section             `##`, numbered automatically with roman numerals
 *   numbered item       `###`, numbered continuously across sections
 *   left-column note    a `:::aside` directly under the `###`
 *   chart               a ```chart fenced block of JSON
 *   pull quote          a `:::quote` container, last line read as attribution
 *   figure + caption    an image followed by an italic line
 *
 * Numbers are assigned here rather than typed by the author, so reordering a
 * piece never means renumbering it. Everything the plugin emits is a plain
 * element with a `data-post-*` attribute; the CSS module styles those.
 */

import type { Properties, Element as HastElement } from "hast";
import type { Heading, PhrasingContent, Root, RootContent } from "mdast";
import type { ContainerDirective } from "mdast-util-directive";
import {
  chartSchema,
  parseBlockJson,
  renderChart,
  renderStats,
  statsSchema,
} from "./charts";
import { h } from "./hast";

/** How an image reference in the Markdown resolves against `public/`. */
export type ResolvedImage =
  | { kind: "raster"; src: string; width: number; height: number }
  | { kind: "svg"; src: string };

export interface PostStructureOptions {
  /** Resolve an image URL written in the post. Returns null if unknown. */
  resolveImage: (url: string) => ResolvedImage | null;
}

// ── Node helpers ─────────────────────────────────────────────────────────────

/**
 * Wrap block content in an element. The node type is unknown to
 * mdast-util-to-hast, which falls back to rendering its children inside an
 * element named by `data.hName` — exactly what is wanted here.
 */
function wrap(
  hName: string,
  hProperties: Properties,
  children: RootContent[],
): RootContent {
  return {
    type: "blogBlock",
    data: { hName, hProperties },
    children,
  } as unknown as RootContent;
}

/** Splice a finished hast element into the mdast tree. */
function fromElement(element: HastElement): RootContent {
  return {
    type: "blogElement",
    data: {
      hName: element.tagName,
      hProperties: element.properties,
      hChildren: element.children,
    },
  } as unknown as RootContent;
}

function isHeading(node: RootContent, depth: number): node is Heading {
  return node.type === "heading" && node.depth === depth;
}

/**
 * The node as a `:::name` container, or null.
 *
 * Deliberately not a type predicate: two predicate checks in a row would
 * narrow the second one's input to `never`, since the first already excluded
 * every container directive from the else branch.
 */
function asDirective(
  node: RootContent | undefined,
  name: string,
): ContainerDirective | null {
  return node?.type === "containerDirective" && node.name === name
    ? node
    : null;
}

/** I, II, III, … — section numbering, capped where a post has no business going. */
const ROMAN: [number, string][] = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export function toRoman(value: number): string {
  let rest = value;
  let out = "";
  for (const [n, symbol] of ROMAN) {
    while (rest >= n) {
      out += symbol;
      rest -= n;
    }
  }
  return out;
}

// ── Leaf transforms ──────────────────────────────────────────────────────────

/**
 * The single meaningful child of a paragraph, or null.
 *
 * "Meaningful" ignores the whitespace-only text nodes remark leaves around a
 * soft line break, so `![alt](x.png)` on its own line counts as one child
 * even when the paragraph technically holds three.
 */
function soleChild(node: RootContent | undefined) {
  if (node?.type !== "paragraph") return null;
  const kids = node.children.filter(
    (c) => !(c.type === "text" && c.value.trim() === ""),
  );
  return kids.length === 1 ? kids[0] : null;
}

/** A paragraph whose only content is one image. */
function loneImage(node: RootContent) {
  const only = soleChild(node);
  return only?.type === "image" ? only : null;
}

/** A paragraph whose only content is italic text — the caption of a figure. */
function loneEmphasis(node: RootContent | undefined) {
  const only = soleChild(node);
  return only?.type === "emphasis" ? only : null;
}

function imageElement(
  resolved: ResolvedImage,
  alt: string,
  title?: string | null,
): HastElement {
  if (resolved.kind === "svg") {
    // Marked, not inlined here: the renderer swaps it for the file's own
    // markup so the diagram inherits the page colours via `currentColor`.
    // Keeping the markup out of the attributes keeps it out of the HTML twice.
    return h("img", { src: resolved.src, alt, "data-post-inline-svg": "" });
  }
  return h("img", {
    src: resolved.src,
    alt,
    width: resolved.width,
    height: resolved.height,
    title: title ?? undefined,
    "data-post-image": "",
  });
}

/**
 * Split a pull quote's closing attribution off its body.
 *
 * The attribution is the last line of the quote, written in italics. It may
 * be a paragraph of its own, or — more usually — the last line of the quoted
 * paragraph, which Markdown folds into the same paragraph as a soft break.
 * Both are handled; a quote without a closing italic line has none.
 */
function splitAttribution(blocks: RootContent[]): {
  quoted: RootContent[];
  attribution: PhrasingContent[] | null;
} {
  const last = blocks[blocks.length - 1];

  const ownParagraph = loneEmphasis(last);
  if (ownParagraph) {
    return { quoted: blocks.slice(0, -1), attribution: ownParagraph.children };
  }

  if (last?.type === "paragraph") {
    const children = last.children;
    const tail = children[children.length - 1];
    const before = children[children.length - 2];
    const onOwnLine =
      before?.type === "break" ||
      (before?.type === "text" && before.value.endsWith("\n"));

    if (tail?.type === "emphasis" && onOwnLine) {
      const head = children.slice(0, before?.type === "break" ? -2 : -1);
      const trimmed =
        before?.type === "text"
          ? [
              ...head.slice(0, -1),
              { ...before, value: before.value.replace(/\n+$/, "") },
            ]
          : head;
      return {
        quoted: [...blocks.slice(0, -1), { ...last, children: trimmed }],
        attribution: tail.children,
      };
    }
  }

  return { quoted: blocks, attribution: null };
}

/**
 * Rewrite the blocks of one container: fenced chart/stat blocks become SVG,
 * `:::quote` becomes a pull quote, and an image followed by an italic line
 * becomes a figure with its caption.
 */
function mapBlocks(
  nodes: RootContent[],
  options: PostStructureOptions,
): RootContent[] {
  const out: RootContent[] = [];

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]!;

    // ```chart / ```stats — validated and drawn to SVG at build time.
    if (
      node.type === "code" &&
      (node.lang === "chart" || node.lang === "stats")
    ) {
      const raw = parseBlockJson(node.lang, node.value);
      if (node.lang === "chart") {
        out.push(fromElement(renderChart(chartSchema.parse(raw))));
      } else {
        out.push(fromElement(renderStats(statsSchema.parse(raw))));
      }
      continue;
    }

    // :::quote — a pull quote; a final italic line is read as the attribution.
    const quote = asDirective(node, "quote");
    if (quote) {
      const { quoted, attribution } = splitAttribution(
        mapBlocks(quote.children, options),
      );
      out.push(
        wrap("blockquote", { "data-post-quote": "" }, [
          ...quoted,
          ...(attribution
            ? [
                wrap("footer", { "data-post-quote-source": "" }, [
                  { type: "paragraph", children: attribution },
                ]),
              ]
            : []),
        ]),
      );
      continue;
    }

    // A stray :::aside outside an item still renders, as a side note.
    const strayAside = asDirective(node, "aside");
    if (strayAside) {
      out.push(
        wrap(
          "aside",
          { "data-post-aside": "" },
          mapBlocks(strayAside.children, options),
        ),
      );
      continue;
    }

    // An image on its own line, optionally followed by an italic caption.
    const image = loneImage(node);
    if (image) {
      const resolved = options.resolveImage(image.url);
      if (!resolved) {
        throw new Error(
          `post image not found: "${image.url}" — drop the file in ` +
            `public/blog/<slug>/ and reference it by name.`,
        );
      }
      const caption = loneEmphasis(nodes[i + 1]);
      const picture = imageElement(resolved, image.alt ?? "", image.title);

      out.push(
        wrap("figure", { "data-post-figure": "" }, [
          fromElement(picture),
          ...(caption
            ? [
                wrap("figcaption", { "data-post-figure-caption": "" }, [
                  { type: "paragraph", children: caption.children },
                ]),
              ]
            : []),
        ]),
      );
      if (caption) i++;
      continue;
    }

    out.push(node);
  }

  return out;
}

// ── Structure ────────────────────────────────────────────────────────────────

interface ItemDraft {
  heading: Heading;
  nodes: RootContent[];
}

interface SectionDraft {
  heading: Heading;
  intro: RootContent[];
  items: ItemDraft[];
}

function buildItem(
  item: ItemDraft,
  number: number,
  options: PostStructureOptions,
): RootContent {
  const [first, ...rest] = item.nodes;
  const aside = asDirective(first, "aside");
  const body = mapBlocks(aside ? rest : item.nodes, options);

  const side = wrap("div", { "data-post-item-side": "" }, [
    wrap("div", { "data-post-item-number": "" }, [
      {
        type: "paragraph",
        children: [{ type: "text", value: String(number).padStart(2, "0") }],
      },
    ]),
    {
      type: "heading",
      depth: 3,
      data: { hProperties: { "data-post-item-label": "" } },
      children: item.heading.children,
    },
    ...(aside
      ? [
          wrap(
            "div",
            { "data-post-aside": "" },
            mapBlocks(aside.children, options),
          ),
        ]
      : []),
  ]);

  return wrap("div", { "data-post-item": "" }, [
    side,
    wrap("div", { "data-post-item-body": "" }, body),
  ]);
}

function buildSection(
  section: SectionDraft,
  index: number,
  firstItemNumber: number,
  options: PostStructureOptions,
): RootContent {
  const roman = toRoman(index + 1);

  const heading: RootContent = {
    type: "heading",
    depth: 2,
    data: {
      hProperties: {
        "data-post-section-heading": "",
        id: `section-${roman.toLowerCase()}`,
      },
    },
    children: [
      {
        type: "emphasis",
        data: { hName: "span", hProperties: { "data-post-roman": "" } },
        children: [{ type: "text", value: roman }],
      },
      { type: "text", value: " " },
      ...section.heading.children,
    ],
  };

  return wrap(
    "section",
    { "data-post-section": "", "data-post-section-number": roman },
    [
      heading,
      ...mapBlocks(section.intro, options),
      ...section.items.map((item, i) =>
        buildItem(item, firstItemNumber + i, options),
      ),
    ],
  );
}

/**
 * Group the document: lead, then one `<section>` per `##`, each holding its
 * `###` items as a two-column row. Item numbers run continuously across
 * section boundaries — items 1-3 in section I, 4-6 in section II.
 *
 * Each group's own content is rewritten by `mapBlocks` once its place in the
 * layout is known, so an `:::aside` can still be recognised by where it sits.
 */
function structure(
  nodes: RootContent[],
  options: PostStructureOptions,
): RootContent[] {
  const lead: RootContent[] = [];
  const sections: SectionDraft[] = [];

  for (const node of nodes) {
    if (isHeading(node, 2)) {
      sections.push({ heading: node, intro: [], items: [] });
      continue;
    }

    const section = sections[sections.length - 1];
    if (!section) {
      lead.push(node);
      continue;
    }

    if (isHeading(node, 3)) {
      section.items.push({ heading: node, nodes: [] });
      continue;
    }

    const item = section.items[section.items.length - 1];
    if (item) item.nodes.push(node);
    else section.intro.push(node);
  }

  const out: RootContent[] = [];
  if (lead.length > 0) {
    out.push(wrap("div", { "data-post-lead": "" }, mapBlocks(lead, options)));
  }

  let itemNumber = 1;
  sections.forEach((section, i) => {
    out.push(buildSection(section, i, itemNumber, options));
    itemNumber += section.items.length;
  });

  return out;
}

// ── Plugin ───────────────────────────────────────────────────────────────────

export function remarkPostStructure(options: PostStructureOptions) {
  return function transform(tree: Root) {
    // Grouped first, then rewritten: an `:::aside` is only a left-column note
    // when it sits directly under its `###`, which is a fact about the raw
    // document order that leaf rewriting would erase.
    tree.children = structure(tree.children, options);
  };
}
