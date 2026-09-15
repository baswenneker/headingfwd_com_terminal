import Image from "next/image";
import Markdown from "react-markdown";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import type { Element } from "hast";
import { postAssets } from "~/content/blog/assets";
import { remarkPostStructure } from "~/content/blog/remark-post-structure";
import { POST_COPY } from "~/content/site-content";
import type { PostLanguage } from "~/content/posts";

/**
 * The rendered body of one post or case.
 *
 * Everything happens on the server: the Markdown is parsed, restructured into
 * the editorial layout, and its charts drawn to SVG, all before the HTML
 * leaves the machine. An editorial page therefore ships no application
 * JavaScript, and a crawler that never runs a script still sees the whole
 * article.
 *
 * The pipeline is the project's existing react-markdown stack plus three
 * plugins: GFM for tables and footnotes, directives for the `:::` containers,
 * and the project's own structure plugin (numbering, the two-column grid,
 * charts, figures) in `~/content/blog/remark-post-structure`.
 */

/**
 * Read a flag off the hast node behind a rendered element.
 *
 * Note the two spellings. Attributes this project sets itself (through the
 * structure plugin's `hProperties`) are stored under the exact string written
 * there — `data-post-inline-svg`. Attributes remark-gfm sets go through
 * property-information, which stores them camel-cased — `dataFootnotes`.
 * Both are correct; neither is a typo.
 */
function hasFlag(node: Element | undefined, name: string): boolean {
  return node ? name in node.properties : false;
}

/**
 * `markdown` is the source; `assetBase` the public directory its bare image
 * filenames resolve against (`/blog/<slug>` or `/portfolio/<slug>`); `lang`
 * picks the footnote labels.
 */
export function PostBody({
  markdown,
  assetBase,
  lang,
}: {
  markdown: string;
  assetBase: string;
  lang: PostLanguage;
}) {
  const assets = postAssets(assetBase);

  return (
    <Markdown
      remarkPlugins={[
        remarkGfm,
        remarkDirective,
        [remarkPostStructure, { resolveImage: assets.resolve }],
      ]}
      remarkRehypeOptions={{
        footnoteLabel: POST_COPY[lang].footnoteLabel,
        footnoteBackLabel: POST_COPY[lang].footnoteBackLabel,
        footnoteLabelTagName: "h2",
        // The default hides the label with a `sr-only` class this project
        // does not define. The source list is part of the article: show it.
        footnoteLabelProperties: {},
      }}
      components={{
        img({ node, src, alt, width, height }) {
          const source = typeof src === "string" ? src : "";

          // A hand-drawn SVG is inlined, so `currentColor` inside it resolves
          // to the page's own text colour and the diagram matches the site.
          if (hasFlag(node, "data-post-inline-svg")) {
            const markup = assets.inlineSvg.get(source);
            if (markup) {
              return (
                <span
                  data-post-inline-svg=""
                  role="img"
                  aria-label={alt ?? ""}
                  // The file is part of this repository, not user input.
                  dangerouslySetInnerHTML={{ __html: markup }}
                />
              );
            }
          }

          // Intrinsic dimensions come from the file itself (see assets.ts),
          // so the box is reserved before the bytes arrive and the layout
          // never jumps mid-read.
          return (
            <Image
              src={source}
              alt={alt ?? ""}
              width={Number(width) || 1200}
              height={Number(height) || 675}
              sizes="(max-width: 900px) 100vw, 760px"
              data-post-image=""
            />
          );
        },
        a({ node: _node, href, children, ...rest }) {
          const external = typeof href === "string" && /^https?:/i.test(href);
          return (
            <a
              href={href}
              {...(external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              {...rest}
            >
              {children}
            </a>
          );
        },
        table({ node: _node, children, ...rest }) {
          // Its own scroll container, so a wide table never widens the page.
          return (
            <div data-post-table="">
              <table {...rest}>{children}</table>
            </div>
          );
        },
        section({ node, children, ...rest }) {
          // remark-gfm marks its own footnote section. Give it a hook of its
          // own so the source list styles apart from the article's sections.
          const footnotes = hasFlag(node, "dataFootnotes");
          return (
            <section
              {...rest}
              {...(footnotes ? { "data-post-sources": "" } : {})}
            >
              {children}
            </section>
          );
        },
      }}
    >
      {markdown}
    </Markdown>
  );
}
