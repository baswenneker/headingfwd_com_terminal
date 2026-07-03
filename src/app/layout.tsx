import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { TRPCReactProvider } from "~/trpc/react";
import { CONTACT } from "~/content/site-content";

// Canonical production origin. `metadataBase` lets Next resolve every relative
// URL below (canonical, Open Graph, icons) to an absolute URL, which crawlers
// and social scrapers require.
const SITE_URL = "https://headingfwd.com";
const SITE_NAME = "HeadingFWD";
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
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "HeadingFWD — AI engineering & consultancy",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/android-chrome-512x512.png"],
  },
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
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      description:
        "AI engineering & consultancy — building agents, assistants and AI " +
        "workflows that reach production.",
      logo: `${SITE_URL}/android-chrome-512x512.png`,
      founder: { "@id": `${SITE_URL}/#person` },
      sameAs: [CONTACT.linkedin],
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Bas Wenneker",
      jobTitle: "AI Lead / Engineer",
      // Email deliberately omitted from structured data to keep the address out
      // of page source; LinkedIn (sameAs) is the public contact channel. The
      // terminal chat still relays messages to Bas server-side.
      url: SITE_URL,
      worksFor: { "@id": `${SITE_URL}/#organization` },
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
});

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
        <TRPCReactProvider>{children}</TRPCReactProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
