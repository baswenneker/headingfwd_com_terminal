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
 * for the fullscreen `/portfolio` overlay and the agent file alike).
 * The `/cases/*.md` files are generated from that module (`pnpm gen:cases`).
 */

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
