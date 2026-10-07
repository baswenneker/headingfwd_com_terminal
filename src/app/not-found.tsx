import { type Metadata } from "next";
import {
  NOT_FOUND_METADATA,
  NotFoundScreen,
} from "./_components/not-found-screen";

/**
 * The 404 for a page that calls notFound(): the case pages
 * (`/portfolio/[slug]`) and the post pages (`/blog/[slug]`) do for slugs
 * outside their registries. A draft (in production) or a future-dated post
 * lands here too: `getRoutablePost` does not return it, so its URL is a hard
 * 404 rather than a soft one. A URL without any route gets
 * global-not-found.tsx instead.
 *
 * With Cache Components, Next renders this 404 with the root layout's metadata
 * and skips the export below, so the visitor sees the site's default title.
 * The layout carries no canonical and no index directive, so the page still
 * says noindex only. Those URLs are rare: src/proxy.ts sends every slug without
 * a file to global-not-found.tsx, which does get its own metadata. The export
 * still applies to the prerendered /_not-found.
 */
export const metadata: Metadata = NOT_FOUND_METADATA;

export default function NotFound() {
  return <NotFoundScreen />;
}
