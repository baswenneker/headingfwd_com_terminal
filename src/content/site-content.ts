/**
 * Canonical site copy — the single source of truth for the short content
 * sections shown both in the terminal UI and in the machine-readable
 * `/agents.txt` file.
 *
 * The terminal command handlers (`terminal-commands.ts`) build their
 * `FeedLine[]` output from these values, and the `/agents.txt` route handler
 * renders the same values as plain text. Editing the copy here updates both
 * surfaces at once — so the agent file never drifts from what visitors see.
 *
 * Portfolio cases live separately in `cases.ts` (the single source of truth
 * for the `/portfolio` pages and the agent file alike). The `/cases/*.md`
 * files are generated from that module (`pnpm gen:cases`).
 */

/**
 * The day the copy in this file last changed — BUMP IT when you edit any
 * string below.
 *
 * It is the `lastModified` the sitemap reports for every surface built from
 * this copy: the terminal home, the six command pages and `/llms.txt`. Those
 * pages have no date of their own, and a build-time `Date.now()` would tell
 * crawlers the whole site changed on every deploy. A hand-maintained date is
 * the honest answer: slightly stale beats confidently wrong.
 */
export const SITE_CONTENT_UPDATED = "2026-09-18";

/** One-sentence value proposition, mirrored by the hero paragraph. */
export const INTRO =
  "Bas helps teams get real value from Generative AI — designing and building " +
  "agents, assistants and AI workflows that actually make it to production, " +
  "training dev teams, and consulting on AI strategy.";

/** Short "who I am" block, shown by `/about` and the agent file's About section. */
export const ABOUT = {
  /** Headline identity line. */
  name: "Bas Wenneker — AI Lead / Engineer @ HeadingFWD",
  /** Supporting bio lines. */
  lines: [
    "15+ yrs shipping software · 5+ yrs coaching 60+ product",
    "& innovation teams. I balance business, customer and tech",
    "to turn Generative AI from a demo into something in production.",
  ],
} as const;

/**
 * The four specialities. `title` is the headline; `blurb` is the short
 * "what it means" tail rendered after an em dash in both surfaces.
 */
export const SPECIALTIES = [
  { title: "Agentic workflow development", blurb: "agents that do real work" },
  {
    title: "Agentic coding training for dev teams",
    blurb: "hands-on, your stack",
  },
  {
    title: "AI techniques: RAG, graphs, memory & more",
    blurb: "grounded & stateful",
  },
  {
    title: "AI strategy & consulting",
    blurb: "where AI pays off, where it won't",
  },
] as const;

/** Tech / methodology stack lines. */
export const STACK = [
  "LLMs · agents · RAG · evals · prompt + context engineering",
  "Python · TypeScript · React · Ruby on Rails · Docker",
  "Lean Startup · Design Thinking · Service Design · Scrum",
] as const;

/** Contact details. */
export const CONTACT = {
  email: "bas@headingfwd.com",
  linkedin: "https://www.linkedin.com/in/baswenneker",
  note: "fastest reply: drop me a DM on LinkedIn.",
} as const;

/**
 * How the blog describes itself. One source for the four places that say it:
 * the `/blog` metadata, the overview's own intro line, the RSS channel
 * description and the `## Blog` heading note in `/llms.txt`.
 */
export const BLOG = {
  /**
   * Meta description and feed channel description — external, and read by
   * someone who has not opened the page yet, so it says more than the intro
   * does. "Published here first" earns its place: it is the line that tells a
   * reader arriving from a copy elsewhere which page is the original.
   */
  description:
    "My thoughts on AI and engineering, by Bas Wenneker — agents, assistants " +
    "and AI workflows that reach production. Published here first.",
  /** The intro paragraph under the "Blog" heading on the overview. */
  intro: "my thoughts on AI and engineering.",
} as const;

/**
 * Copy inside a post, in the post's own language. Everything language-
 * dependent a reader sees on a post page lives here: the heading above the
 * source list, its back-links, and the notice that this page is the original
 * — the last one matters most, because it is written for a visitor who
 * arrived from a copy on LinkedIn.
 */
export const POST_COPY = {
  nl: {
    footnoteLabel: "Bronnen",
    footnoteBackLabel: "Terug naar de tekst",
    origin:
      "Origineel gepubliceerd op headingfwd.com. Lees je dit ergens anders, " +
      "dan is deze pagina het origineel.",
    allPosts: "alle posts",
    backToTerminal: "terug naar de terminal",
  },
  en: {
    footnoteLabel: "Sources",
    footnoteBackLabel: "Back to content",
    origin:
      "Originally published on headingfwd.com. If you are reading a copy " +
      "elsewhere, this page is the original.",
    allPosts: "all posts",
    backToTerminal: "back to the terminal",
  },
} as const;
