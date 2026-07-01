/**
 * Canonical case data — THE single source of truth for HeadingFWD's portfolio.
 *
 * Every surface that shows a case derives from this one array:
 *   - `/portfolio` (fullscreen overlay) → list (name + `kind`) and detail (`body`)
 *   - `/llms.txt`  (agent file)         → `caseToAgentMarkdown` per case
 *   - `cases/*.md` (generated archive)  → `pnpm gen:cases` re-emits them
 *
 * Editing a case here updates all of those at once, so they can never drift.
 * The Markdown surfaces (`/llms.txt`, `cases/*.md`) are GENERATED from this
 * module — never hand-edit them.
 *
 * To add a case: append an entry to CASES with a unique slug, the next `n`
 * display index, a one-line `kind`, the metadata fields, and the full write-up
 * as a Markdown string in `body` (no frontmatter, no leading H1).
 */

/** Lifecycle of a case, mirrored by the status legend in the generated README. */
export type CaseStatus = "live" | "demo" | "experiment" | "concept";

/**
 * Publication state — controls where and how a case surfaces, independent of
 * its lifecycle `status`. The two are orthogonal: a `concept` case can be
 * `published` (full teaser), `coming-soon` (placeholder), or `hidden`.
 *
 *   - "published"   — appears everywhere with its full write-up (the default).
 *   - "coming-soon" — stays in the `/portfolio` list with a "coming soon" badge,
 *                     but its detail view shows a placeholder panel instead of
 *                     the write-up. Marked as such in `/llms.txt` and the
 *                     generated archive.
 *   - "hidden"      — excluded from every public surface as if it did not exist:
 *                     `/portfolio`, `/llms.txt` and `cases/*.md`.
 *
 * All surfaces derive their list from `visibleCases()`, so flipping one field
 * updates them in lockstep — the same no-drift guarantee as the rest of CASES.
 */
export type CaseVisibility = "published" | "coming-soon" | "hidden";

/**
 * A demo/reference video for a case.
 *
 * Single source for both the click-to-play preview in the `/portfolio` overlay
 * (thumbnail from the YouTube `id`, embedded on click) and the plain Markdown
 * link emitted on the agent/archive surfaces (`/llms.txt`, `cases/*.md`), which
 * can't play video. Populate `videos` instead of hand-writing links in `body`.
 */
export interface CaseVideo {
  /** YouTube video id — drives the thumbnail and the embedded player. */
  id: string;
  /** Canonical watch URL, honoured verbatim on the link surfaces. */
  url: string;
  /** Short label shown beneath the preview. */
  title: string;
  /** Optional one-line caption. */
  note?: string;
  /** Optional outcome marker: a failed (❌) vs. working (✅) attempt. */
  result?: "fail" | "success";
}

/**
 * A single portfolio case with all of its details in one place.
 *
 * Required fields drive the visible surfaces; the optional metadata fields
 * (`role`, `client`, `links`, `sources`, `updated`, `image`, `caseUrl`,
 * `videos`) are preserved for provenance and future UI without being required
 * everywhere.
 */
export interface Case {
  /** URL-safe identifier; also the generated Markdown filename. */
  slug: string;
  /** Two-digit display index shown in the list ("01", "02", …). */
  n: string;
  /** Case title, shown prominently in the list and detail views. */
  title: string;
  /** One-line outcome/role summary — the `/portfolio` list subtitle. */
  kind: string;
  /** Sector / domain label. */
  sector: string;
  /** Lifecycle status. */
  status: CaseStatus;
  /**
   * Publication state; omitted means "published". Flip to "coming-soon" to
   * tease a case without a write-up, or "hidden" to pull it from every surface.
   * See {@link CaseVisibility}.
   */
  visibility?: CaseVisibility;
  /** My role on the engagement (frontmatter `rol`). */
  role?: string;
  /** Client name, when not anonymised (frontmatter `klant`). */
  client?: string;
  /** Methodology / technology labels, rendered as chips. */
  tags: string[];
  /** Concrete tools / models used. Empty for non-build (e.g. PM) cases. */
  stack: string[];
  /** External links (live product, demo video, LinkedIn post). */
  links?: string[];
  /** Source references the write-up was extracted from. */
  sources?: string[];
  /** ISO date the case was last revised. */
  updated?: string;
  /** Optional hero image for the detail view. */
  image?: { src: string; alt: string };
  /** Optional external "read the full case" URL. */
  caseUrl?: string;
  /** Demo/reference videos, shown as click-to-play previews in the overlay. */
  videos?: CaseVideo[];
  /** Full write-up as Markdown (no frontmatter, no leading H1). */
  body: string;
}

export const CASES: Case[] = [
  {
    slug: "ai-schrijfhulp",
    n: "01",
    title: "AI Schrijfhulp",
    kind: "AI-schrijfhulp die de huisstijl bewaakt — data blijft in eigen omgeving",
    sector: "Overheid",
    status: "live",
    role: "Initiatiefnemer / AI engineer",
    tags: ["LLM", "Schrijven", "Marketing", "Python", "VectorDB"],
    stack: ["Azure OpenAI", "Python", "Agentic programming", "VSCode"],
    sources: ["headingfwd-demo-playground/src/app/showcase/ai-schrijfhulp/page.tsx", "headingfwd-demo-playground/src/app/showcase/ai-schrijfhulp/schrijfhulp-demo.tsx", "headingfwd-com/src/data/index/page.json (teaser \"AI Schrijfhulp\")", "dspy-writing-style (gerelateerd R&D-experiment)"],
    updated: "2025-06-19",
    body: `
## In het kort

Een AI-gestuurde schrijfhulp voor de redactie van een grote publieke organisatie.
De tool herschrijft teksten naar een heldere, foutloze boodschap die voldoet aan de
schrijfwijzer, woordenlijsten, stijlregels en toegankelijkheidseisen (B1-niveau) van de
organisatie. Eén consistente huisstijl voor het hele redactieteam — terwijl gevoelige
data binnen de eigen omgeving blijft.

## Probleem

Bij een organisatie met een van de meest bezochte websites van Nederland, die jaarlijks
miljoenen brieven verstuurt, is schrijven een kerntaak. Redacteuren moeten teksten
opleveren die voldoen aan een schrijfwijzer, woordenlijsten, stijlregels en
toegankelijkheidseisen. Generieke AI-tools (ChatGPT, Copilot) schieten daarvoor tekort:

- Geen kennis van de huisstijl of tone of voice
- Algemene suggesties zonder context van de organisatie
- Inconsistente output bij verschillende prompts
- Privacy-zorgen bij gevoelige bedrijfs- en persoonsdata

## Aanpak

Ik heb aan de wieg gestaan van een maatwerk AI-schrijfhulp. We werkten in nauwe
co-creatie met leden van de redactie. In het begin was er argwaan en weerstand;
naarmate we nauwer samenwerkten en resultaten boekten, groeide het vertrouwen en de
acceptatie.

De oplossing draait in de eigen omgeving van de organisatie (een interne URL zoals
\`schrijfhulp.intranet.nl\`), zodat ook bedrijfsgevoelige en persoonsdata de organisatie
niet verlaat.

## Hoe het werkt

De gebruiker plakt een tekst; de schrijfhulp analyseert en levert per zin een
herschreven versie met opmerkingen. Voorbeelden uit de demo (origineel → herschreven):

- "Door de afgelopen week ben ik beezig geweest met het ontwikelen van een nieuwe
  AI-gestuerde schrijfhulp tool." → "Vorige week werkte ik aan het maken van een nieuwe
  AI-gestuurde schrijfhulptool." (eenvoudiger, B1, spelfouten, samenstelling)
- "…zodat je profesioneler overkomt in je communicatie." → losgetrokken in twee zinnen,
  "professioneler" gecorrigeerd (duidelijkheid + spelling)
- "Vervolgens geeft hij suggesties…" → "Vervolgens geeft de tool suggesties…"
  (duidelijkere verwijzing)

De output verschijnt als tabel met drie kolommen: **Originele zin · Herschreven zin ·
Opmerkingen**.

**Voordelen:**

| Voordeel | Toelichting |
|---|---|
| 🔒 Data­veiligheid | Ook voor bedrijfsgevoelige en persoonsdata; alles blijft in de eigen omgeving |
| ⚡ Efficiëntie | Direct resultaat, klaar terwijl je wacht |
| 🎯 Consistentie | Een schrijfwijzer wordt door iedereen anders geïnterpreteerd; AI doet dat consistent |
| 📚 Woordenlijsten | Jargon afdwingen óf juist vermijden |
| 👥 B1-niveau | Schrijven zodat de gemiddelde Nederlander het goed kan volgen |
| ✨ Iedereen kan het | Maakt van elke medewerker een goede schrijver |

> "Door steeds nieuwe suggesties te krijgen, helpt het me in het creatieve proces en
> voldoet het gelijk aan de schrijfregels die we hanteren!" — Redacteur

## Tech & stack

- ☁️ **Azure OpenAI LLMs** — LLM API-provider
- 🐍 **Python** — backend
- 🤖 **Agentic programming** — AI-architectuurpatroon
- 💻 **VSCode** — IDE
- 🔎 **Vectordatabase** — ontsluit de schrijfwijzer en woordenlijsten voor de tool

## Status

**Live** — maatwerk client-project bij een grote publieke organisatie.
`,
  },
  {
    slug: "hintsay-linkedin",
    n: "02",
    title: "Hintsay: AI-schrijfassistent voor LinkedIn",
    kind: "Maanden aan LinkedIn-content in minuten, in je eigen stem",
    sector: "Marketing",
    status: "live",
    role: "Maker / AI engineer",
    tags: ["LLM", "Marketing", "SaaS"],
    stack: ["React", "Advanced language models", "Cloud infrastructure"],
    links: ["https://hintsay.com"],
    sources: ["headingfwd-demo-playground/src/app/cases/hintsay/page.tsx", "headingfwd-com/src/data/index/page.json (teaser \"LinkedIn Schrijfhulp\")", "vibes-chrome-li-extension (gerelateerd, los experiment)"],
    updated: "2025-06-19",
    body: `
## In het kort

Hintsay is een AI-powered schrijfassistent die professionals helpt om engaging
LinkedIn-content te maken en hun personal brand te versterken. De belofte:
*"Generate months of LinkedIn content in minutes."* Genereer maanden aan content in
enkele minuten, met behoud van je eigen stem en stijl.

## Probleem

Professionals worstelen met consistente, engaging content op LinkedIn:

- Gebrek aan tijd voor regelmatige contentcreatie
- Writer's block en gebrek aan inspiratie
- Onzekerheid over wat resoneert met de doelgroep
- Moeite met het vinden van de juiste tone of voice
- Inconsistente posting-frequentie schaadt de zichtbaarheid

## Aanpak

Een slimme schrijfassistent die contentcreatie versnelt én verbetert:

- AI-gegenereerde content op basis van bewezen templates
- Topic-suggesties vanuit keywords
- Personalisatie op basis van het LinkedIn-profiel
- Ondersteuning voor Engels en Nederlands
- Behoud van persoonlijke stem en stijl

**UX-designproces:**

| Fase | Activiteiten |
|---|---|
| Research & Discovery | Analyse van LinkedIn posting-patterns, user interviews met content creators, competitive analysis, performance-data |
| Design & Prototyping | Minimalistisch/clean design, focus op snelheid, iteratieve UI/UX, A/B-testing van features |
| AI Integration | Training op succesvolle posts, continue modelverbetering, personalisatie-algoritmes, quality assurance |

## Hoe het werkt

**Content Generatie**

- AI-gegenereerde posts op basis van keywords
- Bewezen templates voor verschillende content types
- Personalisatie op basis van LinkedIn-profiel
- Aanpasbare tone of voice
- Meertalige ondersteuning (EN/NL)
- Real-time preview en editing

**Content Strategie**

- Topic-suggesties en brainstorming
- Content-kalenderplanning
- Performance insights *(coming soon)*
- Audience engagement tracking
- Best practices en tips
- Content-diversificatieadvies

## Impact & resultaten

| Cijfer | Betekenis |
|---|---|
| 10× | Sneller content creëren |
| 7 dagen | Gratis trial-periode |
| 2 talen | Engels en Nederlands |
| ∞ | Content-mogelijkheden |

## Tech & stack

- **Frontend & UX**: moderne React-interface, real-time content preview, responsive design, snelle laadtijden
- **AI & Backend**: advanced language models, continuous learning pipeline, secure API-architectuur, schaalbare cloud-infrastructuur

## Key takeaways

1. **AI als assistent, niet als vervanging** — gebruikers willen controle houden over hun content.
2. **Snelheid is essentieel** — professionals hebben weinig tijd; elke seconde telt.
3. **Context en personalisatie** — generieke content werkt niet; personalisatie is cruciaal.
4. **Continue verbetering** — LinkedIn-algoritmes veranderen constant; de tool moet meebewegen.

## Status

**Live** — SaaS-product, bereikbaar via [hintsay.com](https://hintsay.com).
`,
  },
  {
    slug: "myworq",
    n: "03",
    title: "MyWorq: medewerkersapp voor de tuinbouw",
    kind: "Medewerkersapp voor de tuinbouw — live bij duizenden gebruikers",
    sector: "Tuinbouw",
    status: "live",
    role: "Product Manager",
    client: "bQurius",
    tags: ["Mobiele App", "Product Management", "Design Thinking"],
    stack: [],
    links: ["https://www.youtube.com/watch?v=G3QL3dCgkOg"],
    sources: ["headingfwd-demo-playground/src/app/showcase/myworq/page.tsx", "headingfwd-demo-playground/src/app/showcase/myworq/myworq-intro.tsx", "headingfwd-demo-playground/src/app/showcase/myworq/process-ticker.tsx"],
    updated: "2025-06-19",
    body: `
## In het kort

Een medewerkersapp voor de tuinbouwsector, met focus op medewerkertevredenheid,
productiviteit en samenwerking. Mijn rol: **product manager**. De app is inmiddels live
en wordt gebruikt door duizenden medewerkers in de tuinbouw.

## Het verhaal

Met mijn Westlandse roots was de opdracht bij MyWorq een thuiswedstrijd. Ik werd gevraagd
om als product manager het Data-team van **bQurius** te helpen een innovatieve
medewerkersapp te ontwikkelen, specifiek voor de tuinbouwsector.

Ik werkte nauw samen met een collega om de behoeftes van gebruikers in kaart te brengen:
de teamleiders in de kassen en de mensen die in de kas werken. Nadat we de contouren van
de app hadden uitgewerkt, zochten we een software-agency die de app kon bouwen.

Na 2 jaar heb ik de rol overgedragen aan de collega met wie ik al die tijd optrok. De app
is inmiddels live en wordt gebruikt door duizenden medewerkers in de tuinbouwsector.
Trots op dit project!

## Probleem

De tuinbouwsector kampt met specifieke uitdagingen rond personeelsmanagement:

- Hoog personeelsverloop en moeilijk vindbaar personeel
- Complexe planning door seizoensgebonden werk
- Taalbarrières bij internationale werknemers
- Gebrek aan digitale tools voor werknemers in het veld
- Inefficiënte communicatie tussen management en uitvoerend personeel

## Oplossing

Een gebruiksvriendelijke medewerkersapp, specifiek ontworpen voor de tuinbouw:

- Intuïtieve interface in meerdere talen
- Real-time werkplanning en taakbeheer
- Directe communicatie tussen teams en leidinggevenden
- Gamification-elementen voor hogere betrokkenheid
- Integratie met bestaande HR- en planningssystemen

## Werkwijze

1. 🔍 **Onderzoek** — gesprekken met klanten om behoeftes en pijnpunten te begrijpen
2. ✏️ **Schetsen** — schetsen hoe een nieuwe feature eruit kan zien
3. 🎨 **Ontwerpen** — met een UX/UI-designer het idee uitwerken in een prototype
4. 💻 **Ontwikkelen** — de software engineers bouwen de feature in de app
5. 🧪 **Testen** — de nieuwe feature grondig testen
6. 🚀 **Uitrol** — de bijgewerkte app uitrollen naar gebruikers
7. 🔄 **Itereer** — data analyseren, feedback verzamelen en het proces begint opnieuw

## Rol & stack

Dit is een **product-managementcase**, geen eigen development-project: de app is gebouwd
door een externe software-agency. Mijn bijdrage zat in onderzoek, productdefinitie,
design thinking en het aansturen van het bouwproces. Er is daarom geen eigen tech-stack
te vermelden.

## Status

**Live** — de app is in productie en wordt gebruikt door duizenden medewerkers in de
tuinbouwsector. Rol na 2 jaar overgedragen. Demovideo: YouTube \`G3QL3dCgkOg\`.
`,
  },
  {
    slug: "briefwijzer",
    n: "04",
    title: "BriefWijzer",
    kind: "Onleesbare brieven begrijpelijk maken met één foto",
    sector: "Communicatie",
    status: "demo",
    role: "AI engineer",
    tags: ["RAG", "OCR", "LLM", "Marketing"],
    stack: ["Python", "Google Vision", "Claude Code", "VSCode"],
    sources: ["headingfwd-demo-playground/src/app/showcase/briefwijzer/page.tsx", "headingfwd-demo-playground/src/app/showcase/briefwijzer/components/briefwijzer-intro.tsx", "headingfwd-demo-playground/src/app/showcase/briefwijzer/components/how-it-works.tsx", "headingfwd-com/src/data/index/page.json (teaser \"Briefwijzer\")", "headingfwd_toolkit (promptfoo-test verwijst naar briefwijzer)"],
    updated: "2025-07-03",
    body: `
## In het kort

BriefWijzer maakt onleesbare (overheids)brieven begrijpelijk. Jouw klant maakt een foto
van de brief, en de app doet de rest: een korte, begrijpelijke samenvatting, een direct
klikbare call-to-action en een AI-gedreven chat om vragen over de brief te stellen.
Als bonus zie je als afzender welke van je brieven als onleesbaar worden ervaren, zodat
je ze kunt verbeteren — en je verlaagt de contactdruk op je klantenservice.

## Probleem

Communicatie is voor een groot deel van Nederland niet begrijpelijk:

- 2 miljoen mensen in Nederland zijn laaggeletterd
- Mensen met beperkt doenvermogen pakken de telefoon om te vragen waar het over gaat
- Dit legt druk op contactcenters
- De dienstverlening sluit niet aan op deze doelgroep
- Ingewikkelde brieven leiden tot frustratie en onbegrip

## Aanpak

BriefWijzer is een digitale leeshulp die brieven leesbaar maakt voor iedereen, zónder
extra werk voor de afzender:

- Korte, begrijpelijke samenvatting van de belangrijkste punten (maximaal 5 bullets)
- De call-to-action wordt direct (online) klikbaar
- Interactieve chat-functie die antwoordt binnen de context van de brief
- Inzicht voor de afzender in welke brieven als onleesbaar worden ervaren

## Hoe het werkt

**Jouw klant…**

1. 📨 …ontvangt jouw brief — maar begrijpt niet wat er staat.
2. 📱 …scant de BriefWijzer-QR — de app hoeft niet gedownload te worden, maar opent in de browser.
3. 📷 …maakt een foto — meerdere pagina's uploaden kan.

**BriefWijzer gaat aan de slag en…**

- 📋 …vat de brief samen in begrijpelijke, eenvoudige taal (max. 5 bullets).
- 👆 …maakt acties direct klikbaar — jij configureert de call-to-actions die getoond worden.
- 💬 …beantwoordt vragen direct via chat.

## Tech & stack

- 🐍 **Python** — backend processing
- 👁️ **Google Vision** — OCR en documentanalyse
- 🤖 **Claude Code** — AI development assistant
- 💻 **VSCode** — IDE

De pijplijn: OCR leest de brief, RAG/LLM vat samen en beantwoordt vragen binnen de
context van de brief.

## Status

**Demo** — werkend productconcept. Gepositioneerd als app voor bedrijven en overheden
die hun brieven toegankelijker willen maken.
`,
  },
  {
    slug: "ai-personal-trainer",
    n: "05",
    title: "AI Personal Trainer",
    kind: "Maatwerk-AI die fitnessvideo's analyseert waar ChatGPT faalt",
    sector: "Sport & Fitness",
    status: "experiment",
    role: "Maker / AI engineer",
    tags: ["LLM", "Multimodaal", "Bewegingsherkenning", "Python"],
    stack: ["Google Gemini 2.5 Pro", "Python", "ChatGPT", "GitHub Copilot", "VSCode"],
    links: ["https://www.linkedin.com/posts/baswenneker_kan-chatgpt-een-personal-trainer-vervangen-activity-7330482395533430785-CqxF/", "https://www.linkedin.com/feed/update/urn:li:activity:7338437372616826883/"],
    sources: ["headingfwd-demo-playground/src/app/showcase/ai-personal-trainer/page.tsx"],
    updated: "2025-06-19",
    videos: [
      {
        id: "rrvgrcJ_v0M",
        url: "https://www.youtube.com/watch?v=rrvgrcJ_v0M",
        result: "fail",
        title: "Poging 1 — ChatGPT kan geen video analyseren",
        note: "ChatGPT kan de video niet analyseren en geeft generieke adviezen die niet aansluiten bij de werkelijke uitvoering.",
      },
      {
        id: "9YoU4e1Ow3Q",
        url: "https://youtube.com/shorts/9YoU4e1Ow3Q",
        result: "success",
        title: "Poging 2 — Maatwerk AI Personal Trainer",
        note: "Met maatwerk software analyseert de AI bewegingen real-time en geeft specifieke, technische feedback met visuele annotaties.",
      },
      {
        id: "3GeEfHs6dTo",
        url: "https://www.youtube.com/watch?v=3GeEfHs6dTo",
        title: "Demo 1 — Squat Clean-analyse",
        note: "Real-time analyse van een clean met directe visuele feedback.",
      },
      {
        id: "lgP9zCadeLo",
        url: "https://www.youtube.com/watch?v=lgP9zCadeLo",
        title: "Demo 2 — Hang Squat Snatch-analyse",
        note: "Gedetailleerde techniekanalyse van de snatch-beweging.",
      },
    ],
    body: `
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
`,
  },
  {
    slug: "chatbot-vraagbaak",
    n: "06",
    title: "Chatbot: Vraagbaak voor je team",
    kind: "Chatten met je handleidingen in plaats van zoeken",
    sector: "Overheid",
    status: "concept",
    visibility: "coming-soon",
    tags: ["RAG", "LLM", "Chatbot", "Marketing"],
    stack: [],
    sources: ["headingfwd-demo-playground/src/data/projects.json (entry \"Chatbot: Vraagbaak voor je team\")", "headingfwd-demo-playground/src/app/showcase/coming-soon/page.tsx"],
    updated: "2025-06-19",
    body: `
## In het kort

Een chatbot die fungeert als vraagbaak voor een team en veel tijd bespaart: chatten in
plaats van handleidingen doorlezen.

## Aanpak (op hoofdlijnen)

Een klassieke **RAG-chatbot**: documentatie/handleidingen worden ontsloten via
Retrieval-Augmented Generation, zodat teamleden hun vraag in natuurlijke taal kunnen
stellen en direct een antwoord met context krijgen — in plaats van zelf te zoeken in
handleidingen.

## Status

**Concept.** Dit idee is nog niet uitgewerkt tot een demo.
`,
  },
  {
    slug: "podcast-transcriptie",
    n: "07",
    title: "Podcast transcriptie en segmentering",
    kind: "Podcasts automatisch transcriberen en segmenteren met tijdcodes",
    sector: "Media",
    status: "concept",
    visibility: "coming-soon",
    tags: ["Transcriptie", "LLM", "Audio"],
    stack: [],
    sources: ["headingfwd-com/src/data/index/page.json (teaser \"Podcast transcriptie en segmentering\")", "whisperfwd (gerelateerde, echte transcriptie-tech)"],
    body: `
## In het kort

Upload je podcast en krijg automatisch een volledige transcriptie én een segmentindeling
met tijdcodes — bijvoorbeeld:

- \`0:00–1:30\` Introductie
- \`1:30–3:00\` Samenwerking in de zorg
- …

## Aanpak (op hoofdlijnen)

Audio wordt automatisch omgezet naar tekst (transcriptie), waarna een model de inhoud in
logische segmenten met tijdcodes indeelt. Zo wordt een lange aflevering doorzoekbaar en
makkelijk te navigeren.

## Status

**Concept.** Dit idee is nog niet uitgewerkt tot een demo.

## Gerelateerde techniek: WhisperFWD

WhisperFWD is een macOS-menubalk-app voor het opnemen van vergaderingen, **lokale**
transcriptie en AI-samenvattingen:

- Dual-stream audio (microfoon + systeemgeluid)
- Lokale transcriptie met [WhisperKit](https://github.com/argmaxinc/WhisperKit), model \`large-v3-turbo\`
- Gestructureerde samenvattingen via de Claude Code CLI
- Output als Obsidian-compatibele Markdown
- Stack: macOS 13+, Apple Silicon, Swift 5.9+

Dit toont aan dat de transcriptie-component van de podcast-case technisch haalbaar en
beproefd is; de podcast-specifieke segmentering met tijdcodes is (nog) niet als los
product uitgewerkt.
`,
  },
];

/** Resolve a case's publication state, treating an omitted field as published. */
export function caseVisibility(c: Case): CaseVisibility {
  return c.visibility ?? "published";
}

/** True when the case must not appear on any public surface. */
export function isHiddenCase(c: Case): boolean {
  return caseVisibility(c) === "hidden";
}

/** True when the case is a teaser: still listed, but with a placeholder detail. */
export function isComingSoonCase(c: Case): boolean {
  return caseVisibility(c) === "coming-soon";
}

/**
 * The cases shown on public surfaces: everything except `hidden` ones.
 *
 * The `/portfolio` overlay, `/llms.txt` and the generated `cases/*.md` archive
 * all derive their list from this, so a `hidden` case disappears from every
 * surface at once — the same single-source guarantee as CASES itself.
 */
export function visibleCases(cases: Case[] = CASES): Case[] {
  return cases.filter((c) => !isHiddenCase(c));
}

/**
 * Demote the Markdown heading levels inside a case body by one, so its `##`
 * sections nest under the `##` case heading in the generated agent file.
 */
function demoteHeadings(body: string): string {
  return body.replace(
    /^(#{2,5}) /gm,
    (_match, hashes: string) => "#".repeat(hashes.length + 1) + " ",
  );
}

/**
 * Render one case as a Markdown block for the agent file (`/llms.txt`):
 * a heading, a compact metadata line, and the (heading-demoted) body.
 */
export function caseToAgentMarkdown(c: Case): string {
  const meta = [`Sector: ${c.sector}`, `Status: ${c.status}`];
  if (c.role) meta.push(`Rol: ${c.role}`);
  if (c.client) meta.push(`Klant: ${c.client}`);

  const lines = [
    `## ${c.n} — ${c.title}`,
    `_${c.kind}_`,
    "",
    meta.join(" · "),
    `Tags: ${c.tags.join(", ")}`,
  ];
  if (c.stack.length > 0) lines.push(`Stack: ${c.stack.join(", ")}`);
  if (c.links && c.links.length > 0) lines.push(`Links: ${c.links.join(" · ")}`);
  if (isComingSoonCase(c)) {
    lines.push(
      "",
      "> Coming soon — de volledige uitwerking van deze case volgt binnenkort.",
    );
  }
  lines.push("", demoteHeadings(c.body));
  if (c.videos && c.videos.length > 0) {
    lines.push("", "### Video's");
    for (const v of c.videos) {
      const mark = v.result === "fail" ? "❌ " : v.result === "success" ? "✅ " : "";
      const note = v.note ? ` — ${v.note}` : "";
      lines.push(`- ${mark}[${v.title}](${v.url})${note}`);
    }
  }
  return lines.join("\n");
}
