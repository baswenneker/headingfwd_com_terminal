/**
 * `/llms.txt` — a plain-text, machine-readable copy of everything on the site,
 * for AI agents and crawlers to read the source directly instead of scraping
 * the interactive terminal UI. This is the canonical full file; `/agents.txt`
 * permanently redirects here (see `next.config.js`).
 *
 * The file is generated from the same content the terminal renders:
 *   - About / specialities / stack / contact → `~/content/site-content`
 *   - Portfolio projects                     → `terminal-projects` (PROJECTS)
 *   - Detailed case studies                  → the Markdown files in `/cases`
 *
 * Because everything is derived from those sources, the file can never drift
 * from what visitors see. The route is statically rendered at build time
 * (`force-static`), so the Markdown files are read from disk during the build
 * and the result is served as a static asset — no work happens per request.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  ABOUT,
  CONTACT,
  INTRO,
  SPECIALTIES,
  STACK,
} from "~/content/site-content";
import { PROJECTS } from "~/app/_components/terminal-projects";

export const dynamic = "force-static";

/** Read the detailed case write-ups (`/cases/*.md`, excluding the README). */
function readCases(): string[] {
  const dir = join(process.cwd(), "cases");
  let files: string[];
  try {
    files = readdirSync(dir)
      .filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md")
      .sort();
  } catch {
    // No cases directory available at build time — skip the section gracefully.
    return [];
  }
  return files.map((f) => readFileSync(join(dir, f), "utf8").trim());
}

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

  // ── Portfolio ───────────────────────────────────────────────────────────
  const portfolio = ["## Portfolio / selected work"];
  for (const p of PROJECTS) {
    portfolio.push(
      "",
      `### ${p.n} — ${p.name}`,
      `**${p.kind}.**`,
      `Tags: ${p.tags.join(", ")}`,
      "",
      p.detail.join("\n\n"),
    );
  }
  blocks.push(portfolio.join("\n"));

  // ── Detailed case studies ───────────────────────────────────────────────
  const cases = readCases();
  if (cases.length > 0) {
    blocks.push(
      [
        "## Detailed case studies",
        "",
        "> The following case write-ups are in Dutch (source: HeadingFWD portfolio).",
        "",
        cases.join("\n\n---\n\n"),
      ].join("\n"),
    );
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
