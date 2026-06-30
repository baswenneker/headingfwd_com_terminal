/**
 * Expected text fragments for each slash-command output.
 *
 * These are derived from the command handlers in
 * src/app/_components/terminal-commands.ts and are used in E2E assertions.
 * Each entry lists the strings that MUST be visible in the terminal feed after
 * the corresponding command is executed.
 *
 * Slash-commands are handled entirely in the browser: pressing Enter triggers
 * a synchronous state update, not a network call. Assertions against this
 * data can therefore use tight timeouts.
 */

export const COMMAND_TEXT = {
  /** /help — lists all available commands */
  HELP: {
    /** The section header emitted as a "head" feed line. */
    header: "available commands",
    /**
     * Row labels that appear in the help output.
     * The /portfolio and /clear entries are also present but /about is the
     * first user-visible command label after the header.
     */
    commands: [
      "/about",
      "/services",
      "/work",
      "/portfolio",
      "/stack",
      "/contact",
      "/clear",
    ],
    /** Dim tip line at the bottom of the help output. */
    tip: "tip: arrow keys recall history",
  },

  /** /about — Bas's professional bio */
  ABOUT: {
    /** Header rendered as a "head" feed line (mimics a shell prompt). */
    header: "$ whoami",
    /** First out-line with name and title. */
    content: "Bas Wenneker — AI Lead / Engineer @ HeadingFWD",
  },

  /** /services — bullet-list of service offerings */
  SERVICES: {
    /** Section header. */
    header: "// what I help teams with",
    /**
     * Substrings unique to the /services feed output. The intro section on
     * the page shows the same service names but without the " — description"
     * suffix, so we use the description part to avoid strict-mode ambiguity.
     */
    bullets: [
      "agents that do real work",
      "where AI pays off",
      "measure quality before you ship",
      "production-ready, not just demos",
    ],
  },

  /** /work — numbered list of past engagements */
  WORK: {
    /** Section header. */
    header: "selected engagements",
    /** Job name column text for each engagement. */
    jobs: [
      "Next-best-message engine",
      "Knowledge platform",
      "Privacy data masking",
      "Benchmarket",
    ],
  },

  /** /stack — technology list */
  STACK: {
    /** Section header. */
    header: "// stack",
    /** First out-line; starts with "LLMs". */
    content: "LLMs · agents · RAG",
  },

  /** /contact — link rows with email and LinkedIn */
  CONTACT: {
    /** Section header. */
    header: "let's talk →",
    /** Anchor text for the email link. */
    email: "bas@headingfwd.com",
    /** Anchor text for the LinkedIn link. */
    linkedin: "linkedin.com/in/baswenneker",
  },

  /** /whoami alias — single-line guest greeting */
  WHOAMI: "guest@headingfwd",

  /** /ls alias — fake directory listing */
  LS: "about/  services/  work/  stack/  contact/",
};

/** Regex patterns for looser matching against the full terminal page text. */
export const COMMAND_PATTERNS = {
  HELP: /available commands/i,
  ABOUT: /Bas Wenneker/,
  SERVICES: /what I help teams with/i,
  WORK: /selected engagements/i,
  STACK: /\/\/ stack/i,
  CONTACT: /let's talk/i,
};
