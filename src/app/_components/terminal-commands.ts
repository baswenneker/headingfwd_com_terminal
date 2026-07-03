/**
 * Feed line types and command registry for the terminal.
 *
 * A feed line is a small tagged object. The discriminating `kind` field
 * tells the renderer which visual style to apply. The parser turns raw user
 * input into a CommandResult that the terminal can act on: either clear the
 * feed entirely or append a list of new lines.
 */

import { ABOUT, CONTACT, SPECIALTIES, STACK } from "~/content/site-content";

// ── Discriminated-union line model ──────────────────────────────────────────

/** 10px-tall blank spacer, used to add visual breathing room after a command. */
export type SpLine = { kind: "sp" };

/** Command echo — the typed input mirrored back with the prompt prefix. */
export type CmdLine = { kind: "cmd"; text: string };

/** Section header in accent color, bold. */
export type HeadLine = { kind: "head"; text: string };

/** Regular output text in `#CFE2E7`. */
export type OutLine = { kind: "out"; text: string };

/** Subdued, low-contrast helper text. */
export type DimLine = { kind: "dim"; text: string };

/** Bullet point — accent `* ` prefix followed by body text. */
export type BulletLine = { kind: "bullet"; text: string };

/**
 * Two-column label / description row.
 * Label is in accent, min-width 96px; description is slightly muted.
 */
export type RowLine = { kind: "row"; label: string; desc: string };

/**
 * Clickable link row.
 * Label is dim, min-width 96px; the anchor is underlined accent text.
 * The anchor's onClick MUST stopPropagation so it does not trigger the
 * body's refocus handler.
 */
export type LinkLine = {
  kind: "link";
  label: string;
  text: string;
  href: string;
};

export type FeedLine =
  | SpLine
  | CmdLine
  | HeadLine
  | OutLine
  | DimLine
  | BulletLine
  | RowLine
  | LinkLine;

// ── Command result ───────────────────────────────────────────────────────────

/**
 * What the terminal should do after parsing a command.
 *
 * `clear`     — empties the feed entirely.
 * `lines`     — appends the given line objects to the feed.
 * `portfolio` — appends the given lines (echo + launch message) and signals
 *               that the fullscreen portfolio overlay should open after a
 *               short delay. The terminal handles the state change.
 * `openurl`   — appends the given lines and signals the terminal to open
 *               `url` in a new tab. Used by `/linkedin`. The terminal opens
 *               the tab synchronously inside the triggering gesture so the
 *               browser does not treat it as an unsolicited popup.
 */
export type CommandResult =
  | { action: "clear" }
  | { action: "lines"; lines: FeedLine[] }
  | { action: "portfolio"; lines: FeedLine[] }
  | { action: "openurl"; url: string; lines: FeedLine[] };

// ── Command handlers ─────────────────────────────────────────────────────────

const sp: SpLine = { kind: "sp" };

function helpLines(): FeedLine[] {
  return [
    { kind: "head", text: "available commands" },
    { kind: "row", label: "/about",     desc: "who I am & how I work" },
    { kind: "row", label: "/services",  desc: "what I help teams with" },
    { kind: "row", label: "/portfolio", desc: "browse my work in fullscreen ↵" },
    { kind: "row", label: "/stack",     desc: "tools, models & tech" },
    { kind: "row", label: "/contact",   desc: "how to reach me" },
    { kind: "row", label: "/agents",    desc: "plaintext version for agents (llms.txt)" },
    { kind: "row", label: "/clear",     desc: "clear the screen" },
    { kind: "dim", text: "tip: arrow keys recall history · or just type a question" },
  ];
}

function aboutLines(): FeedLine[] {
  return [
    { kind: "head", text: "$ whoami" },
    { kind: "out", text: ABOUT.name },
    ...ABOUT.lines.map((text): FeedLine => ({ kind: "out", text })),
  ];
}

function servicesLines(): FeedLine[] {
  return [
    { kind: "head", text: "// what I help teams with" },
    ...SPECIALTIES.map(
      (s): FeedLine => ({ kind: "bullet", text: `${s.title} — ${s.blurb}` }),
    ),
  ];
}

function stackLines(): FeedLine[] {
  return [
    { kind: "head", text: "// stack" },
    ...STACK.map((text): FeedLine => ({ kind: "out", text })),
  ];
}

function contactLines(): FeedLine[] {
  return [
    { kind: "head", text: "let's talk →" },
    { kind: "link", label: "linkedin", text: "linkedin.com/in/baswenneker", href: CONTACT.linkedin },
    { kind: "out",  text: "or just type your message right here — I'll pass it to Bas." },
    { kind: "dim",  text: CONTACT.note },
  ];
}

/** Points visitors and AI agents at the plain-text, machine-readable source. */
function agentsLines(): FeedLine[] {
  return [
    { kind: "head", text: "// plaintext version for agents" },
    { kind: "out",  text: "A plain-text, machine-readable copy of everything here —" },
    { kind: "out",  text: "so AI agents & crawlers can read the source directly." },
    { kind: "link", label: "file", text: "llms.txt", href: "/llms.txt" },
  ];
}

/**
 * Registry of known slash-commands. Keys are the lowercase command tokens
 * (without the leading slash).
 */
const COMMANDS: Record<string, () => FeedLine[]> = {
  help:     helpLines,
  about:    aboutLines,
  services: servicesLines,
  stack:    stackLines,
  contact:  contactLines,
  agents:   agentsLines,
  llms:     agentsLines,
  whoami:   () => [{ kind: "out", text: "guest@headingfwd — welcome :)" }],
  ls:       () => [{ kind: "out", text: "about/  services/  stack/  contact/" }],
};

/**
 * `/linkedin` output. The AI assistant suggests this command (see the system
 * prompt in `api/chat/route.ts`), so it must resolve to a real command rather
 * than the unknown-command fallback. The terminal also opens the profile in a
 * new tab (the `openurl` action below); this rendered link is the fallback if
 * the browser blocks the popup.
 */
function linkedinLines(): FeedLine[] {
  return [
    { kind: "out",  text: "→ opening Bas's LinkedIn profile in a new tab…" },
    { kind: "link", label: "linkedin", text: "linkedin.com/in/baswenneker", href: CONTACT.linkedin },
  ];
}

// ── Command deep-link pages ──────────────────────────────────────────────────

/** A slash-command that also exists as a shareable URL (e.g. `/help`). */
export interface CommandPage {
  /** Command token — also the URL path segment (`help` → `/help`). */
  token: string;
  /** SEO page title; the root layout's template appends " — HeadingFWD". */
  title: string;
  /** SEO meta description for the command's page. */
  description: string;
}

/**
 * The commands that get their own shareable URL, in /help order. Single
 * source of truth for those pages: `src/app/[command]/page.tsx` derives its
 * routes + metadata from this array and `src/app/sitemap.ts` its sitemap
 * entries, so adding one entry here publishes a new URL everywhere at once.
 *
 * Deliberately absent: `/clear` and `/cls` (they only mutate feed state —
 * there is no state to deep-link), the `/whoami`, `/ls` and `/llms`
 * easter-egg aliases, and `/portfolio`, which has a real route of its own
 * (`src/app/portfolio/`).
 */
export const COMMAND_PAGES: CommandPage[] = [
  {
    token: "help",
    title: "Help — terminal commands",
    description:
      "All commands of the HeadingFWD terminal: /about, /services, " +
      "/portfolio, /stack, /contact and /agents.",
  },
  {
    token: "about",
    title: "About Bas Wenneker",
    description:
      "Bas Wenneker — AI Lead / Engineer @ HeadingFWD. 15+ years shipping " +
      "software, 5+ years coaching 60+ product & innovation teams.",
  },
  {
    token: "services",
    title: "Services — what I help teams with",
    description:
      "Agentic workflow development, agentic coding training for dev teams, " +
      "AI techniques (RAG, graphs, memory) and AI strategy & consulting.",
  },
  {
    token: "stack",
    title: "Stack — tools, models & tech",
    description:
      "The HeadingFWD stack: LLMs, agents, RAG, evals, prompt + context " +
      "engineering · Python, TypeScript, React, Ruby on Rails, Docker.",
  },
  {
    token: "contact",
    title: "Contact",
    description:
      "Get in touch with Bas Wenneker / HeadingFWD — connect on LinkedIn, " +
      "or send a message from the terminal chat.",
  },
  {
    token: "agents",
    title: "For AI agents — llms.txt",
    description:
      "A plain-text, machine-readable version of everything on " +
      "headingfwd.com, so AI agents and crawlers can read the source directly.",
  },
];

/**
 * Fallback response for input that is not a recognised slash-command.
 * Points the visitor toward /help and the contact email.
 */
function freeformLines(): FeedLine[] {
  return [
    { kind: "out",  text: "→ I'm a lightweight demo assistant on this page." },
    { kind: "out",  text: "  Type /help for commands, or reach Bas directly:" },
    { kind: "link", label: "linkedin", text: "linkedin.com/in/baswenneker", href: CONTACT.linkedin },
  ];
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse raw terminal input and return a CommandResult.
 *
 * The command token is derived by stripping a leading slash, lower-casing,
 * then taking the first whitespace-delimited word — matching the reference
 * design's parsing logic.
 *
 * Returns `{ action: "clear" }` for /clear and /cls; otherwise returns
 * `{ action: "lines", lines }` with the echo line, command output, and
 * (for standard commands) a trailing spacer already included.
 *
 * Callers can add new branches to this result type later (e.g. an "ai"
 * action for free-text routing) without changing the overall structure.
 */
export function runCommand(raw: string): CommandResult {
  // Extract the command token: strip leading slash, lowercase, first word.
  const token = raw.replace(/^\//, "").toLowerCase().split(/\s+/)[0] ?? "";
  const echo: CmdLine = { kind: "cmd", text: raw };

  if (token === "clear" || token === "cls") {
    return { action: "clear" };
  }

  if (token === "portfolio" || token === "pf") {
    // Echo the command and the launch acknowledgement, then signal the
    // terminal to open the portfolio overlay after a short delay.
    return {
      action: "portfolio",
      lines: [echo, { kind: "out", text: "→ launching portfolio…" }],
    };
  }

  if (token === "linkedin" || token === "li") {
    // Echo the command, render the profile link, and signal the terminal to
    // open LinkedIn in a new tab. Advertised by the AI assistant.
    return {
      action: "openurl",
      url: CONTACT.linkedin,
      lines: [echo, ...linkedinLines()],
    };
  }

  const handler = COMMANDS[token];
  const output = handler ? handler() : freeformLines();
  return { action: "lines", lines: [echo, ...output, sp] };
}
