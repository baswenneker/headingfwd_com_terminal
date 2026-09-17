# 4. An unlisted offer page on the editorial layout

Date: 2026-09-17
Status: Accepted

## Context

Bas offers a two-day AI coding workshop and sends the description to one
company at a time, by mail. A mail is rewritten for every recipient, drifts,
and cannot be linked from LinkedIn. He wants one Dutch page he can share by
link — without turning the site into a services catalogue: the homepage and
the terminal stay as they are, and the page should not compete with the blog
in search results.

The site already has a reading layout (ADR 0002) that posts and cases share
(ADR 0003), and two well-defined content types with their own visibility
rules in `CONTEXT.md`.

## Decision

A third content type, **Workshop**, with one page at
`/workshops/ai-coding-workshop`, rendered on the editorial layout through
`PostBody`.

The page is **unlisted**:

- Reachable on its URL, and named as a link line in `/llms.txt`.
- Linked from no page: not on the homepage, not in the terminal, not in the
  `COMMAND_PAGES` deep-link list, not on `/blog` or `/portfolio`.
- Absent from the sitemap.
- `noindex, follow` in its robots meta.

It does carry an Open Graph card, because the link is shared by mail and on
LinkedIn and the preview has to show the title. It carries no structured
data: nothing indexes the page, so an `Article` graph would serve no one.

The content is a Markdown string in a TypeScript module
(`src/content/workshops.ts`), the way cases are, not a Markdown file under
`content/` the way posts are. The route is static
(`workshops/ai-coding-workshop/page.tsx`), not a `[slug]` route.

## Rationale

**Why unlisted rather than published or hidden.** A published page would be
indexed and would show up next to the blog in search results, which is not
the audience. A page that is genuinely hidden cannot be shared. Unlisted is
the middle: anyone with the link reads it, nobody finds it by browsing. The
`/llms.txt` line is the one exception, on purpose: an agent asked about
HeadingFWD's services should be able to find the offer.

**Why not in the sitemap.** Nothing enumerates pages automatically here: the
sitemap and `COMMAND_PAGES` are explicit lists. "Unlisted" is therefore the
default behaviour of a new route, not something to enforce — the work was in
adding the one `/llms.txt` line, not in suppressing anything.

**Why a TypeScript string and no loader.** ADR 0001 chose Markdown files for
posts because there are many of them and they are written often. There is one
workshop. A loader that enumerates one file, a frontmatter schema for one set
of fields and a `[slug]` route for one slug would be machinery without a job.
A typed object keeps the page and the `/llms.txt` line reading from the same
source, which is the property that matters.

## Consequences

- `CONTEXT.md` gains the content type **Workshop** and the visibility state
  **Unlisted**.
- The e2e suite asserts both sides of "unlisted": the page renders and
  `/llms.txt` names it; the sitemap and the homepage do not.
- If a second workshop ever appears, this ADR should be revisited: at that
  point a `[slug]` route over an array in `workshops.ts` is the obvious step,
  and Markdown files (ADR 0001) become worth considering again.
- Rates are not on the page ("op aanvraag"); a quote goes by mail, so the page
  never carries a figure that has to be kept in step with what was offered.
