import { type Metadata } from "next";
import { Terminal } from "~/app/_components/terminal";
import { COMMAND_PAGES } from "~/app/_components/terminal-commands";

/**
 * Deep links for the slash-commands (`/help`, `/about`, …): each opens the
 * terminal with that command already executed in the feed, exactly as if the
 * visitor had typed it.
 *
 * Which commands get a URL, and their SEO metadata, is defined by
 * COMMAND_PAGES in terminal-commands.ts, the source the sitemap also reads.
 * Each command has a static route folder of its own (`(terminal)/help/`, …)
 * that renders through this module, rather than one dynamic `[command]`
 * segment. With Cache Components a dynamic segment cannot refuse unknown
 * values up front: every unmatched top-level path would be rendered and its
 * 404 stored in the route cache, which a scanner fills without limit. With
 * fixed folders the router answers an unknown path with the 404 at once —
 * including /clear, which only mutates feed state and has nothing to
 * deep-link.
 *
 * A token missing from the registry throws, so a folder without an entry
 * fails the build; the e2e suite checks the reverse, that every entry has a
 * page.
 */
function findCommand(token: string) {
  const page = COMMAND_PAGES.find((c) => c.token === token);
  if (!page) {
    throw new Error(
      `/${token} has a route folder but no entry in COMMAND_PAGES`,
    );
  }
  return page;
}

/** The page metadata for one command's deep link. */
export function commandMetadata(token: string): Metadata {
  const page = findCommand(token);
  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: `/${page.token}`,
    },
    openGraph: {
      type: "website",
      url: `/${page.token}`,
      title: `${page.title} — HeadingFWD`,
      description: page.description,
    },
  };
}

/** The terminal with one command already run. */
export function CommandDeepLink({ token }: { token: string }) {
  return <Terminal initialCommand={findCommand(token).token} />;
}
