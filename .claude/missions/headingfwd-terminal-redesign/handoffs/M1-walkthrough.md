# Milestone M1 — Statische terminal (pixel-exact, mobiel-net) — walkthrough

## In één oogopslag
De hele UI-laag van de site is vervangen door de finale referentie: een macOS-terminal op
een cyaan achtergrond met een statische intro, werkende slash-commands, een fullscreen
portfolio-browser en een nette, volledig tikbare mobiele weergave. De backend is niet
aangeraakt. Alles is pixel-exact volgens de referentie-HTML, en alle acht criteria van deze
milestone zijn groen: gates 3/3, scrutiny 4/4, user-test 4/4.

## Hoe te lezen / zelf bekijken
1. Start de app: `pnpm dev` en open `http://localhost:3000`.
2. Lees de intro (staat er direct, input krijgt focus).
3. Typ `/help`, `/about`, `/services`, `/work`, `/stack`, `/contact`; `/clear` leegt; ↑/↓ = history.
4. Typ `/portfolio` → blader met ↑/↓/↵/←/→/esc óf met de muis.
5. Versmal naar ~375px (of devtools mobiel) → alles blijft netjes en met tikken bedienbaar.

## Wat is gebouwd, per feature

**F1 — Shell, fonts, intro, cyaan backdrop.** De macOS-window, JetBrains Mono, de complete
statische intro en de Design Tokens als CSS-custom-properties, plus de 560px container-query.
*Waarom:* dit is de pixel-exacte basis waar al het andere op verder bouwt.
Key files: `terminal.tsx`, `terminal.module.css`, `layout.tsx`, `globals.css`, `page.tsx`.
Zelf checken: laad de pagina; vergelijk kleuren/maten met `design_handoff_headingfwd/`.

**F2 — Feed-renderer, client-statische commands, input/history/scroll.** Een getypeerd
feed-regelmodel + renderer, het command-register met exacte copy, de parser, Enter-uitvoering,
history (cap 40), auto-scroll en `/clear`.
*Waarom:* snelle, sessieloze commands los van de AI.
Key files: `terminal-commands.ts`, `terminal-feed.tsx`, `terminal.tsx`.
Zelf checken: `/help` toont de commandolijst; `/clear` zet de teller terug op "18 lines".

**F3 — Portfolio-overlay met aanleverbaar dataformat.** De fullscreen overlay (lijst + detail,
toetsenbord + muis) en `terminal-projects.ts`: één gedocumenteerd dataformat met invul-template
en optionele `image`/`caseUrl`-velden die de detailweergave automatisch toont.
*Waarom:* cases later aanleverbaar zonder componentcode te wijzigen.
Key files: `portfolio-overlay.tsx`, `portfolio-overlay.module.css`, `terminal-projects.ts`.
Zelf checken: `/portfolio` → open een project → de placeholder-visual + CTA staan er.

**F4 — Mobiele afwerking en touch-bediening.** Geen overflow op 375px, ~44px tap-targets,
tikbare `/help`/`/portfolio`-affordances, en het toetsenbord springt niet ongevraagd op
(één gedeelde `prefersAutoFocus()`-helper voor alle focus-paden).
*Waarom:* de terminal moet op een telefoon net zo bruikbaar zijn.
Key files: `terminal.tsx`, `terminal-feed.tsx`, `terminal.module.css`, `portfolio-overlay.module.css`.
Zelf checken: op 375px geen horizontale scrollbar; portfolio volledig met tikken te bedienen.

**Correctie tijdens validatie — ASCII-banner.** De "FWD"-banner rendert nu correct: het
vol-blok-teken zat niet in de geladen font-subset, waardoor het uit een ander font met
afwijkende breedte kwam en de blokletters onleesbaar werden. De banner gebruikt nu een
expliciete systeem-monospace zodat blok en spatie even breed zijn.
Key file: `portfolio-overlay.module.css` (`.asciiBanner`).

## Validatie
- **Gates:** typecheck, lint, build — alle exit 0.
- **Scrutiny (VC-2/5/7/8):** tokens 1:1, dataformat data-gedreven, 560px-breakpoint, comment-hygiëne — alle PASS. Zie `M1-review.md`.
- **User-test (VC-1/3/4/6):** intro+focus, commands+history+clear, portfolio (toetsenbord+muis), 375px zonder overflow en volledig tikbaar — alle PASS. Zie `M1-usertest.md`.

## Advisories (niet-blokkerend)
- De README (`design_handoff_headingfwd/README.md:122`) noemt een "smaller radius" voor het
  smalle window, maar referentie-HTML én code zetten 14px (groter dan de 13px default). De code
  volgt terecht de referentie; één regel verduidelijking in de README voorkomt verwarring.
