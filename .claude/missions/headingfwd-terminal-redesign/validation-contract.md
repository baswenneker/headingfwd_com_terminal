# Validation Contract: headingfwd-terminal-redesign

## Layer A — Gates (machine-checked, exit 0)
| ID | Name | Command |
|----|------|---------|
| G1 | typecheck | `pnpm run typecheck` |
| G2 | lint | `pnpm run lint` |
| G3 | build | `pnpm run build` |

## Layer B — Assertions (judged)

### M1 — Statische terminal (pixel-exact, mobiel-net)

- **VC-1** (user-testing): *Given* de app is geladen, *when* de bezoeker niets doet, *then* staat de hele intro er meteen (banner, wordmark "HeadingFWD ››—›", subtitle, value-prop, vier specialities, tip, statusbalk) zonder fade-in, en krijgt de input focus. · *De statische intro staat er direct, pixel-exact.* *(features: F1)*
- **VC-2** (scrutiny-review): *Given* de gecommitte CSS, *when* de reviewer de waarden vergelijkt met de Design Tokens, *then* kloppen accent `#2EE6F6`, backdrop `#0BD3E6`, prompt `#5BE6A0`, window `#0A0E11`, radius 13px, de drielaagse window-schaduw en de clamp-maten exact. · *De ontwerptokens zijn 1:1 overgenomen.* *(features: F1)*
- **VC-3** (user-testing): *Given* de draaiende terminal, *when* de bezoeker een slash-command typt (`/help`, `/about`, `/services`, `/work`, `/stack`, `/contact`, `/clear` of een alias), *then* echo't de regel en verschijnt de exacte output in de juiste regelstijl; `/clear` leegt de feed, `↑`/`↓` halen history terug, klikken in de body herfocust de input. · *Alle commands werken keyboard-first met exacte copy.* *(features: F2)*
- **VC-4** (user-testing): *Given* de draaiende terminal, *when* de bezoeker `/portfolio` opent, *then* verschijnt de fullscreen overlay met de ASCII-"FWD"-banner en vier projecten, navigeerbaar met `↑`/`↓`/`↵`/`esc` én met muis; de detailweergave wisselt met `←`/`→` en sluit met `esc`/`backspace`, met placeholder-visual en CTA. · *De portfolio-browser werkt volledig per toetsenbord en muis.* *(features: F3)*
- **VC-5** (scrutiny-review): *Given* de gecommitte code, *when* de reviewer het portfolio-databestand bekijkt, *then* staat de projectdata in één bestand met een heldere, gedocumenteerde vorm en een invul-template; optionele velden voor een afbeelding en een case-link worden door de detailweergave gerenderd zodra ze gevuld zijn, zonder componentwijziging. · *Cases zijn later aanleverbaar in één eenvoudig, eenduidig format.* *(features: F3)*
- **VC-6** (user-testing): *Given* de app op een mobiele viewport van 375px, *when* de bezoeker de terminal en de portfolio gebruikt, *then* is er geen horizontale overflow of afgekapte tekst, zijn de maten leesbaar, en is alles — inclusief de portfolio-navigatie — volledig met tikken bedienbaar zonder toetsenbord. · *Op de telefoon ziet alles er netjes uit en werkt alles met tikken.* *(features: F4)*
- **VC-7** (scrutiny-review): *Given* de gecommitte styling, *when* de viewport onder 560px komt, *then* collapse't de specialities-grid naar één kolom, staat het window op volle hoogte met kleinere radius, zijn de titelbalk en prompt ingekort en is het rechter merklabel verborgen (via container queries). · *Smalle schermen volgen de referentie-breakpoints.* *(features: F1, F4)*
- **VC-8** (scrutiny-review): *Given* de gecommitte code van deze milestone, *when* de reviewer de diff leest, *then* bevat geen enkele comment, docstring of commit message een mission-interne code (feature-ID, milestone-ID, validatiecriterium-ID of historie-verwijzing zoals "pre-F4") — elke comment is zelfstandig leesbaar. · *Comments leggen het wat/waarom uit, zonder mission-jargon.* *(features: F1, F2, F3, F4)*

### M2 — AI-chat in de shell

- **VC-9** (user-testing): *Given* een verse sessie, *when* de bezoeker eerst een slash-command typt en daarna een vrije-tekst bericht, *then* werkt de command zonder CAPTCHA, verschijnt bij het vrije-tekst bericht de opnieuw vormgegeven CAPTCHA-overlay, en wordt dat bericht na verificatie alsnog naar de AI gestuurd. · *De CAPTCHA stoort de commands niet en gate't alleen de AI.* *(features: F5)*
- **VC-10** (user-testing): *Given* een geverifieerde sessie, *when* de bezoeker vrije tekst stuurt, *then* streamt het AI-antwoord als markdown in de body-tekststijl met een "Thinking…"-indicator en een knipperende cursor; fouten verschijnen in terminalstijl. · *De AI-chat leeft zichtbaar in de terminal.* *(features: F5)*
- **VC-11** (user-testing): *Given* een gesprek waarin de bezoeker een bericht wil sturen, *when* hij e-mailadres en bericht geeft en bevestigt, *then* toont de AI eerst een nette preview, vraagt bevestiging en verstuurt na akkoord via de bestaande tool; bij overschrijding verschijnt de rate-limit-melding. · *De bezoeker kan via de AI een bericht sturen, met preview.* *(features: F6)*
- **VC-12** (scrutiny-review): *Given* de diff, *when* de reviewer de backend-aanroepen bekijkt, *then* zijn de tRPC-sessie-init, het AI-endpoint, de turnstile-, e-mail- en rate-limit-services ongewijzigd hergebruikt, staan er geen secrets in client-code, en gaat er geen AI-request uit vóór een geldige sessie. · *We hergebruiken de backend veilig; niets lekt naar de client.* *(features: F5, F6)*
- **VC-13** (scrutiny-review): *Given* de gecommitte code van deze milestone, *when* de reviewer de diff leest, *then* bevat geen enkele comment, docstring of commit message een mission-interne code — elke comment is zelfstandig leesbaar. · *Comments leggen het wat/waarom uit, zonder mission-jargon.* *(features: F5, F6)*

### M3 — Tests en opruimen

- **VC-14** (user-testing): *Given* de herschreven Playwright-suite, *when* `pnpm test:e2e` draait, *then* slaagt de suite tegen de nieuwe UI en dekt de client-statische commands, de AI-stream, de e-mail-flow, rate-limiting en een mobiele viewport. · *De tests dekken het nieuwe gedrag en slagen.* *(features: F7)*
- **VC-15** (scrutiny-review): *Given* de diff, *when* de reviewer de verwijderde en resterende bestanden bekijkt, *then* is dode code weg (de oude chat-terminal, het codeblok, en de ongebruikte server-side command-route mits nergens anders gebruikt) en slagen `pnpm check` en `pnpm build`. · *Geen dode code; lint, types en build groen.* *(features: F8)*
- **VC-16** (scrutiny-review): *Given* de gecommitte code van deze milestone, *when* de reviewer de diff leest, *then* bevat geen enkele comment, docstring of commit message een mission-interne code — elke comment is zelfstandig leesbaar. · *Comments leggen het wat/waarom uit, zonder mission-jargon.* *(features: F7, F8)*

## App boot (user-testing)
- boot: `pnpm dev`
- ready: HTTP GET `http://localhost:3000` → 200 (timeout 60s)
- smoke: `curl -fsS http://localhost:3000` · `curl -fsS http://localhost:3000/api/health`
- mobiel: de tester gebruikt een mobiele viewport (375px) via Playwright voor VC-6.
- noot: de AI- en e-mail-VC's vereisen `OPENAI_API_KEY`, een Resend-sleutel en `NEXT_PUBLIC_DISABLE_CAPTCHA=true` in de worktree-`.env`; ontbreken die, dan worden die user-testing-criteria als niet-uitgevoerd vastgelegd.
