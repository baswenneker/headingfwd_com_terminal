---
title: BriefWijzer
slug: briefwijzer
sector: Communicatie
status: demo
rol: AI engineer
tags: [RAG, OCR, LLM, Marketing]
stack: [Python, Google Vision, Claude Code, VSCode]
updated: 2025-07-03
sources:
  - headingfwd-demo-playground/src/app/showcase/briefwijzer/page.tsx
  - headingfwd-demo-playground/src/app/showcase/briefwijzer/components/briefwijzer-intro.tsx
  - headingfwd-demo-playground/src/app/showcase/briefwijzer/components/how-it-works.tsx
  - headingfwd-com/src/data/index/page.json (teaser "Briefwijzer")
  - headingfwd_toolkit (promptfoo-test verwijst naar briefwijzer)
---

# BriefWijzer

## In het kort

BriefWijzer maakt onleesbare (overheids)brieven begrijpelijk. Jouw klant maakt een foto
van de brief, en de app doet de rest: een korte, begrijpelijke samenvatting, een direct
klikbare call-to-action en een AI-gedreven chat om vragen over de brief te stellen.
Als bonus zie je als afzender welke van je brieven als onleesbaar worden ervaren, zodat
je ze kunt verbeteren — en je verlaagt de contactdruk op je klantenservice.

## Probleem

> Bron: `page.tsx` (ProblemSolutionSection).

Communicatie is voor een groot deel van Nederland niet begrijpelijk:

- 2 miljoen mensen in Nederland zijn laaggeletterd
- Mensen met beperkt doenvermogen pakken de telefoon om te vragen waar het over gaat
- Dit legt druk op contactcenters
- De dienstverlening sluit niet aan op deze doelgroep
- Ingewikkelde brieven leiden tot frustratie en onbegrip

## Aanpak

> Bron: `page.tsx` (solution) + `briefwijzer-intro.tsx`.

BriefWijzer is een digitale leeshulp die brieven leesbaar maakt voor iedereen, zónder
extra werk voor de afzender:

- Korte, begrijpelijke samenvatting van de belangrijkste punten (maximaal 5 bullets)
- De call-to-action wordt direct (online) klikbaar
- Interactieve chat-functie die antwoordt binnen de context van de brief
- Inzicht voor de afzender in welke brieven als onleesbaar worden ervaren

## Hoe het werkt

> Bron: `how-it-works.tsx`.

**Jouw klant…**

1. 📨 …ontvangt jouw brief — maar begrijpt niet wat er staat.
2. 📱 …scant de BriefWijzer-QR — de app hoeft niet gedownload te worden, maar opent in de browser.
3. 📷 …maakt een foto — meerdere pagina's uploaden kan.

**BriefWijzer gaat aan de slag en…**

- 📋 …vat de brief samen in begrijpelijke, eenvoudige taal (max. 5 bullets).
- 👆 …maakt acties direct klikbaar — jij configureert de call-to-actions die getoond worden.
- 💬 …beantwoordt vragen direct via chat.

## Tech & stack

> Geverifieerd uit `page.tsx` ("Gebruikte tech").

- 🐍 **Python** — backend processing
- 👁️ **Google Vision** — OCR en documentanalyse
- 🤖 **Claude Code** — AI development assistant
- 💻 **VSCode** — IDE

De tags `RAG` en `OCR` (uit `projects.json`) bevestigen de pijplijn: OCR leest de
brief, RAG/LLM vat samen en beantwoordt vragen binnen de context van de brief.

> Aanname / herkomst: in `headingfwd_toolkit` verwijst een promptfoo-test naar
> briefwijzer — waarschijnlijk zijn hier prompts voor de samenvatting getest.

## Status

**Demo** — werkende showcase/productconcept. Gepositioneerd als app voor bedrijven en
overheden die hun brieven toegankelijker willen maken.

## Bronnen

- `headingfwd-demo-playground/src/app/showcase/briefwijzer/` (showcase, intro, how-it-works)
- `headingfwd-com/src/data/index/page.json` — oorspronkelijke teaser
- `headingfwd_toolkit/tests/promptfoo/` — promptfoo-test met verwijzing naar briefwijzer
