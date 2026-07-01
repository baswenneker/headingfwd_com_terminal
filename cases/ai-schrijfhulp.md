---
title: AI Schrijfhulp
slug: ai-schrijfhulp
sector: Overheid
status: live
rol: Initiatiefnemer / AI engineer
tags: [LLM, Schrijven, Marketing, Python, VectorDB]
stack: [Azure OpenAI, Python, Agentic programming, VSCode]
updated: 2025-06-19
sources:
  - headingfwd-demo-playground/src/app/showcase/ai-schrijfhulp/page.tsx
  - headingfwd-demo-playground/src/app/showcase/ai-schrijfhulp/schrijfhulp-demo.tsx
  - headingfwd-com/src/data/index/page.json (teaser "AI Schrijfhulp")
  - dspy-writing-style (gerelateerd R&D-experiment)
---

# AI Schrijfhulp

## In het kort

Een AI-gestuurde schrijfhulp voor de redactie van een grote publieke organisatie.
De tool herschrijft teksten naar een heldere, foutloze boodschap die voldoet aan de
schrijfwijzer, woordenlijsten, stijlregels en toegankelijkheidseisen (B1-niveau) van de
organisatie. Eén consistente huisstijl voor het hele redactieteam — terwijl gevoelige
data binnen de eigen omgeving blijft.

## Probleem

Bij een organisatie met een van de meest bezochte websites van Nederland, die jaarlijks
miljoenen brieven verstuurt, is schrijven een kerntaak. Redacteuren moeten teksten
opleveren die voldoen aan een schrijfwijzer, woordenlijsten, stijlregels en
toegankelijkheidseisen. Generieke AI-tools (ChatGPT, Copilot) schieten daarvoor tekort:

- Geen kennis van de huisstijl of tone of voice
- Algemene suggesties zonder context van de organisatie
- Inconsistente output bij verschillende prompts
- Privacy-zorgen bij gevoelige bedrijfs- en persoonsdata

## Aanpak

Ik heb aan de wieg gestaan van een maatwerk AI-schrijfhulp. We werkten in nauwe
co-creatie met leden van de redactie. In het begin was er argwaan en weerstand;
naarmate we nauwer samenwerkten en resultaten boekten, groeide het vertrouwen en de
acceptatie.

De oplossing draait in de eigen omgeving van de organisatie (een interne URL zoals
`schrijfhulp.intranet.nl`), zodat ook bedrijfsgevoelige en persoonsdata de organisatie
niet verlaat.

## Hoe het werkt

De gebruiker plakt een tekst; de schrijfhulp analyseert en levert per zin een
herschreven versie met opmerkingen. Voorbeelden uit de demo (origineel → herschreven):

- "Door de afgelopen week ben ik beezig geweest met het ontwikelen van een nieuwe
  AI-gestuerde schrijfhulp tool." → "Vorige week werkte ik aan het maken van een nieuwe
  AI-gestuurde schrijfhulptool." (eenvoudiger, B1, spelfouten, samenstelling)
- "…zodat je profesioneler overkomt in je communicatie." → losgetrokken in twee zinnen,
  "professioneler" gecorrigeerd (duidelijkheid + spelling)
- "Vervolgens geeft hij suggesties…" → "Vervolgens geeft de tool suggesties…"
  (duidelijkere verwijzing)

De output verschijnt als tabel met drie kolommen: **Originele zin · Herschreven zin ·
Opmerkingen**.

**Voordelen:**

| Voordeel | Toelichting |
|---|---|
| 🔒 Data­veiligheid | Ook voor bedrijfsgevoelige en persoonsdata; alles blijft in de eigen omgeving |
| ⚡ Efficiëntie | Direct resultaat, klaar terwijl je wacht |
| 🎯 Consistentie | Een schrijfwijzer wordt door iedereen anders geïnterpreteerd; AI doet dat consistent |
| 📚 Woordenlijsten | Jargon afdwingen óf juist vermijden |
| 👥 B1-niveau | Schrijven zodat de gemiddelde Nederlander het goed kan volgen |
| ✨ Iedereen kan het | Maakt van elke medewerker een goede schrijver |

> "Door steeds nieuwe suggesties te krijgen, helpt het me in het creatieve proces en
> voldoet het gelijk aan de schrijfregels die we hanteren!" — Redacteur

## Tech & stack

- ☁️ **Azure OpenAI LLMs** — LLM API-provider
- 🐍 **Python** — backend
- 🤖 **Agentic programming** — AI-architectuurpatroon
- 💻 **VSCode** — IDE
- 🔎 **Vectordatabase** — ontsluit de schrijfwijzer en woordenlijsten voor de tool

## Status

**Live** — maatwerk client-project bij een grote publieke organisatie.
