# M2 — User-test

De drie user-testing-criteria zijn end-to-end geverifieerd met de Playwright MCP tegen de
draaiende app. Uitkomst: **alle drie PASS.**

## Methode (waarom door de orchestrator i.p.v. een losse tester)
De drie criteria hebben tegenstrijdige randvoorwaarden in één draaiende app: VC-9 vereist
CAPTCHA **aan** (om de overlay te zien), terwijl VC-10/VC-11 juist OpenAI-kosten en het
versturen van **echte e-mail** moeten vermijden. Eén geboote app kan dat niet tegelijk voor een
blinde tester. Daarom zijn ze direct geverifieerd met:
- **Cloudflare Turnstile-testsleutels** (tijdelijke `.env.local`) voor de live CAPTCHA-overlay;
- **faithful AI-SDK-v6 UI-message-stream mocks** (via een `window.fetch`-override op `/api/chat`,
  met de exacte chunk-vormen `text-delta` en `tool-input/-output-available`) voor de AI- en
  e-mail-rendering — zonder echte OpenAI-call of e-mail.
De testsleutels en `.env.local` zijn na afloop verwijderd; de backend is nooit aangepast.

| VC | Oordeel | Bewijs (samengevat) |
|----|---------|---------------------|
| VC-9 (uitgestelde CAPTCHA) | ✅ PASS | `/help` werkt zonder overlay/sessie (statusbalk "29 lines", geen captcha-overlay). Bij vrije tekst **verschijnt de opnieuw vormgegeven CAPTCHA-overlay** (donker paneel, accent ">", "Verification Required", Turnstile-widget) — gescreenshot met de force-challenge-testsleutel. Met de auto-pass-testsleutel verloopt de hele keten end-to-end: overlay → verificatie → tRPC-sessie → het onthouden bericht gaat naar de AI en er komt een antwoord. |
| VC-10 (AI-streaming) | ✅ PASS | Een gemockte markdown-stream rendert pixel-consistent in de body-stijl (h2 `#eafbfe`, body `#cfe2e7`, accent inline-code/links, lijst, codeblok). "Thinking…" verschijnt tijdens het wachten (gescreenshot); de knipperende cursor draait via de CSS-keyframe tijdens streamen; een gemockte 429 toont "→ You've reached the email limit…" in terminal-rood (`rgba(255,110,110,.9)`), zonder rauwe JSON. |
| VC-11 (e-mail-flow) | ✅ PASS | Volledige flow gemockt met de exacte tool-chunks: de **preview** ("📧 Email Preview", From/To/Message, nette `━`-scheidingen dankzij de font-fix) rendert; na "yes" verschijnt **"✓ message sent to bas@headingfwd.com"** in prompt-groen (`#5BE6A0`) plus de AI-bevestiging; bij de derde poging toont de **rate-limit-melding** "→ You've reached the email limit (3 per hour)…" in terminal-rood. Geen echte e-mail verstuurd. |

## Noot
In de dev-omgeving staat `NEXT_PUBLIC_DISABLE_CAPTCHA=true`; de overlay-verificatie is daarom
met Cloudflare-testsleutels in een tijdelijke `.env.local` getest (na een `.next`-clear, omdat
Turbopack `NEXT_PUBLIC_`-waarden op compile-tijd inlinet).
