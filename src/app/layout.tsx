import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CONTACT } from "~/content/site-content";
import { jetBrainsMono } from "./fonts";
// Canonical production origin + brand name. `metadataBase` lets Next resolve
// every relative URL below (canonical, Open Graph, icons) to an absolute URL,
// which crawlers and social scrapers require.
import {
  ORGANIZATION_ID,
  PERSON_ID,
  SITE_ICONS,
  SITE_NAME,
  SITE_URL,
} from "~/config/site";

const TITLE = "HeadingFWD — AI Engineering & Consultancy";
const DESCRIPTION =
  "HeadingFWD helps teams get real value from Generative AI — designing and " +
  "building agents, assistants and AI workflows that reach production, training " +
  "dev teams, and consulting on AI strategy. By Bas Wenneker, AI Lead / Engineer.";

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
  // Only the preview limits live here, not `index` / `follow` or a canonical.
  // With Cache Components a notFound() from a page is rendered with this
  // layout's metadata and not with the metadata in not-found.tsx, so anything
  // set here reaches that 404 as well. (A URL without a route gets
  // global-not-found.tsx, which skips this layout.) Indexing is the default without a robots tag; each page sets
  // its own canonical.
  robots: {
    googleBot: {
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    // No `images` here on purpose: an explicit entry beats Next's
    // `opengraph-image` file convention, so the generated card in
    // src/app/opengraph-image.tsx would never be used. Same for twitter.
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  icons: SITE_ICONS,
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
      founder: { "@id": PERSON_ID },
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
      worksFor: { "@id": ORGANIZATION_ID },
      sameAs: [CONTACT.linkedin],
    },
  ],
};

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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
