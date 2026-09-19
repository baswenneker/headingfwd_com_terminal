import Link from "next/link";
import styles from "./editorial.module.css";
import { CONTACT, EDITORIAL_FOOTER } from "~/content/site-content";

/**
 * Layout for the editorial half of the site — `/blog`, `/blog/<slug>`,
 * `/portfolio` and `/portfolio/<slug>`.
 *
 * Deliberately bare: no tRPC provider, no react-query, no CAPTCHA widget. A
 * post and a case are both prose, so these pages ship no application
 * JavaScript beyond the one video component a case with videos pulls in. The
 * footer below keeps that promise — it is a server component made of plain
 * anchors, which is why it can live here at all (ADR 0002, ADR 0003).
 *
 * A nested layout cannot set attributes on `html` or `body`, and the terminal
 * needs both to be `overflow: hidden` on a cyan gradient. The wrapper below
 * carries `data-editorial-root`, which `globals.css` keys off with `:has()` to
 * undo both for editorial routes only. The wrapper itself paints the near-black
 * surface and the 42px grid across the full viewport height, so no cyan shows
 * through on a page shorter than the screen.
 *
 * `<main id="content">` wraps the page itself. Every editorial route is one
 * document, so the landmark belongs to the layout rather than to each page:
 * one `main` per page is what `landmark-one-main` asks for, and it is what
 * lets a screen-reader user jump past the chrome to the article. The footer
 * sits outside it, as a `contentinfo` landmark of its own.
 */

/**
 * Where the footer goes, in reading order. The blog and the portfolio never
 * linked to each other and no editorial page linked to services or contact,
 * so a reader who finished a post had two ways out: back to the list, or back
 * to the terminal. These are the rest.
 *
 * `prefetch={false}` throughout: `/`, `/services` and `/contact` are all
 * terminal routes, and the footer sits at the end of a page a reader scrolls
 * through, so eager prefetching would pull the terminal bundle — Turnstile
 * and tRPC included — onto a page that never runs it (#13 P1).
 */
const FOOTER_LINKS = [
  { href: "/portfolio", label: "portfolio" },
  { href: "/blog", label: "blog" },
  { href: "/services", label: "services" },
  { href: "/contact", label: "contact" },
  { href: "/", label: "terminal" },
] as const;

export default function EditorialLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div data-editorial-root="" className={styles.root}>
      {/* First focusable element, hidden until focused (#13 U11). */}
      <a href="#content" className={styles.skipLink}>
        Skip to content
      </a>

      <main id="content">{children}</main>

      <footer className={styles.siteFooter}>
        <div className={styles.siteFooterInner}>
          <p className={styles.siteFooterBrand}>{EDITORIAL_FOOTER.tagline}</p>
          <nav className={styles.siteFooterNav} aria-label="Site">
            {FOOTER_LINKS.map((link) => (
              <Link key={link.href} href={link.href} prefetch={false}>
                {link.label}
              </Link>
            ))}
            <a href={CONTACT.linkedin} rel="noreferrer">
              LinkedIn
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
