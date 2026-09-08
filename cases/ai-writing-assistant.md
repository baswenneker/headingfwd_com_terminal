---
title: AI Writing Assistant
slug: ai-writing-assistant
sector: Government
status: live
period: Q1 2025
role: Initiator / AI engineer
tags: [LLM, Writing, Marketing, Python, VectorDB]
stack: [Azure OpenAI, Python, Agentic architecture, VSCode]
updated: 2026-07-10
sources:
  - headingfwd-demo-playground/src/app/showcase/ai-schrijfhulp/page.tsx
  - headingfwd-demo-playground/src/app/showcase/ai-schrijfhulp/schrijfhulp-demo.tsx
  - headingfwd-com/src/data/index/page.json (teaser "AI Schrijfhulp")
  - dspy-writing-style (gerelateerd R&D-experiment)
---

# AI Writing Assistant

## In short

A generative-AI writing assistant for a large public-sector organization. It rewrites
any text to match the in-house style guide, approved word lists and B1 (plain-language)
accessibility level — without a single sentence ever leaving the organization's own
environment. Editors paste a draft and get sentence-by-sentence suggestions they can
accept, adjust or ignore, so they stay fully in control.

## Problem

Editors here work across high-traffic websites and large letter runs, and everything
they publish has to stay consistent: the style guide, the approved terminology, and
B1-level plain language so the average reader actually understands it. Doing that by
hand, at this volume, is slow and easy to get wrong.

Generic AI tools could help with the writing itself, but they came with two
dealbreakers: they don't know the organization's house style, and sending sensitive
government text to an external cloud was simply not an option on privacy grounds.

## Approach

Instead of dropping a finished tool on the team, I built it together with the editors.
Early scepticism turned into ownership by shipping small, showing real results on their
own texts, and adapting the tool to the way they actually work.

Just as important: the assistant runs entirely inside the organization's own
environment. Sensitive data never leaves the building — and that is precisely what made
adoption possible.

## How it works

An editor pastes a piece of text. The assistant rewrites it sentence by sentence and
returns the result as a three-column table — **Original · Rewritten · Remarks** — so
nothing is a black box: you see exactly what changed and why.

Behind the scenes, it retrieves the relevant style-guide rules and word-list entries
for each sentence, applies them, and flags anything worth a closer look. The editor
decides what to keep.

The output appears as a table with three columns: **Original sentence · Rewritten
sentence · Remarks**.

**Benefits:**

| Benefit | Explanation |
|---|---|
| 🔒 Data security | Every sentence stays inside your own environment — nothing goes to an external cloud. |
| ⚡ Efficiency | Instant rewrites, ready while you wait — no more checking style line by line. |
| 🎯 Consistency | The same style guide, applied the same way, every single time. |
| 📚 Word lists | Enforce preferred terms and avoid jargon on purpose, not from memory. |
| 👥 B1 level | Rewrites aim for plain language the average reader genuinely understands. |
| ✨ Everyone can write well | Turns every employee into a confident writer — not just the editors. |

> "By constantly getting new suggestions, it helps me in the creative process and it
> instantly meets the writing rules we follow!" — Editor

## Tech & stack

- ☁️ **Azure OpenAI LLMs** — LLM provider, hosted within the organization's own Azure tenant
- 🐍 **Python** — backend
- 🤖 **Agentic architecture** — the assistant reasons per sentence and calls the right rules
- 💻 **VSCode** — development environment
- 🔎 **Vector database** — retrieves the matching style-guide rules and word-list entries per sentence

## Status

**Live** — a custom client project running in production at a large public-sector
organization.
