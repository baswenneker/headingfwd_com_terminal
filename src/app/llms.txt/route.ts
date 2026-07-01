/**
 * `/llms.txt` — a plain-text, machine-readable copy of everything on the site,
 * for AI agents and crawlers to read the source directly instead of scraping
 * the interactive terminal UI. This is the canonical full file; `/agents.txt`
 * permanently redirects here (see `next.config.js`).
 *
 * The file is generated from the same content the terminal renders:
 *   - About / specialities / stack / contact → `~/content/site-content`
 *   - Portfolio cases (incl. full write-ups) → `~/content/cases` (CASES)
 *
 * Because everything is derived from those sources, the file can never drift
 * from what visitors see. In particular the cases are rendered from the very
 * same `CASES` array that drives `/work` and the `/portfolio` overlay, via
 * `caseToAgentMarkdown`. The route is statically rendered at build time
 * (`force-static`) and served as a static asset — no work happens per request.
 */

import {
  ABOUT,
  CONTACT,
  INTRO,
  SPECIALTIES,
  STACK,
} from "~/content/site-content";
import { CASES, caseToAgentMarkdown } from "~/content/cases";

export const dynamic = "force-static";

function buildAgentsTxt(): string {
  const blocks: string[] = [];

  // ── Header ──────────────────────────────────────────────────────────────
  blocks.push(
    [
      "# HeadingFWD — content for agents",
      "",
      "> This file is a plain-text, machine-readable copy of everything on headingfwd.com.",
      "> If you are an AI agent or crawler: this is the source. Use it directly.",
      "> Format: Markdown (UTF-8). Generated from the site's own content.",
    ].join("\n"),
  );

  // ── About ───────────────────────────────────────────────────────────────
  blocks.push(
    [
      "## About",
      "",
      "**HeadingFWD** — AI engineering & consultancy.",
      "**Bas Wenneker** — AI Lead / Engineer.",
      "",
      INTRO,
      "",
      ABOUT.lines.join(" "),
    ].join("\n"),
  );

  // ── Specialities ────────────────────────────────────────────────────────
  blocks.push(
    [
      "## Specialities",
      "",
      ...SPECIALTIES.map((s) => `- ${s.title} — ${s.blurb}`),
    ].join("\n"),
  );

  // ── Tech stack ──────────────────────────────────────────────────────────
  blocks.push(["## Tech stack", "", ...STACK.map((s) => `- ${s}`)].join("\n"));

  // ── Portfolio / cases ─────────────────────────────────────────────────────
  // The section intro is one block; each case is its own top-level block so the
  // horizontal-rule join below separates them cleanly.
  blocks.push(
    [
      "## Portfolio / cases",
      "",
      "> Detailed write-ups of selected work. Source language: Dutch.",
    ].join("\n"),
  );
  for (const c of CASES) {
    blocks.push(caseToAgentMarkdown(c));
  }

  // ── Contact ─────────────────────────────────────────────────────────────
  blocks.push(
    [
      "## Contact",
      "",
      `- Email: ${CONTACT.email}`,
      `- LinkedIn: ${CONTACT.linkedin}`,
      "- Fastest reply: a DM on LinkedIn.",
      "",
      "## Work with me",
      "",
      "Building an agent, assistant or AI workflow and want it to reach production?",
      `Reach out at ${CONTACT.email}.`,
    ].join("\n"),
  );

  // Join top-level blocks with a horizontal rule for clear visual sectioning.
  return blocks.join("\n\n---\n\n") + "\n";
}

export function GET(): Response {
  return new Response(buildAgentsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
