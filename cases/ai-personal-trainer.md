---
title: AI Personal Trainer
slug: ai-personal-trainer
sector: Sports & Fitness
status: experiment
role: Maker / AI engineer
tags: [LLM, Multimodal, Motion recognition, Python]
stack: [Google Gemini 2.5 Pro, Python, ChatGPT, GitHub Copilot, VSCode]
updated: 2025-06-19
links:
  - https://www.linkedin.com/posts/baswenneker_kan-chatgpt-een-personal-trainer-vervangen-activity-7330482395533430785-CqxF/
  - https://www.linkedin.com/feed/update/urn:li:activity:7338437372616826883/
sources:
  - headingfwd-demo-playground/src/app/showcase/ai-personal-trainer/page.tsx
---

# AI Personal Trainer

## In short

Software that gives feedback on fitness videos, just like a coach or personal trainer
would. The story: an experiment with **ChatGPT as a personal trainer fails**, while
a **custom AI solution succeeds**. With custom software you can analyze complex movements
in video and give technical, personalized coaching on them.

## Problem

I was curious how far the multimodal capabilities of today's LLMs reach — models that
understand text, sound, images and video. For this I used videos I had earlier sent to my
own personal trainer. After uploading them to ChatGPT I only got generic, unspecific
feedback. No available model could analyze the movements accurately; when asked for visual
feedback it generated irrelevant images.

## Approach

So I built a custom solution: an AI-powered virtual Olympic coach that poses as the
world-famous weightlifting coach
[Bob Takano](https://www.takanoweightlifting.com/).

- **Prompt engineering** based on the methodology of a top weightlifting coach
- **Google Gemini 2.5 Pro** for frame-by-frame movement analysis
- A **Python tool** for slowing down the video and a visual feedback overlay
- Result: technically accurate, personalized coaching

### ChatGPT vs. custom

| ChatGPT — fails at video analysis of sports movements | Custom — AI-powered virtual Olympic coach |
|---|---|
| No available model can analyze movements accurately | Prompt engineering based on a top weightlifting coach's methodology |
| Feedback is generic and not specific to the technique shown | Google Gemini 2.5 Pro for frame-by-frame movement analysis |
| When asked for visual feedback it generates irrelevant images | Python tool for slowing down the video and a visual feedback overlay |
| Movement recognition is missing entirely | Technically accurate, personalized coaching |

The two attempts (attempt 1 with ChatGPT, attempt 2 with the custom coach) and two
technique analyses are shown as playable videos at the bottom of this case.

## Tech & stack

- 💬 **ChatGPT** — macOS app (first, failed attempt)
- 🤖 **Google AI Studio** — Gemini 2.5 Pro (multimodal video analysis)
- 🧑‍💻 **GitHub Copilot** — coding agent
- 💻 **VSCode** — IDE
- 🐍 **Python** — tool for slowing down video and the feedback overlay

## Status

**Experiment** — my own R&D, shared via LinkedIn with demo videos. It shows that generic
multimodal models fall short for movement analysis, while a custom approach with Gemini
2.5 Pro + a Python pipeline does work.

## Videos

- ❌ [Attempt 1 — ChatGPT can't analyze video](https://www.youtube.com/watch?v=rrvgrcJ_v0M) — ChatGPT can't analyze the video and gives generic advice that doesn't match the actual execution.
- ✅ [Attempt 2 — Custom AI Personal Trainer](https://youtube.com/shorts/9YoU4e1Ow3Q) — With custom software the AI analyzes movements in real time and gives specific, technical feedback with visual annotations.
- [Demo 1 — Squat Clean analysis](https://www.youtube.com/watch?v=3GeEfHs6dTo) — Real-time analysis of a clean with direct visual feedback.
- [Demo 2 — Hang Squat Snatch analysis](https://www.youtube.com/watch?v=lgP9zCadeLo) — Detailed technique analysis of the snatch movement.
