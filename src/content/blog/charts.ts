/**
 * Server-rendered charts and stat rows for the blog.
 *
 * A post declares a chart by its data, not by hand-drawing SVG:
 *
 * ```chart
 * { "type": "line", "scale": "logarithmic",
 *   "data": [{ "label": "2020", "value": 60 }, …],
 *   "caption": "Cost per million tokens, 2020-2025." }
 * ```
 *
 * Both the chart block and the `stats` block are validated with zod on the
 * same footing as frontmatter, and are drawn to SVG here, at build time. No
 * charting library, and no client-side JavaScript on a blog page — the chart
 * is in the HTML the server sends, crisp at any zoom.
 */

import { z } from "zod";
import type { Element } from "hast";
import { h } from "./hast";

// ── Schemas ──────────────────────────────────────────────────────────────────

const chartPoint = z.object({
  /** X-axis label — a year, a model name, a release. */
  label: z.string().min(1),
  /** The value plotted. Must be > 0 on a logarithmic scale. */
  value: z.number().finite(),
});

export const chartSchema = z.object({
  type: z.enum(["line", "bar"]),
  scale: z.enum(["linear", "logarithmic"]).default("linear"),
  data: z.array(chartPoint).min(2),
  /** Figure caption, rendered under the plot. */
  caption: z.string().optional(),
  /** Explicit y-axis ticks. Omitted, the axis is derived from the data. */
  yTicks: z.array(z.number().finite()).min(2).optional(),
});

export type ChartSpec = z.infer<typeof chartSchema>;

const statSchema = z.object({
  /** The figure itself — kept a string so "3.2×" and "~40%" render as written. */
  value: z.string().min(1),
  /** What the figure measures. */
  label: z.string().min(1),
});

export const statsSchema = z.array(statSchema).min(1).max(6);

export type StatSpec = z.infer<typeof statSchema>;

// ── Geometry ─────────────────────────────────────────────────────────────────

/*
 * The chart is drawn once, at one size, and that size is also the size it
 * renders at: the SVG carries `width`/`height` attributes as well as a
 * `viewBox`, so it has an intrinsic size the stylesheet caps rather than
 * stretches (`width: auto; max-width: 100%`).
 *
 * That cap is what keeps the labels readable. Everything inside a `viewBox`
 * scales with the rendered width, text included, and there is no unit that
 * escapes it — so a wide chart squeezed into a phone column shrinks its own
 * labels with it. At 720 units wide and 11-unit labels the axis text landed at
 * 5.5px on a 390px phone, which is unreadable.
 *
 * Hence a narrower drawing with larger labels: 460 units wide with 13-unit
 * text renders at 13px on a desktop column and still 10px in a 358px phone
 * column, the narrowest the body column gets.
 */
const W = 460;
const H = 250;
const LABEL_SIZE = 13;
// `right` leaves room for the last x-label, which is centred on the final
// gridline and would otherwise hang off the drawing and be clipped at the
// edge of a phone's body column.
const PAD = { top: 16, right: 26, bottom: 38, left: 48 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const AXIS = "rgba(255,255,255,0.18)";
const GRID = "rgba(255,255,255,0.07)";
const LABEL = "rgba(198,220,225,0.72)";
const ACCENT = "var(--accent, #2ee6f6)";

/** Round a number for display without trailing ".0". */
function tickLabel(value: number): string {
  const abs = Math.abs(value);
  return abs >= 1000
    ? value.toLocaleString("en-US")
    : Number.isInteger(value)
      ? String(value)
      : value.toFixed(abs < 1 ? 2 : 1);
}

/**
 * The y-axis ticks for a chart: the author's own when given, otherwise a
 * plain range over the data — powers of ten on a logarithmic axis, five even
 * steps on a linear one.
 */
function axisTicks(spec: ChartSpec): number[] {
  if (spec.yTicks) return [...spec.yTicks].sort((a, b) => a - b);

  const values = spec.data.map((d) => d.value);
  const max = Math.max(...values);

  if (spec.scale === "logarithmic") {
    const min = Math.min(...values.filter((v) => v > 0));
    const lo = Math.floor(Math.log10(min));
    const hi = Math.ceil(Math.log10(max));
    const ticks: number[] = [];
    for (let e = lo; e <= hi; e++) ticks.push(10 ** e);
    return ticks;
  }

  // Bars are read against zero; a line may sit well above it.
  const min = spec.type === "bar" ? 0 : Math.min(0, ...values);
  const step = (max - min) / 4 || 1;
  return [0, 1, 2, 3, 4].map((i) => min + step * i);
}

/**
 * Map a value to a y coordinate. A logarithmic scale plots log10(value), so
 * values must be positive; a zero or negative value on a log chart is a
 * validation error rather than a silently clamped point.
 */
function makeScaleY(spec: ChartSpec, ticks: number[]) {
  const log = spec.scale === "logarithmic";
  if (log && spec.data.some((d) => d.value <= 0)) {
    throw new Error(
      "chart: a logarithmic scale needs strictly positive values; " +
        "use a linear scale or drop the zero.",
    );
  }

  const project = (v: number) => (log ? Math.log10(v) : v);
  const lo = project(ticks[0]!);
  const hi = project(ticks[ticks.length - 1]!);
  const span = hi - lo || 1;

  return (value: number) =>
    PAD.top + PLOT_H - ((project(value) - lo) / span) * PLOT_H;
}

// ── Drawing ──────────────────────────────────────────────────────────────────

function gridAndAxis(ticks: number[], y: (v: number) => number) {
  const lines: Element[] = [];

  for (const tick of ticks) {
    const ty = y(tick);
    lines.push(
      h("line", {
        x1: PAD.left,
        x2: PAD.left + PLOT_W,
        y1: ty,
        y2: ty,
        stroke: GRID,
        strokeWidth: 1,
      }),
      h(
        "text",
        {
          x: PAD.left - 10,
          y: ty + LABEL_SIZE / 3,
          textAnchor: "end",
          fontSize: LABEL_SIZE,
          fill: LABEL,
        },
        [tickLabel(tick)],
      ),
    );
  }

  // Baseline + left rule, slightly brighter than the grid.
  lines.push(
    h("line", {
      x1: PAD.left,
      x2: PAD.left,
      y1: PAD.top,
      y2: PAD.top + PLOT_H,
      stroke: AXIS,
      strokeWidth: 1,
    }),
    h("line", {
      x1: PAD.left,
      x2: PAD.left + PLOT_W,
      y1: PAD.top + PLOT_H,
      y2: PAD.top + PLOT_H,
      stroke: AXIS,
      strokeWidth: 1,
    }),
  );

  return lines;
}

function xLabels(spec: ChartSpec, xs: number[]): Element[] {
  return spec.data.map((point, i) =>
    h(
      "text",
      {
        x: xs[i]!,
        y: PAD.top + PLOT_H + LABEL_SIZE + 9,
        textAnchor: "middle",
        fontSize: LABEL_SIZE,
        fill: LABEL,
      },
      [point.label],
    ),
  );
}

function drawLine(spec: ChartSpec, y: (v: number) => number): Element[] {
  const n = spec.data.length;
  const step = PLOT_W / (n - 1);
  const xs = spec.data.map((_, i) => PAD.left + step * i);
  const points = spec.data
    .map((d, i) => `${xs[i]!.toFixed(2)},${y(d.value).toFixed(2)}`)
    .join(" ");

  return [
    h("polyline", {
      points,
      fill: "none",
      stroke: ACCENT,
      strokeWidth: 2,
      strokeLinejoin: "round",
      strokeLinecap: "round",
    }),
    ...spec.data.map((d, i) =>
      h("circle", {
        cx: xs[i]!,
        cy: y(d.value),
        r: 3.5,
        fill: "#07090b",
        stroke: ACCENT,
        strokeWidth: 2,
      }),
    ),
    ...xLabels(spec, xs),
  ];
}

function drawBars(spec: ChartSpec, y: (v: number) => number): Element[] {
  const n = spec.data.length;
  const slot = PLOT_W / n;
  const barW = Math.min(slot * 0.56, 64);
  const xs = spec.data.map((_, i) => PAD.left + slot * i + slot / 2);
  const base = PAD.top + PLOT_H;

  return [
    ...spec.data.map((d, i) => {
      const top = y(d.value);
      return h("rect", {
        x: xs[i]! - barW / 2,
        y: Math.min(top, base),
        width: barW,
        height: Math.max(Math.abs(base - top), 1),
        fill: ACCENT,
        fillOpacity: 0.75,
      });
    }),
    ...xLabels(spec, xs),
  ];
}

/**
 * One chart, as a `<figure>` holding an inline SVG and its caption.
 *
 * The SVG carries `width`/`height` alongside its `viewBox`, so it has an
 * intrinsic size: the stylesheet lets it shrink into a narrow column but never
 * stretches it past that size, which is what keeps the labels readable (see
 * the Geometry note above). It stays sharp at any zoom either way.
 *
 * Its accessible name is the caption; the plot itself is marked `img` so a
 * screen reader announces one figure rather than a pile of shapes.
 */
export function renderChart(spec: ChartSpec): Element {
  const ticks = axisTicks(spec);
  const y = makeScaleY(spec, ticks);
  const marks = spec.type === "line" ? drawLine(spec, y) : drawBars(spec, y);
  const name =
    spec.caption ?? `${spec.type} chart of ${spec.data.length} values`;

  // One figcaption per figure, as HTML allows: the caption, when there is one.
  return h("figure", { "data-post-chart": "" }, [
    h(
      "svg",
      {
        viewBox: `0 0 ${W} ${H}`,
        width: W,
        height: H,
        role: "img",
        ariaLabel: name,
        preserveAspectRatio: "xMidYMid meet",
      },
      [...gridAndAxis(ticks, y), ...marks],
    ),
    spec.caption
      ? h("figcaption", { "data-post-figure-caption": "" }, [spec.caption])
      : null,
  ]);
}

/** The headline-statistics row that sits under the lead paragraph. */
export function renderStats(stats: StatSpec[]): Element {
  return h(
    "div",
    { "data-post-stats": "" },
    stats.map((stat) =>
      h("div", { "data-post-stat": "" }, [
        h("div", { "data-post-stat-value": "" }, [stat.value]),
        h("div", { "data-post-stat-label": "" }, [stat.label]),
      ]),
    ),
  );
}

/**
 * Parse a fenced block's JSON body. A syntax error names the block, so the
 * author sees which block in which post is wrong rather than "Unexpected
 * token }".
 */
export function parseBlockJson(lang: string, value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch (cause) {
    throw new Error(
      `\`\`\`${lang} block is not valid JSON: ${(cause as Error).message}`,
    );
  }
}
