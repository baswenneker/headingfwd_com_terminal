# Cases

Uitgewerkte cases uit het HeadingFWD-portfolio, geëxtraheerd naar één Markdown-bestand
per case. Bron: voornamelijk `headingfwd-demo-playground` (showcase-pagina's +
`src/data/projects.json`), aangevuld met de teasers uit `headingfwd-com` en de
bijbehorende deep-tech repo's.

> **Integriteit:** elke sectie put uit een genoemde bron. Waar iets is afgeleid of
> aangenomen, staat dat expliciet als `> Aanname: …`. Er zijn geen klantnamen, cijfers of
> resultaten verzonnen; geanonimiseerde klanten zijn anoniem gehouden.

## Overzicht

| Case | Sector | Status | Tags | Bestand |
|------|--------|--------|------|---------|
| AI Schrijfhulp | Overheid | 🟢 live | LLM, Schrijven, Python, VectorDB | [ai-schrijfhulp.md](./ai-schrijfhulp.md) |
| BriefWijzer | Communicatie | 🔵 demo | RAG, OCR, LLM | [briefwijzer.md](./briefwijzer.md) |
| Hintsay (LinkedIn) | Marketing | 🟢 live | LLM, Marketing, SaaS | [hintsay-linkedin.md](./hintsay-linkedin.md) |
| AI Personal Trainer | Sport & Fitness | 🟡 experiment | LLM, Multimodaal, Python | [ai-personal-trainer.md](./ai-personal-trainer.md) |
| MyWorq | Tuinbouw | 🟢 live | Mobiele App, Product Management | [myworq.md](./myworq.md) |
| Chatbot: Vraagbaak voor je team | Overheid | ⚪ concept | RAG, LLM, Chatbot | [chatbot-vraagbaak.md](./chatbot-vraagbaak.md) |
| Podcast transcriptie en segmentering | Media | ⚪ concept | Transcriptie, LLM, Audio | [podcast-transcriptie.md](./podcast-transcriptie.md) |

## Status-legenda

- 🟢 **live** — in productie / echt in gebruik (evt. als client-project of SaaS)
- 🔵 **demo** — werkende showcase / productconcept met demo
- 🟡 **experiment** — eigen R&D, gedeeld als experiment
- ⚪ **concept** — idee/teaser, nog niet uitgewerkt

## Herkomst van de bronnen

| Bron | Wat het levert |
|------|----------------|
| `headingfwd-demo-playground/src/data/projects.json` | Gecureerde lijst van 6 cases (titel, omschrijving, sector, tags) |
| `headingfwd-demo-playground/src/app/showcase/*` & `cases/hintsay` | Uitgewerkte case-content (probleem/oplossing, how-it-works, tech, impact) |
| `headingfwd-com/src/data/index/page.json` | Oorspronkelijke teasers; enige bron voor de podcast-case |
| `dspy-writing-style`, `whisperfwd`, `vibes-chrome-li-extension`, `headingfwd_toolkit` | Deep-tech repo's voor stack/herkomst (deels gerelateerd, gemarkeerd) |
