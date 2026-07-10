/**
 * Canonical case data — THE single source of truth for HeadingFWD's portfolio.
 *
 * Every surface that shows a case derives from this one array:
 *   - `/portfolio` (fullscreen overlay) → list (name + `kind`) and detail (`body`)
 *   - `/llms.txt`  (agent file)         → `caseToAgentMarkdown` per case
 *   - `cases/*.md` (generated archive)  → `pnpm gen:cases` re-emits them
 *
 * Editing a case here updates all of those at once, so they can never drift.
 * The Markdown surfaces (`/llms.txt`, `cases/*.md`) are GENERATED from this
 * module — never hand-edit them.
 *
 * To add a case: append an entry to CASES with a unique slug, the next `n`
 * display index, a one-line `kind`, the metadata fields, and the full write-up
 * as a Markdown string in `body` (no frontmatter, no leading H1).
 */

/** Lifecycle of a case, mirrored by the status legend in the generated README. */
export type CaseStatus = "live" | "demo" | "experiment" | "concept";

/**
 * Publication state — controls where and how a case surfaces, independent of
 * its lifecycle `status`. The two are orthogonal: a `concept` case can be
 * `published` (full teaser), `coming-soon` (placeholder), or `hidden`.
 *
 *   - "published"   — appears everywhere with its full write-up (the default).
 *   - "coming-soon" — stays in the `/portfolio` list with a "coming soon" badge,
 *                     but its detail view shows a placeholder panel instead of
 *                     the write-up. Marked as such in `/llms.txt` and the
 *                     generated archive.
 *   - "hidden"      — excluded from every public surface as if it did not exist:
 *                     `/portfolio`, `/llms.txt` and `cases/*.md`.
 *
 * All surfaces derive their list from `visibleCases()`, so flipping one field
 * updates them in lockstep — the same no-drift guarantee as the rest of CASES.
 */
export type CaseVisibility = "published" | "coming-soon" | "hidden";

/**
 * A demo/reference video for a case.
 *
 * Single source for both the click-to-play preview in the `/portfolio` overlay
 * (thumbnail from the YouTube `id`, embedded on click) and the plain Markdown
 * link emitted on the agent/archive surfaces (`/llms.txt`, `cases/*.md`), which
 * can't play video. Populate `videos` instead of hand-writing links in `body`.
 */
export interface CaseVideo {
  /** YouTube video id — drives the thumbnail and the embedded player. */
  id: string;
  /** Canonical watch URL, honoured verbatim on the link surfaces. */
  url: string;
  /** Short label shown beneath the preview. */
  title: string;
  /** Optional one-line caption. */
  note?: string;
  /** Optional outcome marker: a failed (❌) vs. working (✅) attempt. */
  result?: "fail" | "success";
}

/**
 * A single portfolio case with all of its details in one place.
 *
 * Required fields drive the visible surfaces; the optional metadata fields
 * (`period`, `role`, `client`, `links`, `sources`, `updated`, `image`,
 * `caseUrl`, `videos`) are preserved for provenance and future UI without
 * being required everywhere.
 */
export interface Case {
  /** URL-safe identifier; also the generated Markdown filename. */
  slug: string;
  /** Two-digit display index shown in the list ("01", "02", …). */
  n: string;
  /** Case title, shown prominently in the list and detail views. */
  title: string;
  /** One-line outcome/role summary — the `/portfolio` list subtitle. */
  kind: string;
  /** Sector / domain label. */
  sector: string;
  /** Engagement period, shown in the metadata line (e.g. "Q1 2025", "2024–2025"). */
  period?: string;
  /** Lifecycle status. */
  status: CaseStatus;
  /**
   * Publication state; omitted means "published". Flip to "coming-soon" to
   * tease a case without a write-up, or "hidden" to pull it from every surface.
   * See {@link CaseVisibility}.
   */
  visibility?: CaseVisibility;
  /** My role on the engagement (frontmatter `rol`). */
  role?: string;
  /** Client name, when not anonymised (frontmatter `klant`). */
  client?: string;
  /** Methodology / technology labels, rendered as chips. */
  tags: string[];
  /** Concrete tools / models used. Empty for non-build (e.g. PM) cases. */
  stack: string[];
  /** External links (live product, demo video, LinkedIn post). */
  links?: string[];
  /** Source references the write-up was extracted from. */
  sources?: string[];
  /** ISO date the case was last revised. */
  updated?: string;
  /** Optional hero image for the detail view. */
  image?: { src: string; alt: string };
  /** Optional external "read the full case" URL. */
  caseUrl?: string;
  /** Demo/reference videos, shown as click-to-play previews in the overlay. */
  videos?: CaseVideo[];
  /** Full write-up as Markdown (no frontmatter, no leading H1). */
  body: string;
}

export const CASES: Case[] = [
  {
    slug: "ai-writing-assistant",
    n: "01",
    title: "AI Writing Assistant",
    kind: "AI writing assistant that guards the house style — data stays in-house",
    sector: "Government",
    period: "Q1 2025",
    status: "live",
    role: "Initiator / AI engineer",
    tags: ["LLM", "Writing", "Marketing", "Python", "VectorDB"],
    stack: ["Azure OpenAI", "Python", "Agentic architecture", "VSCode"],
    sources: ["headingfwd-demo-playground/src/app/showcase/ai-schrijfhulp/page.tsx", "headingfwd-demo-playground/src/app/showcase/ai-schrijfhulp/schrijfhulp-demo.tsx", "headingfwd-com/src/data/index/page.json (teaser \"AI Schrijfhulp\")", "dspy-writing-style (gerelateerd R&D-experiment)"],
    updated: "2026-07-10",
    body: `
## In short

A generative-AI writing assistant for a large public-sector organization. It rewrites
any text to match the in-house style guide, approved word lists and B1 (plain-language)
accessibility level — without a single sentence ever leaving the organization's own
environment. Editors paste a draft and get sentence-by-sentence suggestions they can
accept, adjust or ignore, so they stay fully in control.

## Problem

Editors here work across high-traffic websites and large letter runs, and everything
they publish has to stay consistent: the style guide, the approved terminology, and
B1-level plain language so the average reader actually understands it. Doing that by
hand, at this volume, is slow and easy to get wrong.

Generic AI tools could help with the writing itself, but they came with two
dealbreakers: they don't know the organization's house style, and sending sensitive
government text to an external cloud was simply not an option on privacy grounds.

## Approach

Instead of dropping a finished tool on the team, I built it together with the editors.
Early scepticism turned into ownership by shipping small, showing real results on their
own texts, and adapting the tool to the way they actually work.

Just as important: the assistant runs entirely inside the organization's own
environment. Sensitive data never leaves the building — and that is precisely what made
adoption possible.

## How it works

An editor pastes a piece of text. The assistant rewrites it sentence by sentence and
returns the result as a three-column table — **Original · Rewritten · Remarks** — so
nothing is a black box: you see exactly what changed and why.

Behind the scenes, it retrieves the relevant style-guide rules and word-list entries
for each sentence, applies them, and flags anything worth a closer look. The editor
decides what to keep.

The output appears as a table with three columns: **Original sentence · Rewritten
sentence · Remarks**.

**Benefits:**

| Benefit | Explanation |
|---|---|
| 🔒 Data security | Every sentence stays inside your own environment — nothing goes to an external cloud. |
| ⚡ Efficiency | Instant rewrites, ready while you wait — no more checking style line by line. |
| 🎯 Consistency | The same style guide, applied the same way, every single time. |
| 📚 Word lists | Enforce preferred terms and avoid jargon on purpose, not from memory. |
| 👥 B1 level | Rewrites aim for plain language the average reader genuinely understands. |
| ✨ Everyone can write well | Turns every employee into a confident writer — not just the editors. |

> "By constantly getting new suggestions, it helps me in the creative process and it
> instantly meets the writing rules we follow!" — Editor

## Tech & stack

- ☁️ **Azure OpenAI LLMs** — LLM provider, hosted within the organization's own Azure tenant
- 🐍 **Python** — backend
- 🤖 **Agentic architecture** — the assistant reasons per sentence and calls the right rules
- 💻 **VSCode** — development environment
- 🔎 **Vector database** — retrieves the matching style-guide rules and word-list entries per sentence

## Status

**Live** — a custom client project running in production at a large public-sector
organization.
`,
  },
  {
    slug: "hintsay-linkedin",
    n: "02",
    title: "Hintsay: AI writing assistant for LinkedIn",
    kind: "Months of LinkedIn content in minutes, in your own voice",
    sector: "Marketing",
    status: "live",
    role: "Maker / AI engineer",
    tags: ["LLM", "Marketing", "SaaS"],
    stack: ["React", "Advanced language models", "Cloud infrastructure"],
    links: ["https://hintsay.com"],
    sources: ["headingfwd-demo-playground/src/app/cases/hintsay/page.tsx", "headingfwd-com/src/data/index/page.json (teaser \"LinkedIn Schrijfhulp\")", "vibes-chrome-li-extension (gerelateerd, los experiment)"],
    updated: "2025-06-19",
    body: `
## In short

Hintsay is an AI-powered writing assistant that helps professionals create engaging
LinkedIn content and strengthen their personal brand. The promise:
*"Generate months of LinkedIn content in minutes."* Produce months of content in just a
few minutes, while keeping your own voice and style.

## Problem

Professionals struggle with consistent, engaging content on LinkedIn:

- Lack of time for regular content creation
- Writer's block and lack of inspiration
- Uncertainty about what resonates with the audience
- Difficulty finding the right tone of voice
- Inconsistent posting frequency hurts visibility

## Approach

A smart writing assistant that speeds up and improves content creation:

- AI-generated content based on proven templates
- Topic suggestions from keywords
- Personalization based on the LinkedIn profile
- Support for English and Dutch
- Preserves your personal voice and style

**UX design process:**

| Phase | Activities |
|---|---|
| Research & Discovery | Analysis of LinkedIn posting patterns, user interviews with content creators, competitive analysis, performance data |
| Design & Prototyping | Minimalist/clean design, focus on speed, iterative UI/UX, A/B testing of features |
| AI Integration | Training on successful posts, continuous model improvement, personalization algorithms, quality assurance |

## How it works

**Content generation**

- AI-generated posts based on keywords
- Proven templates for different content types
- Personalization based on the LinkedIn profile
- Adjustable tone of voice
- Multilingual support (EN/NL)
- Real-time preview and editing

**Content strategy**

- Topic suggestions and brainstorming
- Content calendar planning
- Performance insights *(coming soon)*
- Audience engagement tracking
- Best practices and tips
- Content diversification advice

## Impact & results

| Figure | Meaning |
|---|---|
| 10× | Faster content creation |
| 7 days | Free trial period |
| 2 languages | English and Dutch |
| ∞ | Content possibilities |

## Tech & stack

- **Frontend & UX**: modern React interface, real-time content preview, responsive design, fast load times
- **AI & Backend**: advanced language models, continuous learning pipeline, secure API architecture, scalable cloud infrastructure

## Key takeaways

1. **AI as assistant, not replacement** — users want to stay in control of their content.
2. **Speed is essential** — professionals have little time; every second counts.
3. **Context and personalization** — generic content doesn't work; personalization is crucial.
4. **Continuous improvement** — LinkedIn algorithms change constantly; the tool must keep up.

## Status

**Live** — SaaS product, available at [hintsay.com](https://hintsay.com).
`,
  },
  {
    slug: "myworq",
    n: "03",
    title: "MyWorq: employee app for horticulture",
    kind: "Employee app for horticulture — live with thousands of users",
    sector: "Horticulture",
    status: "live",
    role: "Product Manager",
    client: "bQurius",
    tags: ["Mobile App", "Product Management", "Design Thinking"],
    stack: [],
    sources: ["headingfwd-demo-playground/src/app/showcase/myworq/page.tsx", "headingfwd-demo-playground/src/app/showcase/myworq/myworq-intro.tsx", "headingfwd-demo-playground/src/app/showcase/myworq/process-ticker.tsx"],
    updated: "2025-06-19",
    videos: [
      {
        id: "G3QL3dCgkOg",
        url: "https://www.youtube.com/watch?v=G3QL3dCgkOg",
        title: "MyWorq demo video",
        note: "A walkthrough of the MyWorq employee app in action.",
      },
    ],
    body: `
## In short

An employee app for the horticulture sector, focused on employee satisfaction,
productivity and collaboration. My role: **product manager**. The app is now live and
used by thousands of workers in horticulture.

## The story

With my roots in the Westland region, the MyWorq assignment was a home game. I was asked
to join the Data team of **bQurius** as product manager, to help develop an innovative
employee app specifically for the horticulture sector.

I worked closely with a colleague to map users' needs: the team leaders in the greenhouses
and the people working in them. Once we had outlined the app, we looked for a software
agency to build it.

After 2 years I handed the role over to the colleague I had worked with all along. The app
is now live and used by thousands of workers in the horticulture sector. Proud of this
project!

## Problem

The horticulture sector faces specific challenges around workforce management:

- High staff turnover and hard-to-find personnel
- Complex planning due to seasonal work
- Language barriers with international workers
- Lack of digital tools for field workers
- Inefficient communication between management and operational staff

## Solution

A user-friendly employee app, designed specifically for horticulture:

- Intuitive interface in multiple languages
- Real-time work planning and task management
- Direct communication between teams and supervisors
- Gamification elements for higher engagement
- Integration with existing HR and planning systems

## Way of working

1. 🔍 **Research** — conversations with customers to understand needs and pain points
2. ✏️ **Sketching** — sketching what a new feature could look like
3. 🎨 **Designing** — working the idea into a prototype with a UX/UI designer
4. 💻 **Building** — the software engineers build the feature into the app
5. 🧪 **Testing** — thoroughly testing the new feature
6. 🚀 **Rollout** — rolling out the updated app to users
7. 🔄 **Iterate** — analyze data, gather feedback, and the process starts again

## Role & stack

This is a **product-management case**, not an in-house development project: the app was
built by an external software agency. My contribution was in research, product definition,
design thinking and steering the build process. There is therefore no own tech stack to
list.

## Status

**Live** — the app is in production and used by thousands of workers in the horticulture
sector. Role handed over after 2 years.
`,
  },
  {
    slug: "briefwijzer",
    n: "04",
    title: "BriefWijzer",
    kind: "Make unreadable letters understandable with a single photo",
    sector: "Communication",
    status: "demo",
    role: "AI engineer",
    tags: ["RAG", "OCR", "LLM", "Marketing"],
    stack: ["Python", "Google Vision", "Claude Code", "VSCode"],
    sources: ["headingfwd-demo-playground/src/app/showcase/briefwijzer/page.tsx", "headingfwd-demo-playground/src/app/showcase/briefwijzer/components/briefwijzer-intro.tsx", "headingfwd-demo-playground/src/app/showcase/briefwijzer/components/how-it-works.tsx", "headingfwd-com/src/data/index/page.json (teaser \"Briefwijzer\")", "headingfwd_toolkit (promptfoo-test verwijst naar briefwijzer)"],
    updated: "2025-07-03",
    body: `
## In short

BriefWijzer makes unreadable (government) letters understandable. Your customer takes a
photo of the letter, and the app does the rest: a short, understandable summary, a
directly clickable call-to-action, and an AI-driven chat to ask questions about the
letter. As a bonus, you as the sender see which of your letters are experienced as
unreadable, so you can improve them — and you lower the contact load on your customer
service.

## Problem

Communication is not understandable for a large part of the Netherlands:

- 2 million people in the Netherlands are low-literate
- People who struggle to act on official mail pick up the phone to ask what it's about
- This puts pressure on contact centers
- Services don't match the needs of this audience
- Complicated letters lead to frustration and confusion

## Approach

BriefWijzer is a digital reading aid that makes letters readable for everyone, without
extra work for the sender:

- Short, understandable summary of the key points (max. 5 bullets)
- The call-to-action becomes directly (online) clickable
- Interactive chat function that answers within the context of the letter
- Insight for the sender into which letters are experienced as unreadable

## How it works

**Your customer…**

1. 📨 …receives your letter — but doesn't understand what it says.
2. 📱 …scans the BriefWijzer QR — no app download needed, it opens in the browser.
3. 📷 …takes a photo — uploading multiple pages is possible.

**BriefWijzer gets to work and…**

- 📋 …summarizes the letter in understandable, simple language (max. 5 bullets).
- 👆 …makes actions directly clickable — you configure the call-to-actions shown.
- 💬 …answers questions directly via chat.

## Tech & stack

- 🐍 **Python** — backend processing
- 👁️ **Google Vision** — OCR and document analysis
- 🤖 **Claude Code** — AI development assistant
- 💻 **VSCode** — IDE

The pipeline: OCR reads the letter, RAG/LLM summarizes and answers questions within the
context of the letter.

## Status

**Demo** — working product concept. Positioned as an app for companies and government
bodies that want to make their letters more accessible.
`,
  },
  {
    slug: "ai-personal-trainer",
    n: "05",
    title: "AI Personal Trainer",
    kind: "Custom AI that analyzes fitness videos where ChatGPT fails",
    sector: "Sports & Fitness",
    status: "experiment",
    role: "Maker / AI engineer",
    tags: ["LLM", "Multimodal", "Motion recognition", "Python"],
    stack: ["Google Gemini 2.5 Pro", "Python", "ChatGPT", "GitHub Copilot", "VSCode"],
    links: ["https://www.linkedin.com/posts/baswenneker_kan-chatgpt-een-personal-trainer-vervangen-activity-7330482395533430785-CqxF/", "https://www.linkedin.com/feed/update/urn:li:activity:7338437372616826883/"],
    sources: ["headingfwd-demo-playground/src/app/showcase/ai-personal-trainer/page.tsx"],
    updated: "2025-06-19",
    videos: [
      {
        id: "rrvgrcJ_v0M",
        url: "https://www.youtube.com/watch?v=rrvgrcJ_v0M",
        result: "fail",
        title: "Attempt 1 — ChatGPT can't analyze video",
        note: "ChatGPT can't analyze the video and gives generic advice that doesn't match the actual execution.",
      },
      {
        id: "9YoU4e1Ow3Q",
        url: "https://youtube.com/shorts/9YoU4e1Ow3Q",
        result: "success",
        title: "Attempt 2 — Custom AI Personal Trainer",
        note: "With custom software the AI analyzes movements in real time and gives specific, technical feedback with visual annotations.",
      },
      {
        id: "3GeEfHs6dTo",
        url: "https://www.youtube.com/watch?v=3GeEfHs6dTo",
        title: "Demo 1 — Squat Clean analysis",
        note: "Real-time analysis of a clean with direct visual feedback.",
      },
      {
        id: "lgP9zCadeLo",
        url: "https://www.youtube.com/watch?v=lgP9zCadeLo",
        title: "Demo 2 — Hang Squat Snatch analysis",
        note: "Detailed technique analysis of the snatch movement.",
      },
    ],
    body: `
## In short

Software that gives feedback on fitness videos, just like a coach or personal trainer
would. The story: an experiment with **ChatGPT as a personal trainer fails**, while
a **custom AI solution succeeds**. With custom software you can analyze complex movements
in video and give technical, personalized coaching on them.

## Problem

I was curious how far the multimodal capabilities of today's LLMs reach — models that
understand text, sound, images and video. For this I used videos I had earlier sent to my
own personal trainer. After uploading them to ChatGPT I only got generic, unspecific
feedback. No available model could analyze the movements accurately; when asked for visual
feedback it generated irrelevant images.

## Approach

So I built a custom solution: an AI-powered virtual Olympic coach that poses as the
world-famous weightlifting coach
[Bob Takano](https://www.takanoweightlifting.com/).

- **Prompt engineering** based on the methodology of a top weightlifting coach
- **Google Gemini 2.5 Pro** for frame-by-frame movement analysis
- A **Python tool** for slowing down the video and a visual feedback overlay
- Result: technically accurate, personalized coaching

### ChatGPT vs. custom

| ChatGPT — fails at video analysis of sports movements | Custom — AI-powered virtual Olympic coach |
|---|---|
| No available model can analyze movements accurately | Prompt engineering based on a top weightlifting coach's methodology |
| Feedback is generic and not specific to the technique shown | Google Gemini 2.5 Pro for frame-by-frame movement analysis |
| When asked for visual feedback it generates irrelevant images | Python tool for slowing down the video and a visual feedback overlay |
| Movement recognition is missing entirely | Technically accurate, personalized coaching |

The two attempts (attempt 1 with ChatGPT, attempt 2 with the custom coach) and two
technique analyses are shown as playable videos at the bottom of this case.

## Tech & stack

- 💬 **ChatGPT** — macOS app (first, failed attempt)
- 🤖 **Google AI Studio** — Gemini 2.5 Pro (multimodal video analysis)
- 🧑‍💻 **GitHub Copilot** — coding agent
- 💻 **VSCode** — IDE
- 🐍 **Python** — tool for slowing down video and the feedback overlay

## Status

**Experiment** — my own R&D, shared via LinkedIn with demo videos. It shows that generic
multimodal models fall short for movement analysis, while a custom approach with Gemini
2.5 Pro + a Python pipeline does work.
`,
  },
  {
    slug: "chatbot-qa-hub",
    n: "06",
    title: "Chatbot: a Q&A hub for your team",
    kind: "Chat with your manuals instead of searching them",
    sector: "Government",
    status: "concept",
    visibility: "coming-soon",
    tags: ["RAG", "LLM", "Chatbot", "Marketing"],
    stack: [],
    sources: ["headingfwd-demo-playground/src/data/projects.json (entry \"Chatbot: Vraagbaak voor je team\")", "headingfwd-demo-playground/src/app/showcase/coming-soon/page.tsx"],
    updated: "2025-06-19",
    body: `
## In short

A chatbot that acts as a Q&A hub for a team and saves a lot of time: chat instead of
reading through manuals.

## Approach (high level)

A classic **RAG chatbot**: documentation/manuals are made accessible via
Retrieval-Augmented Generation, so team members can ask their question in natural language
and get an answer with context right away — instead of searching through the manuals
themselves.

## Status

**Concept.** This idea has not yet been developed into a demo.
`,
  },
  {
    slug: "podcast-transcription",
    n: "07",
    title: "Podcast transcription and segmentation",
    kind: "Automatically transcribe and segment podcasts with timecodes",
    sector: "Media",
    status: "concept",
    visibility: "coming-soon",
    tags: ["Transcription", "LLM", "Audio"],
    stack: [],
    sources: ["headingfwd-com/src/data/index/page.json (teaser \"Podcast transcriptie en segmentering\")", "whisperfwd (gerelateerde, echte transcriptie-tech)"],
    body: `
## In short

Upload your podcast and automatically get a full transcription plus a segment breakdown
with timecodes — for example:

- \`0:00–1:30\` Introduction
- \`1:30–3:00\` Collaboration in healthcare
- …

## Approach (high level)

Audio is automatically converted to text (transcription), after which a model divides the
content into logical segments with timecodes. This makes a long episode searchable and
easy to navigate.

## Status

**Concept.** This idea has not yet been developed into a demo.

## Related tech: WhisperFWD

WhisperFWD is a macOS menu-bar app for recording meetings, with **local** transcription
and AI summaries:

- Dual-stream audio (microphone + system sound)
- Local transcription with [WhisperKit](https://github.com/argmaxinc/WhisperKit), model \`large-v3-turbo\`
- Structured summaries via the Claude Code CLI
- Output as Obsidian-compatible Markdown
- Stack: macOS 13+, Apple Silicon, Swift 5.9+

This shows that the transcription component of the podcast case is technically feasible and
proven; the podcast-specific segmentation with timecodes has not (yet) been built as a
standalone product.
`,
  },
];

/** Resolve a case's publication state, treating an omitted field as published. */
export function caseVisibility(c: Case): CaseVisibility {
  return c.visibility ?? "published";
}

/** True when the case must not appear on any public surface. */
export function isHiddenCase(c: Case): boolean {
  return caseVisibility(c) === "hidden";
}

/** True when the case is a teaser: still listed, but with a placeholder detail. */
export function isComingSoonCase(c: Case): boolean {
  return caseVisibility(c) === "coming-soon";
}

/**
 * The cases shown on public surfaces: everything except `hidden` ones.
 *
 * The `/portfolio` overlay, `/llms.txt` and the generated `cases/*.md` archive
 * all derive their list from this, so a `hidden` case disappears from every
 * surface at once — the same single-source guarantee as CASES itself.
 */
export function visibleCases(cases: Case[] = CASES): Case[] {
  return cases.filter((c) => !isHiddenCase(c));
}

/**
 * Demote the Markdown heading levels inside a case body by one, so its `##`
 * sections nest under the `##` case heading in the generated agent file.
 */
function demoteHeadings(body: string): string {
  return body.replace(
    /^(#{2,5}) /gm,
    (_match, hashes: string) => "#".repeat(hashes.length + 1) + " ",
  );
}

/**
 * Render one case as a Markdown block for the agent file (`/llms.txt`):
 * a heading, a compact metadata line, and the (heading-demoted) body.
 */
export function caseToAgentMarkdown(c: Case): string {
  const meta = [`Sector: ${c.sector}`];
  if (c.period) meta.push(`Period: ${c.period}`);
  meta.push(`Status: ${c.status}`);
  if (c.role) meta.push(`Role: ${c.role}`);
  if (c.client) meta.push(`Client: ${c.client}`);

  const lines = [
    `## ${c.n} — ${c.title}`,
    `_${c.kind}_`,
    "",
    meta.join(" · "),
    `Tags: ${c.tags.join(", ")}`,
  ];
  if (c.stack.length > 0) lines.push(`Stack: ${c.stack.join(", ")}`);
  if (c.links && c.links.length > 0) lines.push(`Links: ${c.links.join(" · ")}`);
  if (isComingSoonCase(c)) {
    lines.push(
      "",
      "> Coming soon — the full write-up of this case is on its way.",
    );
  }
  lines.push("", demoteHeadings(c.body));
  if (c.videos && c.videos.length > 0) {
    lines.push("", "### Videos");
    for (const v of c.videos) {
      const mark = v.result === "fail" ? "❌ " : v.result === "success" ? "✅ " : "";
      const note = v.note ? ` — ${v.note}` : "";
      lines.push(`- ${mark}[${v.title}](${v.url})${note}`);
    }
  }
  return lines.join("\n");
}
