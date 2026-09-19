---
title: Podcast transcription and segmentation
slug: podcast-transcription
sector: Media
status: concept
tags: [Transcription, LLM, Audio]
stack: []
sources:
  - headingfwd-com/src/data/index/page.json (teaser "Podcast transcriptie en segmentering")
  - whisperfwd (gerelateerde, echte transcriptie-tech)
---

# Podcast transcription and segmentation

Upload your podcast and get a full transcription back, together with a segment breakdown
carrying timecodes — so a two-hour episode becomes something a listener can navigate and
search instead of scrub through.

## The work

### Approach (high level)

Audio is automatically converted to text (transcription), after which a model divides the
content into logical segments with timecodes. This makes a long episode searchable and
easy to navigate. A breakdown reads like this:

- `0:00–1:30` Introduction
- `1:30–3:00` Collaboration in healthcare
- …

## Outcome

### Status

**Concept.** This idea has not yet been developed into a demo.

### Related tech: WhisperFWD

WhisperFWD is a macOS menu-bar app for recording meetings, with **local** transcription
and AI summaries:

- Dual-stream audio (microphone + system sound)
- Local transcription with [WhisperKit](https://github.com/argmaxinc/WhisperKit), model `large-v3-turbo`
- Structured summaries via the Claude Code CLI
- Output as Obsidian-compatible Markdown
- Stack: macOS 13+, Apple Silicon, Swift 5.9+

This shows that the transcription component of the podcast case is technically feasible and
proven; the podcast-specific segmentation with timecodes has not (yet) been built as a
standalone product.
