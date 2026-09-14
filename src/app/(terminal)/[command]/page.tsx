import { type Metadata } from "next";
import { notFound } from "next/navigation";
import { Terminal } from "~/app/_components/terminal";
import {
  COMMAND_PAGES,
  type CommandPage,
} from "~/app/_components/terminal-commands";

/**
 * `/<command>` — deep links for the slash-commands (`/help`, `/about`, …):
 * each opens the terminal with that command already executed in the feed,
 * exactly as if the visitor had typed it.
 *
 * Which commands get a URL — and their SEO metadata — is defined by
 * COMMAND_PAGES in terminal-commands.ts, the single source of truth shared
 * with the sitemap. Static routes (/, /portfolio, /llms.txt, /api) take
 * precedence over this dynamic segment; anything not in the registry is a
 * hard 404 (`dynamicParams = false`) — including /clear, which only mutates
 * feed state and has nothing to deep-link.
 */

interface CommandPageProps {
  params: Promise<{ command: string }>;
}

/** Pre-render one page per registered command. */
export function generateStaticParams() {
  return COMMAND_PAGES.map((c) => ({ command: c.token }));
}

// Tokens outside the registry (typos, /clear, easter eggs) are a hard 404.
export const dynamicParams = false;

function findPage(token: string): CommandPage | undefined {
  return COMMAND_PAGES.find((c) => c.token === token);
}

export async function generateMetadata({
  params,
}: CommandPageProps): Promise<Metadata> {
  const { command } = await params;
  const page = findPage(command);
  if (!page) return {};

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

export default async function CommandDeepLinkPage({
  params,
}: CommandPageProps) {
  const { command } = await params;
  if (!findPage(command)) notFound();
  return <Terminal initialCommand={command} />;
}
