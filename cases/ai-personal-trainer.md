---
title: AI Personal Trainer
slug: ai-personal-trainer
sector: Sport & Fitness
status: experiment
rol: Maker / AI engineer
tags: [LLM, Multimodaal, Bewegingsherkenning, Python]
stack: [Google Gemini 2.5 Pro, Python, ChatGPT, GitHub Copilot, VSCode]
updated: 2025-06-19
links:
  - https://www.linkedin.com/posts/baswenneker_kan-chatgpt-een-personal-trainer-vervangen-activity-7330482395533430785-CqxF/
  - https://www.linkedin.com/feed/update/urn:li:activity:7338437372616826883/
sources:
  - headingfwd-demo-playground/src/app/showcase/ai-personal-trainer/page.tsx
---

# AI Personal Trainer

## In het kort

Software die feedback geeft op fitnessvideo's, net als een coach of personal trainer zou
doen. De rode draad: een experiment met **ChatGPT als personal trainer faalt**, een
**maatwerk AI-oplossing slaagt**. Met maatwerk software kun je complexe bewegingen in
video analyseren en er technische, gepersonaliseerde coaching op geven.

## Probleem

Ik was benieuwd hoe ver de multimodale kwaliteiten van de huidige LLMs reiken — modellen
die tekst, geluid, afbeeldingen én video begrijpen. Hiervoor gebruikte ik video's die ik
eerder aan mijn eigen personal trainer stuurde. Na het uploaden in ChatGPT kreeg ik
alleen algemene en onspecifieke feedback. Geen enkel beschikbaar model kon de bewegingen
accuraat analyseren; bij een verzoek om visuele feedback genereerde het irrelevante
afbeeldingen.

## Aanpak

Daarom bouwde ik een maatwerk-oplossing: een AI personal trainer die zich voordoet als de
wereldberoemde weightlifting-coach [Bob Takano](https://www.takanoweightlifting.com/).

- **Prompt engineering** gebaseerd op de methodiek van een topcoach weightlifting
- **Google Gemini 2.5 Pro** voor frame-by-frame bewegingsanalyse
- Een **Python-tool** voor video-vertraging en een visuele feedback-overlay
- Resultaat: technisch accurate, gepersonaliseerde coaching

### ChatGPT vs. Maatwerk

| ChatGPT (faalt) | Maatwerk (slaagt) |
|---|---|
| Geen model analyseert bewegingen accuraat | Prompt engineering o.b.v. methodiek topcoach |
| Generieke, niet-specifieke feedback | Gemini 2.5 Pro voor frame-by-frame analyse |
| Genereert irrelevante afbeeldingen bij visuele feedback | Python-tool voor vertraging + visuele overlay |
| Bewegingsherkenning ontbreekt volledig | Technisch accurate, gepersonaliseerde coaching |

## Resultaten

- **Demo 1 — Squat Clean-analyse**: real-time analyse van een clean met directe visuele feedback.
- **Demo 2 — Hang Squat Snatch-analyse**: gedetailleerde techniekanalyse van de snatch-beweging.

Demovideo's (YouTube): poging 1 (ChatGPT) `rrvgrcJ_v0M` · maatwerk `9YoU4e1Ow3Q` ·
squat clean `3GeEfHs6dTo` · hang squat snatch `lgP9zCadeLo`.

## Tech & stack

- 💬 **ChatGPT** — macOS app (eerste, mislukte poging)
- 🤖 **Google AI Studio** — Gemini 2.5 Pro (multimodale video-analyse)
- 🧑‍💻 **GitHub Copilot** — coding agent
- 💻 **VSCode** — IDE
- 🐍 **Python** — tool voor video-vertraging en feedback-overlay

## Status

**Experiment** — eigen R&D, gedeeld via LinkedIn met demovideo's. Toont aan dat generieke
multimodale modellen tekortschieten voor bewegingsanalyse, terwijl een maatwerk-aanpak
met Gemini 2.5 Pro + een Python-pijplijn wél werkt.
