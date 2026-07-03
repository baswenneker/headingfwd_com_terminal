---
title: AI Writing Assistant
slug: ai-writing-assistant
sector: Government
status: live
role: Initiator / AI engineer
tags: [LLM, Writing, Marketing, Python, VectorDB]
stack: [Azure OpenAI, Python, Agentic programming, VSCode]
updated: 2025-06-19
sources:
  - headingfwd-demo-playground/src/app/showcase/ai-schrijfhulp/page.tsx
  - headingfwd-demo-playground/src/app/showcase/ai-schrijfhulp/schrijfhulp-demo.tsx
  - headingfwd-com/src/data/index/page.json (teaser "AI Schrijfhulp")
  - dspy-writing-style (gerelateerd R&D-experiment)
---

# AI Writing Assistant

## In short

An AI-powered writing assistant for the editorial team of a large public-sector
organization. The tool rewrites text into a clear, error-free message that meets the
organization's style guide, word lists, style rules and accessibility requirements
(B1 level). One consistent house style for the whole editorial team — while sensitive
data stays inside the organization's own environment.

## Problem

At an organization with one of the most-visited websites in the Netherlands, which sends
millions of letters a year, writing is a core task. Editors have to deliver text that
meets a style guide, word lists, style rules and accessibility requirements. Generic AI
tools (ChatGPT, Copilot) fall short for this:

- No knowledge of the house style or tone of voice
- Generic suggestions without the organization's context
- Inconsistent output across different prompts
- Privacy concerns with sensitive company and personal data

## Approach

I helped shape a custom AI writing assistant from the ground up. We worked in close
co-creation with members of the editorial team. Early on there was suspicion and
resistance; as we collaborated more closely and delivered results, trust and adoption
grew.

The solution runs inside the organization's own environment (an internal URL like
`schrijfhulp.intranet.nl`), so even commercially sensitive and personal data never
leaves the organization.

## How it works

The user pastes a text; the assistant analyzes it and returns a rewritten version per
sentence, with remarks. Examples from the demo — a Dutch-language tool (original →
rewritten):

- "Door de afgelopen week ben ik beezig geweest met het ontwikelen van een nieuwe
  AI-gestuerde schrijfhulp tool." → "Vorige week werkte ik aan het maken van een nieuwe
  AI-gestuurde schrijfhulptool." (simpler, B1, spelling fixes, compound word)
- "…zodat je profesioneler overkomt in je communicatie." → split into two sentences,
  "professioneler" corrected (clarity + spelling)
- "Vervolgens geeft hij suggesties…" → "Vervolgens geeft de tool suggesties…"
  (clearer reference)

The output appears as a table with three columns: **Original sentence · Rewritten
sentence · Remarks**.

**Benefits:**

| Benefit | Explanation |
|---|---|
| 🔒 Data security | Also for commercially sensitive and personal data; everything stays in your own environment |
| ⚡ Efficiency | Instant result, ready while you wait |
| 🎯 Consistency | A style guide is interpreted differently by everyone; AI does it consistently |
| 📚 Word lists | Enforce jargon — or deliberately avoid it |
| 👥 B1 level | Write so the average reader can follow it easily |
| ✨ Everyone can do it | Turns every employee into a good writer |

> "By constantly getting new suggestions, it helps me in the creative process and it
> instantly meets the writing rules we follow!" — Editor

## Tech & stack

- ☁️ **Azure OpenAI LLMs** — LLM API provider
- 🐍 **Python** — backend
- 🤖 **Agentic programming** — AI architecture pattern
- 💻 **VSCode** — IDE
- 🔎 **Vector database** — surfaces the style guide and word lists for the tool

## Status

**Live** — custom client project at a large public-sector organization.
