# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A terminal-style chatbot website for HeadingFWD (AI engineering consultancy), built with Next.js 15, featuring an AI assistant powered by OpenAI that answers questions about services, experience, and allows visitors to send contact messages.

**Tech Stack:** Next.js 15 (App Router), TypeScript, tRPC, Drizzle ORM, Vercel AI SDK, Cloudflare Turnstile, Turso/SQLite, Playwright

## Common Commands

### Development

```bash
pnpm dev              # Start dev server on port 3000 (with Turbo)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm check            # Run linter + type checking
pnpm typecheck        # Type check only (tsc --noEmit)
```

### Code Quality

```bash
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix linting issues automatically
pnpm format:check     # Check formatting with Prettier
pnpm format:write     # Auto-format with Prettier
```

### Database Operations

```bash
pnpm db:push          # Push schema changes to database (use in development)
pnpm db:generate      # Generate migration files from schema
pnpm db:migrate       # Apply migrations (manual, not needed in production)
pnpm db:studio        # Open Drizzle Studio (visual database browser)
```

**Important:** In development, automatic migrations are disabled. Use `pnpm db:push` for fast iteration. In production, migrations run automatically on server startup via `src/instrumentation.ts`.

### Testing

```bash
pnpm test:e2e         # Run E2E tests with Playwright
pnpm test:e2e:ui      # Run tests with Playwright UI
pnpm test:e2e:headed  # Run tests in headed mode (visible browser)
pnpm test:e2e:debug   # Debug tests with Playwright inspector
```

Tests run on port 3099 with CAPTCHA disabled. Tests are sequential (workers: 1) to avoid SQLite locking issues.

### Deployment

```bash
pnpm run deploy       # Merge main→production and push (triggers Vercel deployment)
```

## Architecture

### Application Flow

1. **Session Initialization (CAPTCHA Gate)**
   - User visits site → sees Terminal UI
   - On first interaction → Cloudflare Turnstile CAPTCHA overlay appears
   - CAPTCHA solved → tRPC `chat.initSession` creates verified session in DB
   - Session valid for 30 minutes

2. **Slash Commands (Instant Responses)**
   - User types `/help`, `/services`, `/contact`, etc.
   - Frontend calls `/api/commands/[command]` API route
   - `src/server/services/command-executor.ts` executes command server-side
   - Returns markdown response immediately (no LLM involved)
   - Commands defined in `src/config/commands.ts` registry

3. **Natural Language Chat (AI Responses)**
   - User types natural language message
   - Frontend uses Vercel AI SDK `useChat` hook
   - Calls `/api/chat` route with streaming enabled
   - OpenAI GPT-4.1-mini generates response with tool calling capability
   - AI can call `sendMessage` tool to send email via Resend
   - Rate limiting enforced per session (MESSAGE_RATE_LIMIT per minute)

### Key Architecture Decisions

**Dual Command System:**

- **Slash commands** (`/help`, `/services`, etc.) → instant server-side responses, no LLM
- **Natural chat** → streams through OpenAI with tool calling
- Rationale: Fast responses for common queries, AI for complex interactions

**Database Strategy:**

- **Development:** Local SQLite file (`./db.sqlite`), no auto-migrations
- **Production:** Turso (distributed SQLite), auto-migrations on startup
- Schema: `chatSessions`, `chatMessages`, `rateLimitLogs`, `emailLogs`

**Rate Limiting:**

- Message rate limit per session (configured via `MESSAGE_RATE_LIMIT` env var)
- Email sending: 3 emails per hour per session
- Tracked in `rateLimitLogs` table with periodic cleanup

**CAPTCHA Flow:**

- Cloudflare Turnstile verifies human users before session creation
- Can be disabled in dev/test with `NEXT_PUBLIC_DISABLE_CAPTCHA=true`
- Token verified server-side via `verifyTurnstileToken` in tRPC mutation

### Project Structure

```
content/
└── blog/                     # Blog posts — one Markdown file per post
public/
├── blog/<slug>/              # Images belonging to one post
└── portfolio/<slug>/         # Images belonging to one case
docs/
└── adr/                      # Architecture decision records
src/
├── app/
│   ├── layout.tsx            # Root layout: html/body, font, JSON-LD, analytics
│   ├── (terminal)/           # Route group: everything that runs the terminal
│   │   ├── layout.tsx        # TRPCReactProvider lives here, not in the root
│   │   ├── page.tsx          # Homepage
│   │   └── [command]/        # /help, /about, … deep links
│   ├── (editorial)/          # Route group: no tRPC, no terminal bundle
│   │   ├── layout.tsx        # data-editorial-root wrapper
│   │   ├── editorial.module.css  # Shared reading layout (shell, body, list)
│   │   ├── blog.module.css   # Blog-only: draft banner, origin footer
│   │   ├── portfolio.module.css  # Case-only: kind, meta, tags, footer
│   │   ├── blog/             # /blog, /blog/<slug>, /blog/rss.xml
│   │   └── portfolio/        # /portfolio, /portfolio/<slug>
│   ├── _components/          # React components
│   │   ├── terminal.tsx      # Main terminal container
│   │   ├── terminal-commands.ts  # Command registry & feed line model
│   │   ├── video-previews.tsx    # Click-to-play case videos (client)
│   │   ├── post-body.tsx     # Markdown → editorial layout (posts and cases)
│   │   └── captcha-overlay.tsx
│   ├── api/
│   │   ├── chat/route.ts     # AI streaming endpoint (Vercel AI SDK)
│   │   └── health/route.ts   # Health check endpoint
│   ├── llms.txt/route.ts     # Plain-text source for agents
│   ├── sitemap.ts
│   └── not-found.tsx
├── content/
│   ├── cases.ts              # Portfolio cases (source of truth)
│   ├── posts.ts              # Blog post loader, validation & visibility
│   ├── site-content.ts       # About, specialities, stack, contact
│   └── blog/                 # Post rendering: remark plugin, charts, assets
├── server/
│   ├── api/
│   │   ├── routers/
│   │   │   └── chat.ts       # tRPC chat router (session init)
│   │   ├── root.ts           # tRPC app router
│   │   └── trpc.ts           # tRPC context & middleware
│   ├── db/
│   │   ├── index.ts          # Database client (Drizzle)
│   │   └── schema.ts         # Database schema (SQLite tables)
│   └── services/
│       ├── command-executor.ts    # Slash command handlers
│       ├── email.ts               # Resend email integration
│       ├── rate-limiter.ts        # Rate limiting logic
│       └── turnstile.ts           # CAPTCHA verification
├── trpc/
│   ├── react.tsx             # tRPC React provider
│   └── server.ts             # Server-side tRPC caller
├── lib/
│   └── errors.ts             # Error handling utilities
└── instrumentation.ts        # Next.js startup hook (runs migrations)
```

### Important Files

- **`src/app/api/chat/route.ts`** - Main AI chat endpoint, uses Vercel AI SDK's `streamText`, includes `sendMessage` tool for email sending
- **`src/server/services/command-executor.ts`** - All slash command handlers, returns markdown
- **`src/app/_components/terminal-commands.ts`** - Command registry (add new commands here) and the `COMMAND_PAGES` list that drives the deep-link routes and the sitemap. `/portfolio` and `/blog` are absent from it on purpose: both have a real route under `src/app/(editorial)/`
- **`src/content/cases.ts`** - Portfolio cases: the single source of truth for the `/portfolio` overview, the case pages, `/llms.txt` and the generated `cases/*.md` archive
- **`src/app/_components/post-body.tsx`** - Renders one Markdown body through the remark pipeline. Used by both a post and a case; takes `{ markdown, assetBase, lang }`
- **`src/content/posts.ts`** - Blog post loader: frontmatter schema, the `isPublished` predicate and the date formatting. Every blog surface derives from it
- **`src/content/blog/remark-post-structure.ts`** - Turns a post's Markdown into the editorial layout (roman-numeral sections, numbered two-column items, charts, figures)
- **`src/server/db/schema.ts`** - Database schema (modify tables here, then run `pnpm db:push`)
- **`src/instrumentation.ts`** - Runs automatic migrations in production on server startup
- **`src/server/services/rate-limiter.ts`** - Rate limiting implementation with database logging
- **`src/server/services/email.ts`** - Email sending via Resend with conversation history

### Adding New Slash Commands

1. Add command definition to `src/config/commands.ts` in `COMMAND_REGISTRY`
2. If dynamic response, add handler function to `commandHandlers` in `src/server/services/command-executor.ts`
3. Command automatically available via `/api/commands/[command]` route

### Adding a Blog Post

1. Add one Markdown file to `content/blog/`. The filename is the slug unless frontmatter overrides it
2. Required frontmatter: `title`, `date`, `lang` (`nl` or `en`), `excerpt`. Optional: `slug`, `updated`, `kicker`, `tags`, `draft`, `image`
3. Drop any images in `public/blog/<slug>/` and reference them by filename
4. `content/blog/post-template.md` is the reference: a permanent draft showing every supported element

Sections (`##`) and items (`###`) are numbered automatically — never type the numbers. `CONTEXT.md` defines the vocabulary (kicker, lead, excerpt, item, section) and the visibility rules; `docs/adr/` records why posts are Markdown, why the blog sits outside the terminal, and why the portfolio moved onto the same layout.

Drafts and future-dated posts are withheld from every public surface. Outside production (`ENVIRONMENT` is `development` or `test`) a draft is previewable with a banner and `noindex`; a future-dated post is never previewable.

### Adding a Portfolio Case

1. Append an entry to `CASES` in `src/content/cases.ts` with a unique slug, the next `n` index, a one-line `kind`, the metadata fields and the write-up as a Markdown string in `body`
2. The body follows the post vocabulary: the text before the first `##` is the lead, a `##` is a numbered section, a `###` a numbered item. Never open a body with a heading
3. Drop any images in `public/portfolio/<slug>/` and reference them by filename
4. Run `pnpm gen:cases` to re-emit the `cases/*.md` archive — never hand-edit those files

### AI System Prompt

The AI assistant (in `/api/chat/route.ts`) has a detailed system prompt that:

- Restricts responses to Bas's professional background and AI engineering services
- Includes instructions for email sending flow (preview → confirmation → send)
- Provides LinkedIn profile suggestion logic
- Defines tool calling rules for the `sendMessage` tool

When modifying AI behavior, update the system prompt string in `src/app/api/chat/route.ts:166-243`.

### Environment Variables

See `.env.example` for all required variables. Key ones:

- `DATABASE_URL` - SQLite file path (dev) or Turso URL (prod)
- `TURSO_AUTH_TOKEN` - Required for Turso in production
- `OPENAI_API_KEY` - Required for AI chat
- `RESEND_API_KEY` - Required for email sending
- `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - Cloudflare CAPTCHA
- `MESSAGE_RATE_LIMIT` - Messages per minute (default: 10)
- `ENVIRONMENT` - `development` | `test` | `production`. Distinct from `NODE_ENV`. Outside production, blog drafts are previewable. Unset means production, so it fails closed and Vercel needs no new variable

### Testing Notes

- E2E tests in `tests/e2e/` use Playwright
- Tests run on port 3099 with CAPTCHA disabled
- Global setup/teardown handles test database
- Tests are sequential to avoid SQLite locking
- Test fixtures in `tests/fixtures/` for mock data

### LangSmith Observability

Optional LangSmith tracing for AI requests:

- Set `LANGSMITH_TRACING=true` to enable
- Requires `LANGSMITH_API_KEY` and `LANGSMITH_PROJECT`
- Automatically traces all AI SDK calls to LangSmith

## Deployment

- **Platform:** Vercel
- **Branch Strategy:** `main` (development) → `production` (triggers deployment)
- **Database:** Turso (production), local SQLite (development)
- Migrations run automatically on production startup via instrumentation hook
- Health check endpoint at `/api/health` for monitoring

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
