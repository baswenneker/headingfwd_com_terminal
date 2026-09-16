# design-sync notes — headingfwd_com_terminal

## This repo is not a design system

No Storybook, no `dist/`, `package.json` is private with no `exports`. The
converter (`package-build.mjs`) has nothing to convert here, so **this bundle
is hand-built**, not generated. `package-validate.mjs` does not apply.

Confirmed with the user on 16 September 2026: sync **the look only** — tokens,
fonts and the two surfaces. The alternative on the table was extracting
`terminal.tsx` / `post-body.tsx` into presentational components; that was
rejected as building new code rather than importing existing code.

## Where the values come from

| Bundle file | Source in this repo |
|---|---|
| `tokens/color.css` | `src/styles/globals.css`, `src/app/_components/terminal.module.css` (`.page` tokens + literals), `src/app/(editorial)/editorial.module.css` (`.root` tokens) |
| `tokens/type.css` | every `font-size` / `letter-spacing` / `line-height` across `src/app/**/*.css` |
| `tokens/space.css` | `.window`, `.page`, `.shell`, `.grid` rules in the same two modules |
| `tokens/fonts.css` | `next/font/google` call in `src/app/layout.tsx:157` |

The `.hf-` helper classes in `styles.css` are **written for this bundle**. The
app itself uses CSS modules with scoped names, so there is no shared class
vocabulary to import. Said plainly in `conventions.md` and the README.

## Fonts

`next/font/google` with `subsets: ["latin"]`, weights 400/500/700/800 plus
italic 400. Google serves all four upright weights from **one variable file**
(verified: identical md5), so `fonts/` holds two faces, not five. Re-fetch with
the Google Fonts css2 API and a desktop user-agent; the latin `@font-face`
blocks are the ones to keep.

## Verification

Each card was served over `python3 -m http.server` and rendered in headless
Chromium at 1280px via Playwright. Console clean apart from a `favicon.ico`
404. Screenshots are throwaway, in `.playwright-mcp/` (gitignored).

Two bugs found and fixed that way, both worth remembering:
- No `box-sizing: border-box` reset meant `.hf-window` overflowed its parent
  and lost its status bar. The reset now lives in `styles.css`.
- A flex parent stretched `.hf-badge` to full width. Inline-block is not
  enough inside a flex column; the card sets `align-items: flex-start`.

## Re-sync risks

- **No `_ds_sync.json`.** A hand-built bundle cannot produce the converter's
  hash recipe, so there is no anchor and every sync re-verifies from scratch.
  That is deliberate, not a failure.
- **Token drift.** Nothing links the bundle to the app's CSS. If a color or
  size changes in `src/app/**/*.css`, this bundle keeps the old value until
  someone re-runs the extraction. Re-read the four source files first.
- **`_ds_bundle.js` is an empty global on purpose.** Do not "fix" it by
  bundling app components; see the decision above.
