import styles from "./editorial.module.css";

/**
 * Layout for the editorial half of the site — `/blog`, `/blog/<slug>`,
 * `/portfolio` and `/portfolio/<slug>`.
 *
 * Deliberately bare: no tRPC provider, no react-query, no CAPTCHA widget. A
 * post and a case are both prose, so these pages ship no application
 * JavaScript beyond the one video component a case with videos pulls in.
 *
 * A nested layout cannot set attributes on `html` or `body`, and the terminal
 * needs both to be `overflow: hidden` on a cyan gradient. The wrapper below
 * carries `data-editorial-root`, which `globals.css` keys off with `:has()` to
 * undo both for editorial routes only. The wrapper itself paints the near-black
 * surface and the 42px grid across the full viewport height, so no cyan shows
 * through on a page shorter than the screen.
 */
export default function EditorialLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div data-editorial-root="" className={styles.root}>
      {children}
    </div>
  );
}
