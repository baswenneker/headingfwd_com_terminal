# HeadingFWD — how to build with this system

This system ships **tokens and CSS, no components**. `window.HeadingFWD` is
empty by design. Build with plain HTML elements, the CSS custom properties in
`_ds/<folder>/tokens/`, and the `.hf-` helper classes in
`_ds/<folder>/styles.css`. Read `styles.css` and its four `@import`s before
styling anything — they are short and they are the truth.

## Setup

No provider, no theme switch. One stylesheet and one rule: **every screen
starts on one of two surfaces.** Put that class on the outermost element or
the design renders on bare white.

| Surface | Class | What it is |
|---|---|---|
| Terminal | `.hf-terminal-surface` | Cyan page (`#0bd3e6`) with a highlight top and shadow bottom. Holds a dark `.hf-window`. |
| Editorial | `.hf-editorial-surface` | Near-black page (`#07090b`) with one faint cyan bloom. Holds a `.hf-shell` reading column. |

The system is dark only. There is no light mode; do not invent one.

## The idiom

Not utility classes, not props — **CSS custom properties plus a small set of
`.hf-` block classes.** Write your own layout CSS and reach for tokens by name
(`padding: var(--hf-space-md)`), never a raw hex or px value that a token
already covers.

**Token families** (all in `tokens/`, all prefixed `--hf-`):

- **Color.** One accent: `--hf-accent` (`#2ee6f6`) for links, kickers, focus
  and badges, with `--hf-on-accent` for text on top of it. `--hf-prompt` is
  the green shell caret, `--hf-danger` the red error line. Hairlines are
  `--hf-rule` and `--hf-rule-faint`. Surface-scoped text: `--hf-term-ink`,
  `--hf-term-ink-soft`, `--hf-term-ink-dim` on the terminal;
  `--hf-ed-ink`, `--hf-ed-ink-strong`, `--hf-ed-ink-dim` on an article.
  Grounds: `--hf-term-backdrop`, `--hf-term-window`, `--hf-term-bar`,
  `--hf-ed-surface`, `--hf-ed-surface-sunken`.
- **Type.** `--hf-font-mono` is the only family — JetBrains Mono sets
  headings, body, meta and code alike. Never pair it with a sans or a serif.
  Fixed sizes `--hf-text-2xs` … `--hf-text-xl` (body is `--hf-text-md`, 14px);
  fluid `--hf-display-sm/md/lg/xl`. Weights `--hf-weight-regular` (400),
  `-medium`, `-bold`, `-black` (800, display numerals only).
- **Tracking.** The system's signature: display type *tightens*
  (`--hf-tracking-display` is `-0.06em`, `--hf-tracking-heading` `-0.02em`)
  and labels *open up* (`--hf-tracking-label` `0.16em`, uppercase, 11px).
  Get this wrong and it stops looking like HeadingFWD.
- **Space and shape.** `--hf-space-2xs` … `--hf-space-2xl`, fluid
  `--hf-pad-page` / `--hf-pad-block` / `--hf-pad-inline`, radii
  `--hf-radius-xs` … `--hf-radius-xl` and `--hf-radius-pill`. Widths:
  `--hf-width-window` (980px), `--hf-width-shell` (1180px).
- **Effects.** `--hf-shadow-window` and `--hf-border-window` make the terminal
  panel float. `--hf-backdrop-terminal` / `--hf-backdrop-editorial` are the
  page gradients; `--hf-grid-lines` with `--hf-grid-size-terminal` or
  `--hf-grid-size-editorial` is the faint dot grid behind both.

**Helper classes** in `styles.css`: `.hf-window` with
`.hf-window-titlebar` / `.hf-window-body` / `.hf-window-statusbar`,
`.hf-dots` + `.hf-dot` (set `--hf-dot` per dot), `.hf-grid`, `.hf-shell`,
`.hf-label`, `.hf-heading`, `.hf-badge`, `.hf-tag`, `.hf-rule`, `.hf-prompt`,
`.hf-link`.

## Layout responds to its container

Both surfaces declare `container-type: inline-size`, and every fluid token is
written in `cqw`, not `vw`. Keep using container queries (`@container`) for
breakpoints so a card behaves the same wherever it is placed.

## One idiomatic screen

```html
<div class="hf-editorial-surface" style="position: relative; isolation: isolate">
  <div class="hf-grid"></div>
  <div class="hf-shell">
    <p class="hf-label" style="margin-bottom: var(--hf-space-sm)">
      <span style="color: var(--hf-accent)">Case study</span> · 16 September 2026
    </p>
    <h1 class="hf-heading" style="font-size: var(--hf-display-lg)">
      From prototype to production
    </h1>
    <p style="max-width: 62ch; color: var(--hf-ed-ink)">
      Body copy sits at 14px on 1.75 leading. Monospace reads slower than a
      sans, so keep the measure near sixty characters.
    </p>
    <hr class="hf-rule" style="margin: var(--hf-space-lg) 0" />
    <a class="hf-badge" href="#">Read the case</a>
  </div>
</div>
```

## Restraint

The accent is the only saturated color on an editorial page, and the badge is
the only filled element. Everything else is text on near-black separated by
hairlines. Resist adding cards, shadows or second accents — the emptiness is
the design.
