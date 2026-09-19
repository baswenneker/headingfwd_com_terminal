import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import {
  CONTACT,
  SITE_DESCRIPTION,
  SPECIALTIES,
} from "~/content/site-content";
// Canonical production origin + brand name. `metadataBase` lets Next resolve
// every relative URL below (canonical, Open Graph, icons) to an absolute URL,
// which crawlers and social scrapers require.
import { socialMeta } from "~/config/metadata";
import {
  ORGANIZATION_ID,
  PERSON_ID,
  SITE_NAME,
  SITE_URL,
} from "~/config/site";

const TITLE = "HeadingFWD — AI Engineering & Consultancy";
// The third hand-kept variant of one sentence, until #13 F6. It is derived
// from INTRO now, in site-content.ts, like the hero paragraph is.
const DESCRIPTION = SITE_DESCRIPTION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s — HeadingFWD",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "AI engineering",
    "Generative AI",
    "AI agents",
    "agentic workflows",
    "RAG",
    "AI consultancy",
    "AI strategy",
    "LLM",
    "agentic coding training",
    "Bas Wenneker",
    "HeadingFWD",
  ],
  authors: [{ name: "Bas Wenneker", url: CONTACT.linkedin }],
  creator: "Bas Wenneker",
  publisher: SITE_NAME,
  // Explicitly allow indexing so crawlers never treat the SPA as noindex.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Open Graph, Twitter and the canonical from the same builder every page
  // uses (~/config/metadata). No `images` is passed on purpose: an explicit
  // entry beats Next's `opengraph-image` file convention, so the generated
  // card in src/app/opengraph-image.tsx would never be used.
  //
  // These are the site-wide DEFAULTS. Next replaces `openGraph` and `twitter`
  // wholesale for a page that sets them, which is why every page sets both.
  ...socialMeta({ title: TITLE, description: DESCRIPTION, path: "/" }),
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "icon", type: "image/svg+xml", url: "/favicon.svg" },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      url: "/favicon-16x16.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      url: "/favicon-32x32.png",
    },
    { rel: "apple-touch-icon", sizes: "180x180", url: "/apple-touch-icon.png" },
  ],
  manifest: "/site.webmanifest",
};

// Note: no `maximumScale` / `userScalable` restriction — visitors must be able
// to pinch-zoom the page (WCAG 1.4.4 Resize Text).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0e11",
};

// Structured data (schema.org) so search engines can model the site as an
// organisation and a person, and connect the two. Rendered as a single JSON-LD
// graph in the document head.
/**
 * Where HeadingFWD is based. Shared by the organisation and the person, which
 * is the pair a search engine uses to place a one-person consultancy on a map
 * and in local results. Street level is deliberately absent: the city is what
 * is public.
 */
const ADDRESS = {
  "@type": "PostalAddress",
  addressLocality: "Delft",
  addressCountry: "NL",
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": ORGANIZATION_ID },
    },
    {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      url: SITE_URL,
      description:
        "AI engineering & consultancy — building agents, assistants and AI " +
        "workflows that reach production.",
      logo: `${SITE_URL}/android-chrome-512x512.png`,
      image: `${SITE_URL}/android-chrome-512x512.png`,
      founder: { "@id": PERSON_ID },
      address: ADDRESS,
      // Where the work is done, not where a client happens to sit: Dutch
      // engagements on site, European ones remote.
      areaServed: ["NL", "EU"],
      sameAs: [CONTACT.linkedin],
    },
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: "Bas Wenneker",
      jobTitle: "AI Lead / Engineer",
      // Email deliberately omitted from structured data to keep the address out
      // of page source; LinkedIn (sameAs) is the public contact channel. The
      // terminal chat still relays messages to Bas server-side.
      url: SITE_URL,
      // The brand mark, not a portrait: there is no photo of Bas under
      // public/. Swap this for one when there is — it is also what a search
      // result falls back to.
      image: `${SITE_URL}/android-chrome-512x512.png`,
      address: ADDRESS,
      // Derived from the four specialties on the site, so the two can never
      // say different things about what Bas does.
      knowsAbout: SPECIALTIES.map((s) => s.title),
      worksFor: { "@id": ORGANIZATION_ID },
      sameAs: [CONTACT.linkedin],
    },
  ],
};

// JetBrains Mono is a monospace font used throughout the terminal UI.
// We load the four weights used by the design plus italic 400 for variety.
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "700", "800"],
  style: ["normal", "italic"],
  // System monospace fonts to fall back on: when the webfont fails to load, and
  // per glyph for characters outside the latin subset (e.g. box drawing).
  fallback: [
    "Menlo",
    "Consolas",
    "DejaVu Sans Mono",
    "ui-monospace",
    "monospace",
  ],
  // Next's automatic metrics fallback is Arial for anything non-serif, which is
  // proportional and would break the terminal's column alignment.
  adjustFontFallback: false,
});

/** True on a Vercel deployment, false locally and in CI. */
const onVercel = process.env.VERCEL === "1";

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jetBrainsMono.variable}>
      <body>
        <script
          type="application/ld+json"
          // Static, trusted content built above — safe to inline as JSON-LD.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        {children}
        {/*
          Both scripts are served by Vercel's edge, so off Vercel they 404 on
          every page load: noise in local and CI logs, and a Lighthouse Best
          Practices score capped at 96 for a console error that says nothing
          about this site. `VERCEL` is set to "1" on every Vercel deployment
          and nowhere else, so production is unchanged.
        */}
        {onVercel ? (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        ) : null}
      </body>
    </html>
  );
}
