/**
 * Portfolio project data for the fullscreen portfolio browser.
 *
 * This file is the single source of truth for the displayed projects. Editing
 * entries here is all that is needed to update the portfolio — no component
 * changes are required.
 *
 * Two optional fields unlock additional UI in the detail view automatically:
 *   - `image`   → replaces the striped placeholder with a real project visual.
 *   - `caseUrl` → adds a "read the case study →" button next to the CTA.
 *
 * To add or update a project, copy the template comment block below, fill in
 * every field, and append the entry to the PROJECTS array.
 */

/**
 * Shape of a single portfolio project.
 *
 * Required fields:
 *   n       Two-digit display index shown in the list ("01", "02", …).
 *   name    Short project title, shown prominently in both list and detail.
 *   kind    One-line role or outcome description.
 *   tags    Methodology / technology labels. Rendered as pill chips in the
 *           detail view and joined with "    ·    " (four spaces, dot, four
 *           spaces) in the list row.
 *   detail  One or two paragraphs describing the project.
 *
 * Optional fields — fill these in the data file alone to unlock the matching
 * UI; no component code changes are needed:
 *   image   When present, the detail view renders this image inside the visual
 *           box instead of the striped placeholder.
 *   caseUrl When present, a "read the case study →" button appears in the
 *           detail view's button row, next to the "work with me →" CTA.
 */
export interface Project {
  /** Two-digit display index, e.g. "01". */
  n: string;
  /** Short project title. */
  name: string;
  /** One-line role or outcome description. */
  kind: string;
  /** Methodology and technology labels. */
  tags: string[];
  /** Body paragraphs for the detail view (one or two per project). */
  detail: string[];
  /**
   * Optional project image shown in the visual box of the detail view.
   * Supply a path relative to /public (e.g. "/images/project-name.jpg").
   * When omitted, the striped placeholder box is displayed instead.
   */
  image?: {
    src: string;
    alt: string;
  };
  /**
   * Optional URL to a full case study page or document.
   * When provided, a "read the case study →" link button appears next to
   * the "work with me →" CTA in the detail view.
   */
  caseUrl?: string;
}

/*
 * ── How to add a project ─────────────────────────────────────────────────────
 *
 * Copy this template block, remove the leading asterisks, fill in every
 * required field, and append the result to the PROJECTS array below.
 *
 * {
 *   n:      "05",
 *   name:   "Your project title",
 *   kind:   "One-line description of role or outcome",
 *   tags:   ["Tag one", "Tag two", "Tag three"],
 *   detail: [
 *     "First paragraph — the problem or context.",
 *     "Second paragraph — what was built and what you contributed.",
 *   ],
 *   // Remove the two lines below if you have no image or case study yet:
 *   image:   { src: "/images/your-project.jpg", alt: "Alt text for the visual" },
 *   caseUrl: "https://headingfwd.com/case/your-project",
 * },
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const PROJECTS: Project[] = [
  {
    n: "01",
    name: "Next-best-message engine",
    kind: "Proactive customer communication, at scale",
    tags: ["Machine Learning / AI", "Design Thinking", "Agile", "Team coaching"],
    detail: [
      "I led an innovation team building a system that picks the next, most relevant message for each customer — proactively and at scale.",
      "We went from idea to MVP with cheap, fast experiments to validate desirability and feasibility before writing production code, then structured the agile build.",
    ],
    // image and caseUrl are intentionally omitted — add them when assets are ready.
  },
  {
    n: "02",
    name: "Knowledge & research platform",
    kind: "200+ colleagues rate, discuss & share research",
    tags: ["Scrum", "Design Thinking", "User testing", "Make / buy"],
    detail: [
      "A daily flood of financial reports and research arrived through many channels and went largely unused or misused.",
      "We built a platform where 200+ colleagues could view, rate, discuss and share every source. I helped the team weigh user needs, feasibility and viability, then we shipped it in scrum sprints.",
    ],
  },
  {
    n: "03",
    name: "Privacy-sensitive data masking",
    kind: "Protecting medical & sensitive records",
    tags: ["Design Thinking", "Machine Learning / AI", "Team coaching"],
    detail: [
      "A years-deep archive — scans, emails and structured data — held medical and privacy-sensitive customer records.",
      "That data had to be masked for users without clearance. I helped the team investigate the technical feasibility and economic viability of doing it reliably.",
    ],
  },
  {
    n: "04",
    name: "Benchmarket",
    kind: "Smart collaboration between city-centre businesses",
    tags: ["Lean Startup", "Machine Learning / AI", "Development"],
    detail: [
      "Helping retail, hotels and museums in city centres collaborate instead of compete.",
      "Using smart business rules and machine learning I found win-win patterns and matched entrepreneurs to each other — then designed, developed and launched the platform end to end.",
    ],
  },
];
