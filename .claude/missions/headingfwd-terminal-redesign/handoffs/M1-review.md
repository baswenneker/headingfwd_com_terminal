# M1 — Scrutiny-review

Adversariële code-review (verse context, alleen de diff `main..HEAD`) van de vier
scrutiny-criteria. Uitkomst: **alle vier PASS.**

This is a high-quality, faithful redesign milestone. De gecommitte CSS is vergeleken met
zowel de README Design Tokens als de referentie-HTML: accent, backdrop, prompt, window-kleur,
de 13px radius, de exacte drielaagse box-shadow en de clamp-maten kloppen precies met de bron.
De portfolio-data staat in één goed gedocumenteerd bestand (`terminal-projects.ts`) met een
getypeerde interface en een invul-template, en de detailweergave vertakt al op de optionele
`image`- en `caseUrl`-velden — alleen het databestand bewerken activeert de UI, dus echt
data-gedreven. De 560px container-query klapt de grid in, zet het window op volle hoogte, kort
de titelbalk en prompt in, en verbergt het merklabel. Comment-hygiëne is schoon: geen
mission-interne codes in product-comments of in de `feat(...)`/`fix(...)` commit messages.

| VC | Oordeel | Bewijs (samengevat) |
|----|---------|---------------------|
| VC-2 (tokens) | ✅ PASS | accent `#2ee6f6`, backdrop `#0bd3e6`, prompt `#5be6a0`, window `#0a0e11`, radius 13px, drielaagse schaduw byte-identiek aan de token; clamps behouden (page/body/wordmark). |
| VC-5 (dataformat) | ✅ PASS | één databestand met gedocumenteerde `Project`-interface + invul-template; detailweergave vertakt op `image` (regel 285) en `caseUrl` (regel 315) — zonder componentwijziging te activeren. |
| VC-7 (breakpoint) | ✅ PASS | `@container page (max-width:560px)`: grid→1fr, window volle hoogte + radius 14px, titel 11px + zsh verborgen, prompt-prefix verborgen, merklabel verborgen. |
| VC-8 (comment-hygiëne) | ✅ PASS | grep van `src/` op VC-/F#/M#/milestone/pre-F: geen treffers in productcode; de vijf feat/fix commit messages zijn zelfstandig leesbaar. |

## Advisory (niet-blokkerend)
`design_handoff_headingfwd/README.md:122` noemt een "smaller radius" voor het smalle window,
maar zowel de referentie-HTML als de code zetten 14px (groter dan de 13px default). De code
volgt terecht de referentie-HTML (de bron van waarheid); de README-prozatekst is de
inconsistente. Eén regel verduidelijking in de README voorkomt verwarring voor latere lezers.
