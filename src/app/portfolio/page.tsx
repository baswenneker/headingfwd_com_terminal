import { Terminal } from "~/app/_components/terminal";

/**
 * `/portfolio` — deep link that opens the terminal straight into the fullscreen
 * portfolio overlay. Exiting the overlay (Esc) reveals the normal terminal
 * underneath, identical to typing `/portfolio` on the home page.
 */
export default function PortfolioPage() {
  return <Terminal initialMode="portfolio" />;
}
