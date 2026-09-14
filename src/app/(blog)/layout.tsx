import styles from "./blog.module.css";

/**
 * Layout for the blog half of the site — `/blog` and `/blog/<slug>`.
 *
 * Deliberately bare: no tRPC provider, no react-query, no CAPTCHA widget. A
 * blog page is prose, so it ships no application JavaScript.
 *
 * A nested layout cannot set attributes on `html` or `body`, and the terminal
 * needs both to be `overflow: hidden` on a cyan gradient. The wrapper below
 * carries `data-blog-root`, which `globals.css` keys off with `:has()` to undo
 * both for blog routes only. The wrapper itself paints the near-black blog
 * surface across the full viewport height, so no cyan shows through on a page
 * shorter than the screen.
 */
export default function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div data-blog-root="" className={styles.root}>
      {children}
    </div>
  );
}
