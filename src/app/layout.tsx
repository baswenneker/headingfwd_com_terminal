import "~/styles/globals.css";

import { type Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "HeadingFWD - AI Engineering & Consultancy",
  description:
    "I help teams get value from Generative AI by developing agents, assistants and AI workflows.",
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

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
        <TRPCReactProvider>{children}</TRPCReactProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
