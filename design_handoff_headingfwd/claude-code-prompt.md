# Paste this into Claude Code (run from your Next.js project root)

I'm rebuilding my site, headingfwd.com, to match a finished HTML design reference.

In `design_handoff_headingfwd/` you'll find:
- `README.md` — a complete spec: every screen, component, color, font size, interaction, and the exact copy.
- `HeadingFWD.reference.html` — the working prototype. Open/skim it for anything the README doesn't spell out. It's built on a custom template runtime (`<x-dc>`, `{{ }}`, `<sc-for>`, a `Component extends DCLogic` class) — **do not port that runtime**; translate its logic into idiomatic React.

## What I want you to do
1. Read `design_handoff_headingfwd/README.md` in full, then skim the reference HTML.
2. First tell me what you found about my existing setup: which styling solution I use (Tailwind / CSS Modules / etc.), my App-vs-Pages router, and where the homepage lives. Propose where the new components should go. Wait for my OK before writing code.
3. Then rebuild the design **high-fidelity** in my existing stack:
   - A `"use client"` terminal component as the homepage, with React state for the command feed, input, command history (↑/↓ recall), and auto-focus/auto-scroll.
   - All slash-commands from the README (`/help`, `/about`, `/services`, `/work`, `/stack`, `/contact`, `/portfolio`, `/agents`, `/clear`, plus aliases) with the exact copy and output styling.
   - The fullscreen `/portfolio` overlay: ASCII "FWD" banner, keyboard-navigable project list (↑/↓/↵/esc), and per-project detail views (←/→ to switch, esc back).
   - Load **JetBrains Mono** via `next/font/google`.
   - **Agent-readable content:** ship `agents.txt` at `/public/agents.txt` so it serves from `https://headingfwd.com/agents.txt`. Wire the status-bar `agents.txt` link and the `/agents` command (alias `/llms`) to it. Generate `agents.txt` at build time from the same shared content module that feeds the terminal commands and portfolio, so it never drifts — don't hand-maintain a second copy. Optionally also expose it as `/llms.txt` and reference it in `robots.txt`. See "Agent-readable content" in the README.
   - Match colors, sizes, shadows, and the container-query responsive behavior from the README's Design Tokens.
4. Keep the project visuals as placeholders for now — I'll supply real images/case-study links after.

Match the reference pixel-for-pixel where the README gives exact values, but use my codebase's conventions for file layout, styling, and component structure. Ask me before introducing any new dependency.
