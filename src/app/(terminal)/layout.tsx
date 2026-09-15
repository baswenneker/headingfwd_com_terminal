import { TRPCReactProvider } from "~/trpc/react";

/**
 * Layout for the terminal half of the site — the home page and the command
 * deep links (`/help`, `/about`, …).
 *
 * `TRPCReactProvider` lives here rather than in the root layout so that the
 * client bundle it pulls in (tRPC client, react-query, and everything the
 * terminal mounts underneath it) is scoped to these routes. The editorial
 * group — the blog and the portfolio — renders without it and therefore ships
 * no terminal JavaScript at all.
 *
 * This is a nested layout, not a second root layout: the `html` and `body`
 * elements, the font, the site-wide JSON-LD graph, Analytics and Speed
 * Insights all stay in `src/app/layout.tsx`.
 */
export default function TerminalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <TRPCReactProvider>{children}</TRPCReactProvider>;
}
