import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * The fonts every social card renders with, shared by the three
 * `opengraph-image.tsx` files.
 *
 * Satori needs a real font buffer — ttf, otf or woff, never woff2. The files
 * are read once at module load: a file read inside the render would stop
 * Cache Components from prerendering the card.
 */
async function mono(weight: "Regular" | "Bold") {
  return readFile(
    join(process.cwd(), "src/app/fonts", `JetBrainsMono-${weight}.ttf`),
  );
}

const [regular, bold] = await Promise.all([mono("Regular"), mono("Bold")]);

export const OG_FONTS = [
  { name: "JetBrains Mono", data: regular, weight: 400, style: "normal" },
  { name: "JetBrains Mono", data: bold, weight: 700, style: "normal" },
] as const;
