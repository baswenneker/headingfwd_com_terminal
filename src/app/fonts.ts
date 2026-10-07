import { JetBrains_Mono } from "next/font/google";

/**
 * JetBrains Mono is the monospace font used throughout the terminal UI. Both
 * the root layout and global-not-found.tsx render their own <html>, so both
 * import it from here; the four weights used by the design plus italic.
 */
export const jetBrainsMono = JetBrains_Mono({
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
