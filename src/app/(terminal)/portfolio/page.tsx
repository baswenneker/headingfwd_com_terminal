import { type Metadata } from "next";
import { Terminal } from "~/app/_components/terminal";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Selected AI engineering & product design work by Bas Wenneker / HeadingFWD — " +
    "agents, assistants and AI workflows built to reach production.",
  alternates: {
    canonical: "/portfolio",
  },
  openGraph: {
    type: "website",
    url: "/portfolio",
    title: "Portfolio — HeadingFWD",
    description:
      "Selected AI engineering & product design work by Bas Wenneker / HeadingFWD.",
  },
};

/**
 * `/portfolio` — deep link that opens the terminal straight into the fullscreen
 * portfolio overlay. Exiting the overlay (Esc) reveals the normal terminal
 * underneath, identical to typing `/portfolio` on the home page.
 */
export default function PortfolioPage() {
  return <Terminal initialMode="portfolio" />;
}
