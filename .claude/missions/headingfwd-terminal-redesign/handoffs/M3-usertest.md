# M3 — User-test

VC-14 is "wanneer `pnpm test:e2e` draait, slaagt de herschreven suite tegen de nieuwe UI". Dit
is geverifieerd door de suite zelf te draaien. Uitkomst: **PASS.**

| VC | Oordeel | Bewijs |
|----|---------|--------|
| VC-14 (e2e-suite) | ✅ PASS | `pnpm test:e2e` door de orchestrator gedraaid: **27 passed (31.6s)**, 1 worker, sequentieel. De suite dekt: client-statische commands (/help, /about, /services, /work, /stack, /contact, /clear, aliassen, history-recall), de gemockte AI-stream (markdown + assistant-message + loading-indicator weg), de e-mail-flow (✓ verzonden + rate-limit als leesbare terminal-fout, geen JSON), rate-limiting (429-pad), en twee mobiele 375px-viewport-tests (geen horizontale overflow, command werkt). Alle externe calls (AI, e-mail) zijn gemockt met het AI-SDK-v6-streamformaat; geen echte OpenAI/Resend-call. |

## Noot
De e2e-suite boot zijn eigen dev-server op poort 3099 met `NEXT_PUBLIC_DISABLE_CAPTCHA=true`
en een schone SQLite-test-DB (aangemaakt door `playwright.config.ts` vóór de server start).
