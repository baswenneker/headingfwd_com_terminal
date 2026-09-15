# 3. The portfolio moves onto the editorial layout

Date: 2026-09-15
Status: Accepted

## Context

ADR 0002 put the blog outside the terminal and closed with one open item:
"Migrating `/portfolio` to this layout is deliberately deferred; this layout is
the reference implementation it will be migrated onto (issue #4)."

Until now a case lived in a fullscreen overlay drawn on top of the terminal.
`/portfolio/<slug>` was a real URL, but reaching it mounted the terminal, the
tRPC provider and the CAPTCHA widget, then covered all of it with the overlay
and wrote the address bar by hand with `history.replaceState`. The write-up was
converted client-side with `marked` and styled by a second stylesheet that
duplicated much of the blog's.

So the site had two renderers for the same kind of content, two stylesheets
saying the same things in different values, and a case page that shipped the
whole terminal to show prose.

## Decision

`/portfolio` and `/portfolio/<slug>` are server-rendered routes on the same
layout as the blog. The overlay is gone, and with it the arrow-key and Esc
navigation, the URL sync and `portfolio-overlay.{tsx,module.css}`.

- The route group `(blog)` is renamed `(editorial)` and holds `blog/` and
  `portfolio/`. Its wrapper attribute becomes `data-editorial-root`.
- `editorial.module.css` carries what a post and a case share: the shell, the
  meta bar, the title, the whole rendered body, the overview list. What is left
  is small and surface-specific: `blog.module.css` (draft banner, origin
  footer) and `portfolio.module.css` (kind line, metadata, tag chips, hero,
  coming-soon panel, footer buttons).
- A case body goes through `PostBody`, the same server-side remark pipeline a
  post uses. `PostBody` therefore takes `{ markdown, assetBase, lang }` rather
  than a `Post`, and `postAssets` takes an asset base rather than a slug.
- `/llms.txt` lists each case and each post as one link line — title, URL and a
  one-line summary — instead of inlining every body.

Typing `/portfolio` or `pf` in the terminal now uses the `navigate` action, the
same one `/blog` uses.

## Rationale

A case is prose with headings, tables and the occasional comparison. That is
what the post pipeline already renders, and rendering it on the server means a
crawler that runs no script still receives the whole case. Reusing the pipeline
also gives a case the vocabulary posts have: the text before the first `##` is
the lead, a `##` is a numbered section, a `###` a numbered item.

One layout also settles the backdrop question. The blog and the overlay already
painted the same near-black surface with the same cyan glow; only the faint
42px grid differed. It now lives once, on the editorial shell, so the two
surfaces cannot drift apart again.

Cutting the bodies out of `/llms.txt` follows from the same move. The file was
a second copy of every case and post, kept in step by hand. Now that each page
is server-rendered prose, a link is enough: an agent that follows it reads the
piece in its current form, and the file stays a map of the site rather than a
mirror of it.

## Consequences

- ADR 0001 is unchanged: cases stay TypeScript in `src/content/cases.ts`.
  `cases/*.md` remains the one surface carrying a write-up in full.
- Every case body lost its `## In short` heading, so that paragraph is the
  lead. A body must never open with a heading again; `cases.ts` says so at the
  top.
- The one `###` in a case (`ai-personal-trainer`) now renders as numbered item
  01, its comparison table in the right-hand column. That is the vocabulary
  working as intended.
- A lead that opens with a list rather than a paragraph does not get the lead
  typography, because only `[data-post-lead] p` is styled that way.
  `podcast-transcription` is written like that; it is coming-soon, so its body
  does not render today.
- `VideoPreviews` is the only client component on an editorial page, and only
  on a case that has videos. Everything else ships no application JavaScript.
- The terminal no longer knows about cases: no `initialMode`, no
  `initialCaseSlug`, no case data imported into `terminal.tsx`.
- `caseToAgentMarkdown` and `postToAgentMarkdown` are deleted. Nothing else
  used them; the archive generator builds its own Markdown.
