# Mission: HeadingFWD terminal-redesign — pixel-exacte terminal-portfolio

## In één oogopslag

We vervangen de UI-laag van headingfwd.com door de finale, hifi-referentie: een macOS-terminal op een cyaan achtergrond met slash-commands en een fullscreen portfolio-browser. De hele backend (tRPC, Turso-database, Resend-e-mail, rate-limiting, het AI-chat-endpoint) blijft ongewijzigd en wordt hergebruikt. Vrije tekst gaat nog steeds naar de bestaande AI-chat; de CAPTCHA verschijnt pas bij het eerste AI-bericht, zodat slash-commands direct werken. De terminal moet er ook op mobiel netjes uitzien en daar volledig met tikken bedienbaar zijn. Portfolio-cases worden later aangeleverd in één eenvoudig, gedocumenteerd dataformat.

## Problem Statement

De live UI wijkt sterk af van het goedgekeurde hifi-ontwerp.

- De huidige homepage is donkergrijs met een fieldset en twee kolommen; het ontwerp is een cyaan terminal met een banner, slash-commands en een portfolio-overlay.
- De huidige CAPTCHA-gate blokkeert élke interactie; in het ontwerp werken content en commands meteen.
- Er is geen nette mobiele weergave gespecificeerd in de huidige UI.
- Er is geen eenvoudige manier om portfolio-cases later aan te leveren zonder componentcode aan te raken.

## Goals and Success Metrics

**Primary goal**: de referentie pixel-exact neerzetten in de bestaande Next.js-stack, met behoud van de werkende AI- en contactfunctionaliteit, en netjes bruikbaar op mobiel.

**Success metrics**:
- Visuele weergave komt 1:1 overeen met de Design Tokens uit het ontwerp (kleuren, clamp-maten, schaduwen, radius, container-query-gedrag).
- Alle slash-commands en de portfolio-overlay werken keyboard-first met de exacte copy uit het ontwerp.
- Vrije tekst levert een streamend AI-antwoord op achter een uitgestelde CAPTCHA; de e-mail-tool werkt end-to-end.
- Op een telefoonbreedte (±320–430px) is er geen horizontale overflow of afgekapte tekst, en is de portfolio volledig met tikken te bedienen.
- `pnpm check` en `pnpm build` slagen; de Playwright-suite is herschreven en groen.

## Acceptance Criteria

Observeerbare, toetsbare uitkomsten. Deze voeden het validatiecontract.

- De terminal toont bij laden direct de intro (banner, wordmark "HeadingFWD ››—›", subtitle, value-prop, vier specialities, tip, statusbalk) zonder fade-in; de input krijgt focus.
- De Design Tokens zijn exact overgenomen: accent `#2EE6F6`, backdrop `#0BD3E6`, prompt-groen `#5BE6A0`, window `#0A0E11`, radius 13px, de drielaagse window-schaduw, en de clamp-gebaseerde maten.
- Elke command echo't de getypte regel en print de exacte output in de juiste regelstijl (head, out, dim, bullet, row, job, link); `/clear` leegt de feed; `↑`/`↓` halen history terug; klikken in de body herfocust de input.
- `/portfolio` opent de fullscreen overlay met de ASCII-"FWD"-banner en vier projecten; navigatie met `↑`/`↓`/`↵`/`esc` én met muis/tik; detailweergave met `←`/`→` en `esc`/`backspace`; placeholder-visual en CTA aanwezig.
- Portfolio-cases staan in één gedocumenteerd databestand met een heldere vorm en een invul-template; optionele velden voor een afbeelding en een case-link worden in de detailweergave getoond zodra ze gevuld zijn — zonder componentcode te wijzigen.
- Op een mobiele viewport (375px) ziet de terminal en de portfolio er netjes uit en is alles volledig met tikken bedienbaar, zonder toetsenbord.
- Onder de 560px volgt de layout de referentie-breakpoints: specialities naar één kolom, window op volle hoogte met kleinere radius, ingekorte titelbalk en prompt, het rechter merklabel verborgen.
- Een slash-command werkt zonder CAPTCHA; het eerste vrije-tekst bericht toont de (opnieuw vormgegeven) CAPTCHA-overlay en wordt na verificatie alsnog naar de AI gestuurd.
- Vrije tekst streamt een AI-antwoord als markdown in de body-tekststijl, met een "Thinking…"-indicator en een knipperende cursor; fouten verschijnen in terminalstijl.
- De e-mail-flow werkt end-to-end: de AI toont een nette preview, vraagt bevestiging en verstuurt na akkoord via de bestaande tool; bij overschrijding verschijnt de rate-limit-melding.
- De Playwright-suite is herschreven tegen de nieuwe UI (inclusief een mobiele viewport-test) en slaagt; dode code is verwijderd.

## Strategy & Design Budget

We bouwen de referentie na met een CSS Module plus CSS custom properties (`--accent`, `--backdrop`, `--prompt`) voor de exacte waarden en eenvoudige latere thema's. De body rendert één chronologische feed: slash-commands duwen statische, getypeerde regelobjecten in de feed (instant, geen sessie), en vrije-tekst-beurten verlopen via de bestaande AI-chat. We hergebruiken `useChat`, `MemoizedMarkdown`, de tRPC-mutatie `chat.initSession`, de turnstile-service, de e-mail-service en de rate-limiter — de backend verandert niet. De CAPTCHA-overlay wordt uitgesteld: bij het eerste vrije-tekst bericht onthouden we de invoer, tonen de overlay, maken een sessie aan en versturen daarna alsnog. Voor mobiel zorgen we voor tik-bediening van de portfolio, nette tap-targets en gedrag dat het toetsenbord niet ongevraagd opduwt. De features draaien serieel in deze volgorde; elke feature erft de vorige via git.

**Toegestane nieuwe dependencies (limitatief — niets buiten deze lijst is toegestaan):**
- Geen. JetBrains Mono komt via `next/font/google` (bestaand mechanisme); CSS Modules zijn native in Next.js.

**Toegestane nieuwe abstracties (limitatief — niets buiten deze lijst is toegestaan):**
- Een getypeerd feed-regelmodel met bijbehorende renderer (de regelstijlen uit het ontwerp).
- Een gedocumenteerd portfolio-dataformat met optionele afbeelding- en case-link-velden.
- Een uitgestelde-CAPTCHA-flow die een vrije-tekst bericht vasthoudt tot er een geldige sessie is.

**Geldende regelbestanden:**
- Geen `.claude/rules/` aanwezig — bewust gestart zonder regels. De Design Tokens en de comment-norm uit CONTEXT.md fungeren als de feitelijke standaard.

Het overschrijden van dit design budget laat een review zakken.

## File-by-file

| File | Change | Reason |
|------|--------|--------|
| `src/app/_components/terminal.tsx` | modified | Volledige herschrijving: shell, feed, input, history, mode, AI-wiring, uitgestelde CAPTCHA |
| `src/app/_components/portfolio-overlay.tsx` | new | Fullscreen portfolio: lijst- en detailweergave, keyboard- én tik-navigatie |
| `src/app/_components/terminal-feed.tsx` | new | Renderer voor de regelstijlen uit het ontwerp (cmd/head/out/dim/bullet/row/job/link/spacer) |
| `src/app/_components/terminal-commands.ts` | new | Statische command-data (exacte copy) en de command-parser |
| `src/app/_components/terminal-projects.ts` | new | Portfolio-data in één gedocumenteerd format met invul-template en optionele image/case-link |
| `src/app/_components/terminal.module.css` | new | Pixel-exacte styling, thema-custom-properties en container queries |
| `src/app/_components/captcha-overlay.tsx` | modified | Opnieuw vormgegeven naar de nieuwe look |
| `src/app/_components/memoized-markdown.tsx` | modified | AI-markdown in de terminal-body-stijl |
| `src/app/layout.tsx` | modified | JetBrains Mono via `next/font/google` (vervangt Geist); cyaan backdrop |
| `src/app/page.tsx` | modified | Rendert de nieuwe terminal in de cyaan-achtergrondwrapper |
| `src/styles/globals.css` | modified | Backdrop-gradients en grid, selectiekleur, scrollbar, fontvariabele |
| `tests/e2e/*.spec.ts`, `tests/helpers/*`, `tests/fixtures/command-outputs.ts` | modified | Nieuwe selectors en flows; mobiele viewport-test |
| `src/app/_components/chat-terminal.tsx`, `src/app/_components/code-block.tsx` | removed | Vervangen door de nieuwe terminal |
| `src/app/api/commands/route.ts`, `src/server/services/command-executor.ts` | removed | Commands zijn nu client-statisch; verwijderen mits nergens anders gebruikt |

## Testing & Verification

Gates: `pnpm run typecheck`, `pnpm run lint`, `pnpm run build` (elk exit 0). De Playwright-suite wordt herschreven tegen de nieuwe UI en dekt de client-statische commands, de AI-stream, de e-mail-flow, rate-limiting en een mobiele viewport. User-testing draait `pnpm dev` op poort 3000; de tester controleert de intro, de commands, de portfolio (inclusief tik-bediening), de mobiele weergave, de AI-stream en de e-mail-flow tegen de draaiende app.

## Security

De CAPTCHA blijft het AI-endpoint beschermen; alleen het moment verschuift naar het eerste vrije-tekst bericht. De rate-limits (berichten per minuut, drie e-mails per uur) en de berichtlengtelimiet van 4000 tekens blijven ongewijzigd. Er gaat geen AI-request uit vóór er een geldige sessie is. Er staan geen secrets of API-sleutels in client-code; alle gevoelige bewerkingen blijven server-side.
