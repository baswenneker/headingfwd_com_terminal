# 2. The blog is a route outside the terminal

Date: 2026-09-14
Status: Accepted

## Context

Everything on headingfwd.com currently lives inside the terminal: the chat, the
slash-command deep links, and the portfolio overlay. `/portfolio/<slug>` is a
real, indexable URL, but it renders the terminal and opens an overlay on top of
it. The terminal window is capped at `min(84vh, 780px)` and scrolls internally.

A two-thousand-word article with charts, figures and footnotes does not fit in
that window, and the reading experience of a long piece inside a scrolling box
is poor at any width.

## Decision

`/blog` and `/blog/<slug>` are server-rendered routes outside the terminal. The
terminal bundle — the chat hook, the tRPC provider, react-query and the CAPTCHA
widget — is not loaded on a blog page.

Keeping that bundle off the blog requires route groups, because the root layout
used to wrap every page in `TRPCReactProvider`. There are now two groups:

- `src/app/(terminal)/` — the home page, the `[command]` deep links and the
  portfolio routes, plus a `layout.tsx` that renders `TRPCReactProvider`.
- `src/app/(blog)/` — the blog routes, with no provider.

The root layout keeps the `html` and `body` elements, the font, the site-wide
JSON-LD graph, Analytics and Speed Insights. `not-found.tsx` stays at the root;
it does not use tRPC.

## Rationale

A post is prose. Nothing on the page needs application JavaScript, and a
crawler that never executes a script should still receive the whole article.
Charts are drawn to SVG on the server for the same reason.

A nested layout cannot set attributes on `html` or `body`, which the terminal
needs to be `overflow: hidden` on a cyan gradient. The blog layout therefore
marks its own wrapper with `data-blog-root`, and `globals.css` undoes both with
`html:has([data-blog-root])` / `body:has([data-blog-root])`.

## Consequences

- Typing `/blog` in the terminal leaves the page for real, rather than opening
  an overlay in place. That is the `navigate` action in `terminal-commands.ts`.
- `blog` is deliberately absent from `COMMAND_PAGES`: that array feeds both the
  `[command]` route's `generateStaticParams` and the sitemap, so registering it
  would generate a dead page and a duplicate sitemap entry. It follows the
  `portfolio` precedent — a token handled in the command parser that has a real
  route of its own.
- Migrating `/portfolio` to this layout is deliberately deferred; this layout is
  the reference implementation it will be migrated onto (issue #4). Done — see
  `0003-portfolio-on-editorial-layout.md`, which also renames the `(blog)`
  route group to `(editorial)`.
