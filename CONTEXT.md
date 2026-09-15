# CONTEXT

The vocabulary of this repository. Two content types live here and they are not
the same thing; several words mean something specific and are easy to confuse.
Use these words as written.

## Content types

**Case** — one piece of portfolio work. The source of truth is a TypeScript
entry in `src/content/cases.ts`; the Markdown files in `cases/` are generated
from it by `pnpm gen:cases` and are never hand-edited. A case surfaces on the
`/portfolio` overview, at `/portfolio/<slug>`, and in `/llms.txt` as a link.

**Post** — one long-form blog article. The source of truth is a Markdown file
with YAML frontmatter in `content/blog/`; there is no generated counterpart.
A post surfaces at `/blog`, at `/blog/<slug>`, in `/blog/rss.xml`, in the
sitemap and in `/llms.txt` as a link.

The inversion is deliberate. See `docs/adr/0001-markdown-posts.md`.

A case body and a post body go through the same renderer, so both follow the
vocabulary below: lead, section, item, and the rest. A case has no kicker and
no excerpt — its `kind`, the one-line outcome summary, plays the excerpt's
role. See `docs/adr/0003-portfolio-on-editorial-layout.md`.

## Parts of a post (and of a case body)

**Kicker** — the small label above the title, top left of the meta bar. Comes
from frontmatter. Optional.

**Excerpt** — the one- or two-sentence summary in frontmatter. It is what the
overview card, the meta description and the RSS feed show. Written for someone
who has *not* yet decided to read.

**Lead** — the opening paragraphs of the article itself: everything in the
Markdown before the first `##`. Written for someone who *has* decided to read.
A body therefore never opens with a heading: a `## In short` at the top would
become section I and leave the piece without a lead.

The excerpt and the lead are separate on purpose, and are never the same
string. If you find yourself copying one into the other, one of them is wrong.

**Section** — a `##` heading and everything under it. Numbered automatically
with roman numerals (I, II, III). Authors never type the number.

**Item** — a `###` heading and everything under it, laid out as two columns:
the number and label on the left, the body on the right. Numbered automatically
and **continuously across sections** — items 1-3 in section I, 4-6 in section
II. Authors never type the number.

**Aside** — a `:::aside` container directly under a `###`. It renders in the
item's left column, beside the argument rather than inside it. An `:::aside`
anywhere else renders as an ordinary side note.

**Stat row** — a ```stats fenced block of JSON, the row of headline figures
under the lead.

**Chart** — a ```chart fenced block of JSON. Declared by its data, drawn to SVG
on the server. Line or bar, linear or logarithmic.

**Pull quote** — a `:::quote` container. Its closing italic line is read as the
attribution.

## Visibility

**Published** — not a draft, and its date has arrived in Europe/Amsterdam. One
predicate, `isPublished`, decides this everywhere. An unpublished post is
absent from the overview, the sitemap, the feed and `/llms.txt` in every
environment.

**Draft** — `draft: true` in frontmatter. Withheld in production. Outside
production (`ENVIRONMENT` is `development` or `test`) a draft is *previewable*:
it appears in the overview with a badge, and its page renders with a DRAFT
banner and `noindex`.

**Future-dated** — a date that has not arrived. Withheld everywhere, preview
included; its URL is a hard 404. Because the routable set is computed at build
time, a future-dated post appears only after the next deploy.

`ENVIRONMENT` is not `NODE_ENV`. The end-to-end suite runs the dev server with
`NODE_ENV=test`, and must see drafts the way the author does. An unset
`ENVIRONMENT` means production, so the gate fails closed.

## Publication order

A post is published on this site first, indexed, and only then reposted to
LinkedIn with a line linking back. LinkedIn does not honour a canonical link
pointing at another domain; what establishes the original is the order. The
canonical tag, the `Article` structured data and the sitemap support that
order — they do not substitute for it.
