# Milestone M2 — AI-chat in de shell — walkthrough

## In één oogopslag
Vrije tekst gaat nu naar de bestaande AI-backend, achter een uitgestelde CAPTCHA, en het
antwoord streamt als markdown in dezelfde chronologische terminal-feed. De e-mail-tool toont
preview → bevestiging → versturen, met een nette verzendmelding en een rate-limit-melding.
De backend is volledig ongewijzigd hergebruikt. Alle vijf criteria zijn groen: gates 3/3,
scrutiny 2/2, user-test 3/3.

## Hoe te lezen / zelf bekijken
1. `pnpm dev` → `http://localhost:3000`.
2. Typ een slash-command (werkt direct, geen CAPTCHA).
3. Typ vrije tekst → in productie verschijnt de CAPTCHA-overlay; na verificatie streamt het
   AI-antwoord. (In dev staat `NEXT_PUBLIC_DISABLE_CAPTCHA=true`, dus de overlay wordt
   overgeslagen; voor de overlay zelf: tijdelijke `.env.local` met Cloudflare-testsleutels +
   `.next` legen.)
4. Vraag de AI om een bericht te sturen → preview → "yes" → verzonden.

## Wat is gebouwd, per feature

**F5 — Uitgestelde CAPTCHA en AI-streaming.** Vrije tekst wordt vastgehouden tot er een sessie
is; de overlay verschijnt bij het eerste bericht, en na verificatie (tRPC `initSession`) gaat
het bericht alsnog via `useChat` naar `/api/chat`. Het antwoord streamt als markdown in de
body-stijl, met "Thinking…" en een knipperende cursor; fouten in terminal-rood.
*Waarom:* de AI-chat moet veilig en zichtbaar in de nieuwe terminal leven zonder de backend te
wijzigen. Key files: `terminal.tsx`, `captcha-overlay.tsx`, `memoized-markdown.tsx`.
Zelf checken: vrije tekst → AI-antwoord; geen AI-request vóór een geldige sessie.

**F6 — E-mail-tool preview, bevestiging en versturen.** De `sendMessage`-tool-uitkomst rendert
nu als terminal-statusregel: "✉ sending…" → "✓ message sent" (groen), of de fout/rate-limit in
rood. De preview en bevestiging blijven AI-tekst.
*Waarom:* de bezoeker moet duidelijk zien dat (en of) zijn bericht verzonden is — vooral de
rate-limit. Key files: `terminal.tsx`, `terminal.module.css`.
Zelf checken: stuur een bericht → "✓ message sent"; bij de 4e binnen een uur → rate-limit-melding.

## Validatie
- **Gates:** typecheck, lint, build — alle exit 0.
- **Scrutiny (VC-12/13):** backend onaangeroerd, geen secrets in client, geen AI-request vóór
  een sessie, comment-hygiëne — alle PASS. Zie `M2-review.md`.
- **User-test (VC-9/10/11):** uitgestelde CAPTCHA (overlay live getest met Cloudflare-
  testsleutels), AI-streaming + Thinking + cursor + fout, en de e-mail-flow (preview/verzonden/
  rate-limit) — alle PASS, met gemockte AI/e-mail (geen echte mail). Zie `M2-usertest.md`.

## Advisories (niet-blokkerend)
- Het AI-turn-renderblok in `terminal.tsx` is lang; een apart `<AiTurn>`-component zou
  `Terminal()` leesbaarder maken.
- De `part as unknown as {...}` double-cast voor het `sendMessage`-tool-part kan naar een
  kleine getypeerde helper.

## Aandachtspunt (dev)
Turbopack inlinet `NEXT_PUBLIC_`-waarden op compile-tijd; een wijziging in `.env.local` vereist
een `.next`-clear voordat de dev-server hem oppakt.
