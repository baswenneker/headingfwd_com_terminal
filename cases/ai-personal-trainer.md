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

Daarom bouwde ik een maatwerk-oplossing: een AI-gestuurde virtuele Olympische coach die
zich voordoet als de wereldberoemde weightlifting-coach
[Bob Takano](https://www.takanoweightlifting.com/).

- **Prompt engineering** gebaseerd op de methodiek van een topcoach weightlifting
- **Google Gemini 2.5 Pro** voor frame-by-frame bewegingsanalyse
- Een **Python-tool** voor video-vertraging en een visuele feedback-overlay
- Resultaat: technisch accurate, gepersonaliseerde coaching

### ChatGPT vs. Maatwerk

| ChatGPT — faalt bij video-analyse van sportbewegingen | Maatwerk — AI-gestuurde virtuele Olympische coach |
|---|---|
| Geen enkel beschikbaar model kan bewegingen accuraat analyseren | Prompt engineering gebaseerd op methodiek topcoach weightlifting |
| Feedback is generiek en niet-specifiek voor de getoonde techniek | Google Gemini 2.5 Pro voor frame-by-frame bewegingsanalyse |
| Bij verzoek om visuele feedback genereert het irrelevante afbeeldingen | Python-tool voor video-vertraging en visuele feedback-overlay |
| Bewegingsherkenning ontbreekt volledig | Technisch accurate, gepersonaliseerde coaching |

De twee pogingen (poging 1 met ChatGPT, poging 2 met de maatwerk-coach) en twee
techniekanalyses staan als afspeelbare video's onderaan deze case.

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

## Video's

- ❌ [Poging 1 — ChatGPT kan geen video analyseren](https://www.youtube.com/watch?v=rrvgrcJ_v0M) — ChatGPT kan de video niet analyseren en geeft generieke adviezen die niet aansluiten bij de werkelijke uitvoering.
- ✅ [Poging 2 — Maatwerk AI Personal Trainer](https://youtube.com/shorts/9YoU4e1Ow3Q) — Met maatwerk software analyseert de AI bewegingen real-time en geeft specifieke, technische feedback met visuele annotaties.
- [Demo 1 — Squat Clean-analyse](https://www.youtube.com/watch?v=3GeEfHs6dTo) — Real-time analyse van een clean met directe visuele feedback.
- [Demo 2 — Hang Squat Snatch-analyse](https://www.youtube.com/watch?v=lgP9zCadeLo) — Gedetailleerde techniekanalyse van de snatch-beweging.
