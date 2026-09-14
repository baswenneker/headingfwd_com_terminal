---
title: "Everything a post can do"
date: 2026-01-15
lang: en
kicker: "Template · not published"
excerpt: "The reference post. Every element the blog supports, with placeholder content, kept as a draft so it never ships."
tags: ["template", "reference"]
draft: true
image: /blog/post-template/placeholder.png
---

This is the lead paragraph: everything before the first `##` heading. It opens
the article and is deliberately not the same string as the excerpt, which is
what the overview card, the meta description and the RSS feed use. Write the
lead for someone who has already decided to read; write the excerpt for someone
who has not.

```stats
[
  { "value": "3×", "label": "faster to publish" },
  { "value": "0 kB", "label": "client JavaScript" },
  { "value": "1 file", "label": "per post" }
]
```

## How a post is built

Section headings are `##`. They are numbered automatically with roman
numerals, so reordering a piece never means renumbering it by hand. Text
placed directly under a section heading, before the first `###`, is section
introduction and runs the full width of the body column.

### Frontmatter carries the metadata

:::aside
The left column. Written as a `:::aside` directly under the `###`, it holds a
note, a figure caption or a source — anything that belongs beside the argument
rather than inside it.
:::

`title`, `date`, `lang` and `excerpt` are required; `slug`, `updated`,
`kicker`, `tags`, `draft` and `image` are optional. The build fails on
anything invalid, so a broken post never reaches production.

- `slug` defaults to the filename.
- `lang` is `nl` or `en`, and sets the article's language and its date format.
- `draft: true` withholds the post everywhere in production.

### Charts are declared, not drawn

:::aside
Both chart blocks are validated the same way frontmatter is, and drawn to SVG
on the server. No charting library ships to the reader.
:::

A ```chart``` block takes `type` (line or bar), `scale` (linear or
logarithmic), `data` as label-value pairs, an optional `caption`, and optional
explicit `yTicks`.

```chart
{
  "type": "line",
  "scale": "logarithmic",
  "data": [
    { "label": "2021", "value": 60 },
    { "label": "2022", "value": 20 },
    { "label": "2023", "value": 2 },
    { "label": "2024", "value": 0.5 },
    { "label": "2025", "value": 0.15 }
  ],
  "caption": "Cost per million tokens. A logarithmic scale keeps a collapse readable."
}
```

A bar chart on a linear scale reads against zero:

```chart
{
  "type": "bar",
  "scale": "linear",
  "data": [
    { "label": "Draft", "value": 18 },
    { "label": "Review", "value": 46 },
    { "label": "Shipped", "value": 36 }
  ],
  "caption": "Where the time actually goes, in percent."
}
```

## What else the page supports

This second section exists to prove one thing: item numbers keep counting
across section boundaries. The first item below is number three, not number
one.

### Pull quotes, figures and footnotes

:::quote
Publish on your own domain first, then repost. The order is what establishes
the original — the canonical tag does not travel.
*On attribution*
:::

An image on its own line followed by an italic line becomes a figure with its
caption. Dimensions are read from the file at build time, so the box is
reserved before the bytes arrive.

![A flat placeholder image](placeholder.png)

*The caption sits under its figure.*

An SVG is inlined instead, so a hand-drawn diagram inherits the page's colours:

![Source, transform, page](diagram.svg)

*An inline SVG picks up `currentColor`.*

Footnote markers sit in the text[^1] and their sources are listed at the end of
the article[^2].

[^1]: The first source, listed under the article.
[^2]: The second source, with [a link](https://headingfwd.com).

### Tables, lists and code

Tables come from GitHub-flavoured Markdown:

| Element | Written as |
|---|---|
| Section | `##` |
| Item | `###` |
| Left column | `:::aside` |
| Pull quote | `:::quote` |
| Chart | a `chart` fenced block |

Ordered and unordered lists both work, and inline `code` and fenced blocks
keep their monospace styling:

```ts
export function isPublished(post: Post): boolean {
  return !post.draft && post.date <= todayInBlogTimezone();
}
```
