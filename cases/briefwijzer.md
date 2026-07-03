---
title: BriefWijzer
slug: briefwijzer
sector: Communication
status: demo
role: AI engineer
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

## In short

BriefWijzer makes unreadable (government) letters understandable. Your customer takes a
photo of the letter, and the app does the rest: a short, understandable summary, a
directly clickable call-to-action, and an AI-driven chat to ask questions about the
letter. As a bonus, you as the sender see which of your letters are experienced as
unreadable, so you can improve them — and you lower the contact load on your customer
service.

## Problem

Communication is not understandable for a large part of the Netherlands:

- 2 million people in the Netherlands are low-literate
- People who struggle to act on official mail pick up the phone to ask what it's about
- This puts pressure on contact centers
- Services don't match the needs of this audience
- Complicated letters lead to frustration and confusion

## Approach

BriefWijzer is a digital reading aid that makes letters readable for everyone, without
extra work for the sender:

- Short, understandable summary of the key points (max. 5 bullets)
- The call-to-action becomes directly (online) clickable
- Interactive chat function that answers within the context of the letter
- Insight for the sender into which letters are experienced as unreadable

## How it works

**Your customer…**

1. 📨 …receives your letter — but doesn't understand what it says.
2. 📱 …scans the BriefWijzer QR — no app download needed, it opens in the browser.
3. 📷 …takes a photo — uploading multiple pages is possible.

**BriefWijzer gets to work and…**

- 📋 …summarizes the letter in understandable, simple language (max. 5 bullets).
- 👆 …makes actions directly clickable — you configure the call-to-actions shown.
- 💬 …answers questions directly via chat.

## Tech & stack

- 🐍 **Python** — backend processing
- 👁️ **Google Vision** — OCR and document analysis
- 🤖 **Claude Code** — AI development assistant
- 💻 **VSCode** — IDE

The pipeline: OCR reads the letter, RAG/LLM summarizes and answers questions within the
context of the letter.

## Status

**Demo** — working product concept. Positioned as an app for companies and government
bodies that want to make their letters more accessible.
