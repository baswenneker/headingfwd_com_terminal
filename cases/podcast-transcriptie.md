---
title: Podcast transcriptie en segmentering
slug: podcast-transcriptie
sector: Media
status: concept
tags: [Transcriptie, LLM, Audio]
stack: []
sources:
  - headingfwd-com/src/data/index/page.json (teaser "Podcast transcriptie en segmentering")
  - whisperfwd (gerelateerde, echte transcriptie-tech)
---

# Podcast transcriptie en segmentering

## In het kort

Upload je podcast en krijg automatisch een volledige transcriptie én een segmentindeling
met tijdcodes — bijvoorbeeld:

- `0:00–1:30` Introductie
- `1:30–3:00` Samenwerking in de zorg
- …

## Aanpak (op hoofdlijnen)

Audio wordt automatisch omgezet naar tekst (transcriptie), waarna een model de inhoud in
logische segmenten met tijdcodes indeelt. Zo wordt een lange aflevering doorzoekbaar en
makkelijk te navigeren.

## Status

**Concept.** Deze case bestaat als teaser op de oude website (`headingfwd-com`). Er is
binnen de bronnen geen aparte, uitgewerkte showcase of repo specifiek voor de
podcast-segmentering gevonden.

## Gerelateerde, echte techniek: WhisperFWD

> Bron: `whisperfwd/README.md`. **Let op:** WhisperFWD is een ándere applicatie
> (vergaderingen, geen podcasts), maar demonstreert wel de onderliggende
> transcriptie-capaciteit.

WhisperFWD is een macOS-menubalk-app voor het opnemen van vergaderingen, **lokale**
transcriptie en AI-samenvattingen:

- Dual-stream audio (microfoon + systeemgeluid)
- Lokale transcriptie met [WhisperKit](https://github.com/argmaxinc/WhisperKit), model `large-v3-turbo`
- Gestructureerde samenvattingen via de Claude Code CLI
- Output als Obsidian-compatibele Markdown
- Stack: macOS 13+, Apple Silicon, Swift 5.9+

Dit toont aan dat de transcriptie-component van de podcast-case technisch haalbaar en
beproefd is; de podcast-specifieke segmentering met tijdcodes is (nog) niet als los
product uitgewerkt.

## Bronnen

- `headingfwd-com/src/data/index/page.json` — teaser "Podcast transcriptie en segmentering"
- `whisperfwd/` — gerelateerde, werkende transcriptie-app (vergaderingen)
