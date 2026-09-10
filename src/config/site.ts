/**
 * Canonical origin of the production site — the single source for every
 * absolute URL the app emits: `metadataBase` (and therefore every canonical
 * and Open Graph URL), the sitemap entries, and the `@id`s of the JSON-LD
 * graph in the root layout and on the case pages.
 *
 * It must name the host that actually serves a 200. The apex is the primary
 * domain on Vercel; `www` redirects permanently to it, so canonical, sitemap
 * and structured data all agree with what the server serves.
 */
export const SITE_URL = "https://headingfwd.com";

/** Public brand name, used as `name`/`siteName` on every metadata surface. */
export const SITE_NAME = "HeadingFWD";

/** Stable JSON-LD node ids, referenced from per-page structured data. */
export const PERSON_ID = `${SITE_URL}/#person`;
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
