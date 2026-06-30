# M1 — User-test

Verse validator, end-to-end tegen de draaiende app (Playwright headless Chromium op
`http://localhost:3000`), inclusief een 375px touch-pass. Uitkomst: **alle vier PASS.**

De validator controleerde de vier intro-elementen bij laden, draaide vijf slash-commands met
output- en history-controle, opende en navigeerde de portfolio-overlay met toetsenbord én muis,
en herhaalde de portfolio-flow op een 375px touch-viewport.

| VC | Oordeel | Bewijs (samengevat) |
|----|---------|---------------------|
| VC-1 (intro + focus) | ✅ PASS | Bij laden: promptregel, wordmark "HeadingFWD ››—›" op opacity 1 (geen fade-in), subtitle, value-prop, 4 specialities, tip, statusbalk "18 lines · /help". Na 1200ms is `document.activeElement` de INPUT. |
| VC-3 (commands) | ✅ PASS | `/help` toont de commandolijst; `/contact` toont e-mail + linkedin; feed groeide naar 38 elementen na 5 commands. `/clear` leegt de feed (0) en statusbalk terug naar "18 lines". ↑ haalt "/about" dan "/help" terug. Klik in de body herfocust de input. |
| VC-4 (portfolio) | ✅ PASS | Overlay met ASCII-FWD-banner en vier projecten; hover selecteert, klik opent detail; teller 1/4 → next → 2/4, → 3/4, ← 2/4; placeholder-visual en CTA "work with me →" aanwezig; Backspace terug naar lijst, Esc sluit af. |
| VC-6 (mobiel + tik) | ✅ PASS | 375px, hasTouch. Terminal scrollWidth=clientWidth=375 (geen overflow). Tik op `/portfolio`-tip opent de overlay (ook geen overflow). Tik op rij → detail; tik op "next →" → 2/4; tik op "[ esc ] exit" → terug naar terminal. Geen horizontale overflow op enig moment. |
