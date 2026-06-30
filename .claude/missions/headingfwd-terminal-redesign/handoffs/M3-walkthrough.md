# Milestone M3 — Tests en opruimen — walkthrough

## In één oogopslag
De e2e-suite is volledig herschreven naar de nieuwe terminal-UI en slaagt (27 tests), en alle
dode code van vóór de redesign is verwijderd. `pnpm check` en `pnpm build` zijn groen. Alle drie
criteria zijn groen: gates 3/3, scrutiny 2/2, user-test 1/1.

## Hoe te lezen / zelf bekijken
1. `pnpm test:e2e` → 27 tests slagen (commands, AI-stream, e-mail, rate-limiting, mobiel).
2. `pnpm check` en `pnpm build` → groen.
3. `git diff` van deze milestone: de oude chat-UI en de server-side command-laag zijn weg.

## Wat is gebouwd, per feature

**F7 — Playwright-suite herschreven.** De helpers, fixtures en specs zijn omgezet naar de nieuwe
UI: client-statische commands (assert op de feed-tekst, geen netwerk), de gemockte AI-stream in
het AI-SDK-v6-formaat, de e-mail-flow (✓ verzonden + rate-limit) en twee mobiele 375px-tests.
`api-mocks.ts` produceert nu het v6 UI-message-stream-formaat; `playwright.config.ts` maakt de
test-DB-map aan vóór de server start.
*Waarom:* de tests moeten het nieuwe gedrag dekken en betrouwbaar (gemockt) slagen.
Zelf checken: `pnpm test:e2e` → 27 passed.

**F8 — Dode code verwijderd.** De oude `chat-terminal.tsx`, `code-block.tsx`, de server-side
`/api/commands`-route, `command-executor.ts` en `config/commands.ts` zijn weg (de hele keten was
dood na de redesign), plus drie ongebruikte test-bestanden.
*Waarom:* geen verwarrende dode code achterlaten; commands zijn nu client-statisch.
Zelf checken: `pnpm check` + `pnpm build` groen; de route-tabel toont geen `/api/commands` meer.

## Validatie
- **Gates:** typecheck, lint, build — alle exit 0.
- **Scrutiny (VC-15/16):** dode code weg zonder resterende verwijzingen, nog-gebruikte bestanden
  intact, check/build groen, comment-hygiëne — alle PASS. Zie `M3-review.md`.
- **User-test (VC-14):** `pnpm test:e2e` → 27 passed. Zie `M3-usertest.md`.

## Aandachtspunt
`CLAUDE.md` beschrijft nog de oude architectuur (server-side commands via `/api/commands`); een
docs-update is wenselijk maar viel buiten het validatiecontract — zie de rule-kandidaten in het
mission-eindrapport.
