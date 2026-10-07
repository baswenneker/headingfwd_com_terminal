import "~/styles/globals.css";

import { type Metadata } from "next";
import { SITE_ICONS, SITE_URL } from "~/config/site";
import { jetBrainsMono } from "./fonts";
import {
  NOT_FOUND_METADATA,
  NotFoundScreen,
} from "./_components/not-found-screen";

/**
 * The 404 for every URL that matches no route (`experimental.globalNotFound`
 * in next.config.js), including the unknown `/blog/*` and `/portfolio/*` slugs
 * that src/proxy.ts rewrites here. Next skips the root layout for it, so this
 * file renders its own <html>, loads the global styles and the font, and
 * declares the metadata the layout would otherwise supply. In return its own
 * metadata reaches the page: the 404 title, noindex, no canonical.
 */
export const metadata: Metadata = {
  ...NOT_FOUND_METADATA,
  metadataBase: new URL(SITE_URL),
  icons: SITE_ICONS,
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={jetBrainsMono.variable}>
      <body>
        <NotFoundScreen />
      </body>
    </html>
  );
}
