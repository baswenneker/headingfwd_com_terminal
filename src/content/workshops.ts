/**
 * Workshop offers — the single source of truth for every unlisted offer page.
 *
 * A workshop is a Dutch page Bas shares by link with one company at a time.
 * It renders on the editorial layout like a post or a case, but it is
 * UNLISTED: reachable on its URL and named in `/llms.txt`, yet linked from no
 * page, absent from the sitemap and marked `noindex`. See
 * `docs/adr/0004-unlisted-offer-page.md` and the Visibility section of
 * `CONTEXT.md`.
 *
 * The body is a Markdown string, not a file: with one page there is nothing
 * for a loader to enumerate, and a TypeScript module keeps the page and the
 * `/llms.txt` line reading from one object. It follows the post vocabulary in
 * `CONTEXT.md`: the text before the first `##` is the LEAD, a `##` a numbered
 * SECTION and a `###` a numbered ITEM. Numbers are added by the renderer.
 *
 * One trap: the renderer runs remark-directive, which reads `:30` in a time
 * such as `09:30` as a directive and emits an empty `<div>` inside the
 * paragraph — invalid HTML and a hydration error. Escape the colon (`09\:30`,
 * written `09\\:30` in this template literal).
 */

import type { PostLanguage } from "~/content/posts";

export interface Workshop {
  /** URL segment under `/workshops/`. */
  slug: string;
  title: string;
  /** Small label above the title. */
  kicker: string;
  /** One or two sentences for the meta description and `/llms.txt`. */
  excerpt: string;
  lang: PostLanguage;
  /** ISO date of the last content change. */
  updated: string;
  /** The write-up: Markdown without frontmatter or a leading H1. */
  body: string;
}

export function workshopPath(w: Pick<Workshop, "slug">): string {
  return `/workshops/${w.slug}`;
}

export const AI_CODING_WORKSHOP: Workshop = {
  slug: "ai-coding-workshop",
  title: "Tweedaagse AI coding workshop",
  kicker: "Workshop",
  excerpt:
    "Een herhaalbare manier van werken met coding agents, zodat developers AI consistenter inzetten en de code aan dezelfde engineering-standaarden voldoet.",
  lang: "nl",
  updated: "2026-09-17",
  body: `De adoptie van coding agents (bijvoorbeeld Claude Code, Codex of GitHub Copilot) is in veel teams al hoog, maar de manier waarop developers ze gebruiken verschilt nog sterk. Tegelijk worden tokenkosten zichtbaar, is er zorg over bugs in AI-gegenereerde code, en vertaalt dit zich nog niet in een meetbare productiviteitsverbetering.

Precies dat probleem is het uitgangspunt van deze workshop.

Het is geen productraining voor één tool. Het doel is developers een herhaalbare manier van werken met coding agents te leren, zodat verschillende developers AI consistenter gebruiken en de code die eruit komt aan dezelfde engineering-standaarden voldoet.

We werken met de coding agent die jullie al gebruiken. Het ontwikkelproces zelf moet bruikbaar blijven als het volgende model of de volgende coding agent verschijnt.

## Opzet

Twee dagen op locatie in Delft bij Firma van Buiten, 09\\:30 - 17\\:00. Lunch is inbegrepen, met een borrel na dag twee. Op aanvraag kan de workshop ook bij jullie op locatie. Dat is vooral handig op dag twee, als we met jullie eigen repositories en teamopzet werken.

De workshop is van begin tot eind hands-on. Deelnemers werken op hun eigen laptop met hun eigen licentie voor de coding agent die jullie al gebruiken.

Op dag één werkt iedereen aan hetzelfde kleine oefenproject, zodat we naast elkaar kunnen leggen welke keuzes iedereen maakte en wat dat opleverde. Op dag twee passen deelnemers de workflow toe op echt werk uit hun eigen repositories.

Deelnemers hoeven niet uit hetzelfde team te komen. De groep is maximaal acht personen, zodat er tijdens de oefeningen genoeg tijd is om met iedereen te werken.

## Dag 1: Effectief werken met een coding agent

### Hoe een coding agent werkt

De paar concepten die verklaren waarom agents zich gedragen zoals ze doen: modellen, context, tools, sessies, en waarom resultaten tussen developers verschillen.

### Eerste feature: wat misgaat als je alleen prompt

Iedereen bouwt dezelfde feature. We vergelijken de resultaten en bekijken waarom ogenschijnlijk vergelijkbare prompts heel verschillende implementaties kunnen opleveren.

### Requirements: eerst begrijpen, dan bouwen

De agent inzetten als interviewer in plaats van hem meteen te laten coderen. Ambiguïteit uit de requirements halen voordat de implementatie begint.

### Context engineering: instructies één keer schrijven

Hoe je architectuurinformatie, coding standards, repository-instructies en herbruikbare skills organiseert, zodat de agent op het juiste moment de juiste context krijgt zonder alles in elke prompt te herhalen.

### Contextmanagement

Wanneer je een sessie voortzet, wanneer je met een schone context begint, en hoe je werk overdraagt zonder de belangrijke beslissingen kwijt te raken.

## Dag 2: Van individueel agentgebruik naar een engineeringproces

### Grote features: van requirements naar spec en tickets

Groter werk opdelen in kleine, testbare stukken die betrouwbaar over meerdere agentsessies te implementeren zijn.

### De development loop: bouwen, checken, reviewen, fixen

Een herhaalbare workflow per ticket, met deterministische checks, AI-review met een schone context en menselijk oordeel. We behandelen ook wanneer autonoom agentwerk nuttig is en wanneer het onnodig risico oplevert.

### Jullie backlog: de loop toepassen op jullie eigen code

Deelnemers pakken een echte taak uit hun eigen project en doorlopen de volledige workflow. Dit legt meestal ook ontbrekende documentatie, standaarden of architectuurcontext in de repository bloot.

### Teamopzet: gedeelde instructies, standaarden en skills

De eerste versie van een gedeelde AI-ontwikkelopzet voor het team maken: wat hoort in de repository, welke herbruikbare skills deel je, en wie beheert en onderhoudt ze.

### Kosten, kwaliteit en meten

Waar tokengebruik vandaan komt, hoe je onnodige context en agentwerk vermijdt, en welke metrics bruikbaar zijn om te bepalen of AI de software delivery en kwaliteit daadwerkelijk verbetert.

## Wat deelnemers meenemen

Aan het eind van de workshop hebben deelnemers een gedeelde development loop:

![De development loop als cyclus van zeven stappen: explore, interview, specify, build, check, review, capture, en van capture weer terug naar explore](development-loop.svg)

*explore → interview → specify → build → check → review → capture, en dan weer van voren af aan.*

Ze hebben ook een startset met praktische bestanden en herbruikbare instructies die ze kunnen aanpassen voor hun eigen repositories: repository-instructies, engineering-standaarden en gedeelde agent skills.

Het belangrijkste: ze begrijpen waarom een coding agent een bepaald resultaat oplevert, in plaats van dat gedrag als iets willekeurigs te zien. Dat maakt het veel makkelijker om kwaliteit te verbeteren, context bewust in te zetten en geen tokens te verspillen aan werk dat niets toevoegt.

## Praktisch

Het tarief is op aanvraag. Inbegrepen zijn de voorbereiding, het workshopmateriaal en de startset met gedeelde instructies, standaarden en skills die deelnemers tijdens de workshop opbouwen en mee terugnemen naar hun eigen team.

Bij een workshop in Delft regel ik de locatie, lunch en borrel. Bij een workshop op jullie locatie zijn er van mijn kant geen locatiekosten.

Klinkt dit goed? Stuur me een bericht via [/contact](/contact), dan stuur ik een offerte en kijken we naar data.
`,
};
