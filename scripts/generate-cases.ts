/**
 * Generate the `cases/*.md` archive (and its README) from the single source of
 * truth, `src/content/cases.ts`.
 *
 * The Markdown files are derived artifacts — never hand-edit them. Edit a case
 * in `cases.ts` and run `pnpm gen:cases` to re-emit the files. The same `CASES`
 * array also drives `/work`, the `/portfolio` overlay and `/llms.txt`, so all
 * four surfaces stay in lockstep.
 *
 * Runs on plain Node via type stripping (Node 24): see the `gen:cases` script
 * in package.json. No build step or extra dependency required.
 */

import { existsSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CASES,
  caseVisibility,
  isComingSoonCase,
  isHiddenCase,
  visibleCases,
  type Case,
  type CaseStatus,
} from "../src/content/cases.ts";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CASES_DIR = join(ROOT, "cases");

/** Emoji used in the README status legend, matching the original cases README. */
const STATUS_EMOJI: Record<CaseStatus, string> = {
  live: "🟢",
  demo: "🔵",
  experiment: "🟡",
  concept: "⚪",
};

/** Quote a YAML scalar only when it contains characters that need it. */
function yamlScalar(value: string): string {
  return /[:#"]/.test(value) ? JSON.stringify(value) : value;
}

/** Render a YAML block list ("key:\n  - item\n  - item"). */
function yamlBlockList(key: string, items: string[]): string {
  return [`${key}:`, ...items.map((i) => `  - ${i}`)].join("\n");
}

/** Reconstruct one case as a full Markdown file (frontmatter + H1 + body). */
function caseToFileMarkdown(c: Case): string {
  const fm: string[] = [
    "---",
    `title: ${yamlScalar(c.title)}`,
    `slug: ${c.slug}`,
    `sector: ${yamlScalar(c.sector)}`,
    `status: ${c.status}`,
  ];
  // Only surface visibility when it differs from the default ("published").
  if (caseVisibility(c) !== "published") fm.push(`visibility: ${caseVisibility(c)}`);
  if (c.role) fm.push(`role: ${yamlScalar(c.role)}`);
  if (c.client) fm.push(`client: ${yamlScalar(c.client)}`);
  fm.push(`tags: [${c.tags.join(", ")}]`);
  fm.push(`stack: [${c.stack.join(", ")}]`);
  if (c.updated) fm.push(`updated: ${c.updated}`);
  if (c.links && c.links.length > 0) fm.push(yamlBlockList("links", c.links));
  if (c.sources && c.sources.length > 0) {
    fm.push(yamlBlockList("sources", c.sources));
  }
  fm.push("---");

  const base = `${fm.join("\n")}\n\n# ${c.title}\n\n${c.body.trim()}\n`;
  if (!c.videos || c.videos.length === 0) return base;

  const vids = c.videos.map((v) => {
    const mark = v.result === "fail" ? "❌ " : v.result === "success" ? "✅ " : "";
    const note = v.note ? ` — ${v.note}` : "";
    return `- ${mark}[${v.title}](${v.url})${note}`;
  });
  return `${base}\n## Videos\n\n${vids.join("\n")}\n`;
}

/** Build the README overview table + status legend from the visible cases. */
function buildReadme(): string {
  const rows = visibleCases().map((c) => {
    const status = isComingSoonCase(c)
      ? `${STATUS_EMOJI[c.status]} ${c.status} · 🔜 coming soon`
      : `${STATUS_EMOJI[c.status]} ${c.status}`;
    return `| ${c.n} | ${c.title} | ${c.sector} | ${status} | ${c.tags.join(", ")} | [${c.slug}.md](./${c.slug}.md) |`;
  });

  return [
    "# Cases",
    "",
    "> Generated from `src/content/cases.ts` with `pnpm gen:cases`.",
    "> **Do not edit by hand** — change the source and regenerate.",
    "> Hidden cases (`visibility: hidden`) are not listed here.",
    "",
    "## Overview",
    "",
    "| # | Case | Sector | Status | Tags | File |",
    "|---|------|--------|--------|------|------|",
    ...rows,
    "",
    "## Status legend",
    "",
    "- 🟢 **live** — in production / actually in use",
    "- 🔵 **demo** — working showcase / product concept with a demo",
    "- 🟡 **experiment** — own R&D, shared as an experiment",
    "- ⚪ **concept** — idea/teaser, not yet built out",
    "- 🔜 **coming soon** — visible as a teaser, write-up to follow (`visibility: coming-soon`)",
    "",
  ].join("\n");
}

function main(): void {
  let written = 0;
  for (const c of CASES) {
    const file = join(CASES_DIR, `${c.slug}.md`);
    // Hidden cases are pulled from the archive: remove any previously-generated
    // file so a case can't linger on disk after being hidden in the source.
    if (isHiddenCase(c)) {
      if (existsSync(file)) {
        rmSync(file);
        console.log(`removed cases/${c.slug}.md (hidden)`);
      }
      continue;
    }
    writeFileSync(file, caseToFileMarkdown(c), "utf8");
    console.log(`wrote cases/${c.slug}.md`);
    written++;
  }
  writeFileSync(join(CASES_DIR, "README.md"), buildReadme(), "utf8");
  console.log("wrote cases/README.md");
  console.log(`\nGenerated ${written} case files from src/content/cases.ts.`);
}

main();
