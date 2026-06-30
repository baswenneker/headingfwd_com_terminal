# Handoff: HeadingFWD.com — Interactive Terminal Portfolio

## Overview
A redesign of **headingfwd.com**, the personal site of Bas Wenneker (AI Lead / Engineer, AI engineering & consultancy). The design is a single-screen **interactive terminal** rendered inside a macOS-style window on a cyan backdrop. Visitors type slash-commands (`/help`, `/about`, `/services`, `/work`, `/stack`, `/contact`, `/portfolio`, `/clear`) to explore content. `/portfolio` launches a **fullscreen ASCII portfolio browser** with a keyboard-navigable project list and per-project detail views.

## About the Design Files
The file in this bundle — `HeadingFWD.reference.html` — is a **design reference created in HTML**, a working prototype showing the intended look and behavior. It is **not production code to copy directly**. It uses a small in-house template runtime (`<x-dc>`, `{{ }}` holes, `<sc-for>`/`<sc-if>`, a `Component extends DCLogic` class). **Do not** port that runtime.

Your task: **recreate this design in the existing Next.js codebase** using its established patterns — React function components, the project's styling solution (Tailwind / CSS Modules / styled-components — whatever is already in use), and idiomatic state with `useState`/`useReducer`. All logic shown in the reference's `Component` class (command routing, history, portfolio navigation) should become ordinary React state and handlers.

## Fidelity
**High-fidelity (hifi).** Colors, typography, spacing, and interactions are final. Recreate the UI pixel-accurately. The exact values are in the Design Tokens section below; the reference HTML is the source of truth for anything not written here.

---

## Tech notes for the Next.js rebuild
- This is an interactive client component. The terminal and portfolio need `useState`, refs, and keyboard handlers — put them in a `"use client"` component (e.g. `app/page.tsx` rendering `<Terminal />` from `components/Terminal.tsx`).
- Suggested state: `feed` (array of rendered output lines), `input` (string), `history` (array) + `historyIndex`, `mode` (`"terminal" | "portfolio"`), `pfIndex` (selected project), `pfDetail` (boolean — list vs detail view).
- The font is **JetBrains Mono** (Google Fonts). Load it via `next/font/google` (`JetBrains_Mono`, weights 400/500/700/800, plus italic 400).
- No external UI libraries are required. No images — the only "graphic" is an ASCII banner (plain text in a `<pre>`).
- Keep everything keyboard-first and accessible: the input stays focused; clicking anywhere in the terminal body refocuses it.

---

## Screens / Views

### 1. Terminal (default view)
**Purpose:** Landing + primary navigation. Visitor reads the intro and types commands.

**Layout:**
- Full-viewport flex container, centered both axes, padding `clamp(12px, 3.5cqw, 52px)`.
- Background: cyan `#0BD3E6` with two radial-gradient overlays for depth (top highlight + bottom shadow — see tokens), plus a faint 38px dotted grid masked with a radial fade, and an optional scanline overlay (theme toggle, default off).
- Centered **terminal window**: `width: min(980px, 100%)`, `height: min(84vh, 780px)`, `background:#0A0E11`, `border:1px solid rgba(255,255,255,.09)`, `border-radius:13px`, large soft drop shadow, `overflow:hidden`, flex column.

**Window structure (top → bottom):**
1. **Title bar** (`flex:0 0 auto`, padding `13px 16px`, gradient `#15191d → #0f1316`, bottom border `rgba(255,255,255,.07)`):
   - Three traffic-light dots, 12px circles, gap 8px: red `#ff5f57`, amber `#febc2e`, green `#28c840`.
   - Centered title text, 12.5px, `rgba(220,235,240,.55)`: `bas@headingfwd: ~/ai-engineering — zsh` (the "— zsh" segment hides on narrow screens).
   - Right label `HeadingFWD`, 11px, weight 700, letter-spacing `.16em`, accent color, opacity .85 (hidden on narrow screens).
2. **Body** (`flex:1`, `overflow-y:auto`, padding `26px clamp(18px,3cqw,34px) 22px`, text `#D6E6EA`, 14px, line-height 1.72, `cursor:text`; clicking it refocuses the input):
   - Prompt line, 12.5px, prompt-green: `bas@headingfwd:~$ ./hello --who`
   - **Wordmark**, `clamp(28px,7cqw,46px)`, weight 800, letter-spacing `-1.5px`, `#EAFBFE`: `Heading` + `FWD` in accent, followed by accent `››—›` (rendered as `&rsaquo;&rsaquo;&mdash;&rsaquo;`).
   - Subtitle, 13.5px, `rgba(214,230,234,.62)`: `AI engineering & consultancy · Bas Wenneker — AI Lead / Engineer`
   - Value prop, max-width 64ch: "I help teams get real value from **Generative AI** — designing and building **agents**, **assistants** and **AI workflows** that actually make it to production." (Generative AI in accent; agents/assistants/AI workflows in `#EAFBFE` weight 500.)
   - `// specialities` comment in `rgba(160,178,182,.7)`, then a responsive grid (`repeat(auto-fit,minmax(230px,1fr))`, collapses to 1 column narrow) of four items, each prefixed with an accent `*`:
     - Agentic workflow development
     - AI strategy & consultancy
     - Evaluation & testing
     - Assistants & copilots, production-ready
   - Tip line, `rgba(245,197,68,.9)`: `tip: type /help for commands · /portfolio to browse my work fullscreen · or just ask` (commands in accent, weight 700).
   - 1px divider `rgba(255,255,255,.08)`.
   - **Command feed** — appended output for each entered command (see "Commands" below).
   - **Input row**: prompt label `bas@headingfwd ~$` (the `bas@headingfwd ` part hides on narrow; `~$` accent), then a borderless transparent `<input>` filling the row, 14px, `#EAFBFE`, `caret-color` = accent, placeholder `type a command…` at `rgba(220,240,245,.32)`.
3. **Status bar** (`flex:0 0 auto`, padding `7px 16px`, `background:#0d1115`, top border `rgba(255,255,255,.07)`, 11px, `rgba(200,218,222,.5)`):
   - Pulsing dot (prompt-green with glow) + `online`, then `main`, `utf-8`, an **`agents.txt`** link (accent, with a small accent dot + glow), and right-aligned `<n> lines · /help`. The `agents.txt` link opens `/agents.txt` in a new tab (see "Agent-readable content" below).

### 2. Portfolio (fullscreen overlay — triggered by `/portfolio`)
**Purpose:** Browse selected work. Replaces the terminal with an absolutely-positioned full-bleed overlay (z-index above the window).

**Layout:** `position:absolute; inset:0`, padding `clamp(20px,4cqw,60px)`, `background: radial-gradient(...accent glow top...) , #07090B`, `color:#D6E6EA`, `overflow-y:auto`, `tabindex=0` (receives keyboard). Faint 42px grid overlay, radially masked.

**Top bar:** left `bas@headingfwd:~/portfolio` (prompt-green, `~/portfolio` in accent); right an `[ esc ] exit` button (transparent, 1px `rgba(255,255,255,.18)` border, radius 7px; hover → accent border + accent text).

**ASCII banner:** a `<pre>` in JetBrains Mono, accent color, `text-shadow:0 0 20px rgba(46,230,246,.38)`, `font-size:clamp(9px,2.3cqw,18px)`, line-height 1.05, `white-space:pre`. Banner art (block letters "FWD"):
```
██████  ██   ██  █████ 
██      ██   ██  ██  ██
█████   ██ █ ██  ██  ██
██      ███████  ██  ██
██      ██   ██  █████ 
```
Below it: `// selected work — AI engineering & product design` in `rgba(160,178,182,.78)`.

**List view** (`pfDetail === false`): top divider `rgba(255,255,255,.08)`, max-width 1040px. One row per project: grid `46px 1fr`, padding `18px clamp(14px,2.4cqw,24px)`, `cursor:pointer`. The **selected** row has a 2px **left border in accent** and background `rgba(255,255,255,.05)` (transition .15s); others transparent. Row content: index number (`01`–`04`, accent, weight 700, 15px); name (`clamp(17px,2.5cqw,23px)`, weight 500, `#EAFBFE`); kind line (13px, `rgba(170,188,192,.72)`); tags joined by `    ·    ` (11.5px, `rgba(120,140,144,.9)`). Bottom divider. Helper line below: `↑ ↓ navigate · ↵ open · or click a project · esc returns to terminal` in `rgba(245,197,68,.85)`.
- Hovering a row selects it (`pfIndex = i`); clicking a row opens its detail.

**Detail view** (`pfDetail === true`, max-width 800px): `← back to all work` text button (accent, hover underline); index + `<i> / <n>` counter; title `h2` `clamp(26px,4.6cqw,44px)` weight 700 letter-spacing `-.5px` `#EAFBFE`; kind subtitle in accent 15px; tag chips (12px, 1px `rgba(255,255,255,.16)` border, radius 999px, `rgba(214,230,234,.8)`); 1–2 body paragraphs (`#C6DCE1`, line-height 1.72, max-width 62ch); a **placeholder visual** box (`clamp(170px,26cqw,250px)` tall, 1px border radius 10px, 45° striped background, centered caption `[ project visual / case study — drop one in on request ]`) — replace with a real image/case study per project; then a button row: `← prev`, `next →` (outline style, hover → accent), and a solid accent `work with me →` CTA linking to `mailto:bas@headingfwd.com`.

---

## Commands (terminal feed output)
Typed text is parsed by stripping a leading `/`, lowercasing, taking the first whitespace-token. Each command echoes the typed line (`bas@headingfwd ~$ <raw>`) then prints output, then a blank spacer. Unknown input → a short "lightweight demo assistant" fallback that points to `/help` and the email. Output line styles: `head` (accent, weight 700), `out` (`#CFE2E7`), `dim` (`rgba(160,178,182,.6)`), `bullet` (accent `*` + text), `row` (accent label min-width 96px + description), `job` (accent number + white name + dimmed `— desc`), `link` (dim label + underlined accent anchor).

- **`/help`** — lists every command with a one-line description (`row` style): `/about`, `/services`, `/work`, `/portfolio` (`browse my work in fullscreen ↵`), `/stack`, `/contact`, `/agents` (`plain-text source for AI agents`), `/clear`; plus a dim history tip.
- **`/about`** — `$ whoami`: "Bas Wenneker — AI Lead / Engineer @ HeadingFWD", then 15+ yrs shipping software, 5+ yrs coaching 60+ product & innovation teams, balancing business/customer/tech to take GenAI from demo to production.
- **`/services`** — `// what I help teams with`, four bullets: Agentic workflow development; AI strategy & consultancy; Evaluation & testing; Assistants & copilots (production-ready).
- **`/work`** — `selected engagements`, four `job` rows (01–04) mirroring the portfolio projects (short form).
- **`/stack`** — `// stack`: "LLMs · agents · RAG · evals · prompt + context engineering" / "Python · TypeScript · React · Ruby on Rails · Docker" / "Lean Startup · Design Thinking · Service Design · Scrum".
- **`/contact`** — `let's talk →`, link rows: email → `mailto:bas@headingfwd.com`; linkedin → `https://www.linkedin.com/in/baswenneker`; dim "fastest reply: drop me a DM on LinkedIn."
- **`/portfolio`** (alias `/pf`) — echoes "→ launching portfolio…" then switches `mode` to `"portfolio"`.
- **`/agents`** (alias `/llms`) — points visitors (and AI agents) to the plain-text source: a `head` line, a short note, and a `link` row `file → agents.txt`.
- **`/clear`** (alias `/cls`) — empties the feed.
- Aliases also present: `/whoami`, `/ls`.

---

## Agent-readable content (`agents.txt`)
**Purpose:** expose every piece of site content to AI agents and crawlers as a single, plain-text, machine-readable file — so an agent can read the source directly instead of scraping the interactive terminal UI.

**What ships:** `agents.txt` (included in this bundle) — a Markdown/UTF-8 document containing About, Specialities, Tech stack, all four Portfolio cases (full descriptions + tags), and Contact. It opens with a short header telling agents this is the canonical source.

**How it's exposed in the rebuild:**
- Serve the file at the site root so the URL is **`https://headingfwd.com/agents.txt`** (in Next.js: place it in `/public/agents.txt`).
- The status-bar **`agents.txt` link** and the terminal **`/agents`** command both point at that URL.
- **Keep it in sync with the site content.** Treat `agents.txt` as generated from the same source data as the terminal commands and portfolio (the static project array + about/services/stack/contact copy). Ideally generate it at build time from one shared content module so it never drifts from the UI. Don't hand-maintain two copies.
- Recommended (optional) extras: also expose it as **`/llms.txt`** (the emerging convention) — either a copy or a redirect — and reference it from `robots.txt`.

## Interactions & Behavior
- **Input submit:** Enter runs the command, clears input, unshifts raw into `history` (cap 40).
- **History recall:** ArrowUp / ArrowDown in the input walk `history` (index −1 = empty).
- **Auto-focus:** input focuses ~650ms after mount; clicking the body refocuses it.
- **Auto-scroll:** after each command the body scrolls to bottom.
- **Portfolio keyboard** (overlay focused): list view — ↑/↓ move selection (wraps), ↵ opens detail, Esc exits to terminal; detail view — ←/→ switch project (wraps), Esc/Backspace back to list.
- **Status line count** = 18 (intro lines) + feed length.
- **No entrance animations** — render content at full opacity immediately (the reference deliberately removed fade-in transitions; don't reintroduce opacity-0 starting states that could get stuck).

## State Management
- `input: string`, `history: string[]`, `historyIndex: number`
- `feed: OutputLine[]` — each line a small tagged object `{ kind, ...payload }` rendered by a switch (mirror the reference's `el()` method)
- `mode: "terminal" | "portfolio"`
- `pfIndex: number` (0-based selected project), `pfDetail: boolean`
- Projects are static data (4 entries — name, kind, tags[], detail[] paragraphs). No data fetching.

## Design Tokens
**Theme (default "Cyan"):** accent `#2EE6F6`, backdrop `#0BD3E6`, prompt-green `#5BE6A0`.
Alternate themes in the reference (optional — wire as a prop/toggle if desired):
- Matrix: accent `#3CF08A`, backdrop `#04150D`, prompt `#3CF08A`
- Amber: accent `#F5B544`, backdrop `#160F05`, prompt `#F5B544`

**Surfaces:** window `#0A0E11`; title bar gradient `#15191d → #0f1316`; status bar `#0d1115`; portfolio bg `#07090B`. Traffic lights `#ff5f57` / `#febc2e` / `#28c840`.
**Text:** primary body `#D6E6EA`; bright `#EAFBFE`; out `#CFE2E7` / `#C6DCE1`; muted `rgba(160,178,182,.6–.78)`; faint `rgba(120,140,144,.9)`; tip yellow `rgba(245,197,68,.85–.9)`.
**Borders:** hairlines `rgba(255,255,255,.07–.18)`. **Radius:** window 13px, buttons 7–10px, chips/pills 999px.
**Backdrop gradients:** `radial-gradient(120% 130% at 50% 0%, rgba(255,255,255,.18), transparent 42%)` + `radial-gradient(140% 120% at 50% 120%, rgba(0,0,0,.32), transparent 55%)` over the backdrop color. Grid: 38px (terminal) / 42px (portfolio) white 1px lines at ~6% opacity, radial-masked.
**Window shadow:** `0 1px 0 rgba(255,255,255,.07) inset, 0 40px 90px -20px rgba(0,0,0,.6), 0 0 0 1px rgba(0,0,0,.25)`.
**Type:** JetBrains Mono everywhere. Body 14px / line-height 1.72. Wordmark 800. See per-element sizes above (most use `clamp()` for fluid scaling — keep them).
**Responsive:** the reference uses CSS **container queries** (`container-type:inline-size` on the page, breakpoint `max-width:560px`). In Next.js use Tailwind container queries or normal media queries — collapse the specialities grid to one column, full-height window with smaller radius, shorten the title bar and prompt, hide the right-hand `HeadingFWD` label.

## Assets
None. The only graphic is the ASCII "FWD" banner (plain text, included above). Per-project visuals are currently **placeholders** — Bas will supply real images/case-study links to drop into the detail view's visual box and to replace the `mailto` CTA target if individual case-study pages are added.

## Files
- `HeadingFWD.reference.html` — the full interactive design reference (template markup + `Component` logic class). Source of truth for any measurement or copy not spelled out above. Open it in a browser to see live behavior.
- `agents.txt` — the plain-text, agent-readable copy of all site content (see "Agent-readable content" above). Ship at `/public/agents.txt`.
- `claude-code-prompt.md` — a ready-to-paste prompt for kicking off the rebuild in Claude Code.
