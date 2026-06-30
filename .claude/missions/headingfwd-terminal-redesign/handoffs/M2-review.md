# M2 — Scrutiny-review

Adversariële code-review (verse context, alleen de diff) van de twee scrutiny-criteria.
Uitkomst: **beide PASS.**

De milestone-diff raakt alleen client-componenten onder `src/app/_components` (terminal.tsx,
captcha-overlay.tsx, memoized-markdown.tsx, terminal-feed.tsx en CSS). Geen backend-bestand is
gewijzigd: de name-only diff en een gerichte grep bevestigen dat er niets onder `src/app/api`,
`src/server`, de tRPC-routers of het db-schema is aangeraakt.

| VC | Oordeel | Bewijs (samengevat) |
|----|---------|---------------------|
| VC-12 (backend-hergebruik, veiligheid) | ✅ PASS | (1) Backend onaangeroerd — diff bevat alleen `.claude`-handoffs en `src/app/_components/*`. (2) Hergebruik: `api.chat.initSession.useMutation()` + `useChat` met `DefaultChatTransport({api:"/api/chat"})` — de bestaande endpoints, niet herbouwd. (3) Geen secrets in client: alleen `NEXT_PUBLIC_DISABLE_CAPTCHA` en `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (beide publieke `NEXT_PUBLIC_`-waarden, geregistreerd onder `client:` in env.js); geen OpenAI/Resend/Turnstile-SECRET. (4) Sessie-guard: vrije tekst wordt vastgehouden in `pendingMessageRef`; `initSession` draait eerst; de enige AI-aanroep `dispatchAiMessage` is bewaakt met `if (!sessionIdRef.current) return;` en de transport-`body()` leest de sessie op request-tijd. Geen AI-request vóór een geldige sessie. |
| VC-13 (comment-hygiëne) | ✅ PASS | Grep op de gewijzigde productbestanden naar VC-/F#/M#/milestone/pre-F/mission gaf één treffer: "sub**mission**" (vals-positief). De `feat/fix`-commit messages zijn zelfstandig leesbare changelog-prose; de `chore/docs(mission)`-commits vallen buiten scope. |

## Advisories (niet-blokkerend)
- `terminal.tsx` — het AI-turn-renderblok is lang en mengt drie zorgen (turn-index-mapping,
  streaming-state-afleiding, tool/markdown-rendering). Een apart `<AiTurn>`-component zou
  `Terminal()` leesbaarder maken.
- `terminal.tsx` — de `part as unknown as {...}` double-cast voor het `sendMessage`-tool-part
  kan naar een kleine getypeerde helper (bijv. `asSendMessagePart`) zodat de JSX op renderen
  gericht blijft.
