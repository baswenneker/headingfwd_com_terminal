# 1. Blog posts are Markdown files; cases stay TypeScript

Date: 2026-09-14
Status: Accepted

## Context

The repository already has one content type with a single source of truth:
portfolio **cases** live in `src/content/cases.ts`, a TypeScript module, and
the Markdown files in `cases/` are generated from it by `pnpm gen:cases`. Every
surface — the `/portfolio` overlay, `/llms.txt`, the sitemap — derives from that
one array, so they cannot drift.

The blog introduces a second content type: **posts**. The obvious move would be
to copy the case pattern, so the repository has one way of doing things.

## Decision

Posts are Markdown files with YAML frontmatter in `content/blog/`, one file per
post, and Markdown is the source rather than a generated artifact. Frontmatter
is validated with zod at load time; an invalid file throws and fails the build.

## Rationale

A case is a handful of structured fields — slug, sector, period, role, a short
outcome line — plus a write-up. The structure is what matters, and TypeScript
holds structure better than frontmatter: the compiler catches a missing field
the moment it is missed.

A post is the opposite shape. It is two thousand words of prose with headings,
figures, footnotes and charts, and roughly six fields of metadata. Holding that
as a TypeScript string literal would mean escaping the prose, losing editor
support for Markdown, and turning "publish a post" into a code change. The
issue's first author story is that publishing should be adding one file.

The two patterns are therefore deliberate, not drift. What both keep is the
no-drift guarantee: one loader, one visibility predicate (`isPublished`), and
every surface — overview, page, sitemap, RSS feed, `/llms.txt` — derived from
it.

## Consequences

- Publishing a post is a content change, not a code change.
- Validation moves from compile time to load time. It still fails the build,
  because the loader runs during static generation.
- Anyone touching content needs to know which type they are editing. The
  glossary in `CONTEXT.md` names both.
