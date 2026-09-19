import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { type ReactNode } from "react";

/**
 * The social card every `opengraph-image` route draws.
 *
 * One 1200×630 card for the whole site: the site-wide fallback, the command
 * pages, both overviews, a case and a post. Only the slots differ — a kicker,
 * a title, a lead, the call to action and the URL line in the footer.
 *
 * This renders through satori, which has NO cascade and no CSS custom
 * properties: every colour below is a literal copy of the editorial tokens in
 * src/styles/globals.css. When a token changes there, change it here — this is
 * now the only place that holds the copies.
 *
 * Fonts must be a real font buffer in ttf, otf or woff — never woff2, which
 * satori cannot parse.
 */

// ── Editorial tokens, copied by hand (satori has no variables) ──────────────
const BG = "#07090b";
const GLOW =
  "radial-gradient(120% 90% at 50% -10%, rgba(46, 230, 246, 0.07), rgba(0, 0, 0, 0) 55%)";
const ACCENT = "#2ee6f6";
const INK_STRONG = "#eafbfe";
const INK = "#c6dce1";
const INK_DIM = "rgba(198, 220, 225, 0.62)";
const RULE = "rgba(255, 255, 255, 0.1)";
const LOGO_BG = "#0a0a0a";
const LOGO_INK = "#00ffff";
const CTA_INK = "#04181c";

/** Every card is exactly this size — the size crawlers expect for a large card. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

async function mono(weight: "Regular" | "Bold") {
  return readFile(
    join(process.cwd(), "src/app/fonts", `JetBrainsMono-${weight}.ttf`),
  );
}

export interface OgCardProps {
  /** Small uppercase label, top right. Omit for the site-wide card. */
  kicker?: string;
  /**
   * The headline. A string is rendered as one block; everything up to and
   * including its first full stop is dimmed, the way a post's lead-in is.
   * Pass a node to lay the headline out by hand (the site-wide card does).
   */
  title: string | ReactNode;
  /** Body lines under the title. The first is bright, the rest are dimmed. */
  lead?: string | string[];
  /** The pill in the bottom right — what the reader is invited to do. */
  cta: string;
  /** The URL line under the byline, without a scheme. */
  footerUrl?: string;
  /**
   * "hero" is the site-wide card: a display-size headline in accent colour.
   * "article" is every other card: a white headline at reading size.
   */
  variant?: "hero" | "article";
}

/** Split a headline into its dimmed lead-in sentence and the rest. */
function splitHeadline(title: string): { leadIn: string; rest: string } {
  const at = title.indexOf(". ");
  return at === -1
    ? { leadIn: "", rest: title }
    : { leadIn: title.slice(0, at + 1), rest: title.slice(at + 2) };
}

/** Render one card as a PNG response. */
export async function ogCard({
  kicker,
  title,
  lead,
  cta,
  footerUrl = "headingfwd.com",
  variant = "article",
}: OgCardProps): Promise<ImageResponse> {
  const [regular, bold] = await Promise.all([mono("Regular"), mono("Bold")]);
  const hero = variant === "hero";
  const leadLines =
    lead === undefined ? [] : Array.isArray(lead) ? lead : [lead];

  // An ARRAY of spans, never a fragment: satori lays a fragment's children out
  // as a single flex item, which stacks them on top of each other.
  const headline: ReactNode[] =
    typeof title === "string"
      ? (() => {
          const { leadIn, rest } = splitHeadline(title);
          return [
            ...(leadIn
              ? [
                  <span key="lead-in" style={{ color: INK_DIM }}>
                    {leadIn}
                  </span>,
                ]
              : []),
            <span key="rest">{rest}</span>,
          ];
        })()
      : [title];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "68px 76px",
        backgroundColor: BG,
        backgroundImage: GLOW,
        fontFamily: "JetBrains Mono",
      }}
    >
      {/* ── Header: the mark, and the kicker opposite it ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 4,
              backgroundColor: LOGO_BG,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: LOGO_INK,
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            &gt;&gt;
          </div>
          <span
            style={{
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: INK_STRONG,
            }}
          >
            headingfwd
          </span>
        </div>
        {kicker ? (
          <span
            style={{
              fontSize: 16,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: ACCENT,
            }}
          >
            {kicker}
          </span>
        ) : null}
      </div>

      {/* ── Middle: the headline, and the lead under it ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <div
          style={{
            display: "flex",
            ...(hero
              ? {
                  // A column: the site-wide card lays its own lines out.
                  flexDirection: "column" as const,
                  fontSize: 76,
                  lineHeight: 1.02,
                  letterSpacing: "-0.06em",
                  color: ACCENT,
                }
              : {
                  // A wrapping row: the dimmed lead-in and the rest of the
                  // headline are separate spans that flow into each other.
                  flexDirection: "row" as const,
                  flexWrap: "wrap" as const,
                  fontSize: 52,
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  color: INK_STRONG,
                  gap: "0 14px",
                  maxWidth: 940,
                }),
            fontWeight: 700,
          }}
        >
          {headline}
        </div>

        {leadLines.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontSize: 24,
              maxWidth: 940,
            }}
          >
            {leadLines.map((line, i) => (
              <span key={line} style={{ color: i === 0 ? INK : INK_DIM }}>
                {line}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* ── Footer: byline, URL, call to action ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <div style={{ height: 1, backgroundColor: RULE }} />
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              fontSize: 20,
            }}
          >
            <span style={{ color: INK_STRONG }}>
              Bas Wenneker
              <span style={{ color: ACCENT }}> — AI lead/engineer</span>
            </span>
            <span style={{ color: INK_DIM }}>{footerUrl}</span>
          </div>
          <span
            style={{
              fontSize: 17,
              padding: "10px 16px",
              borderRadius: 8,
              backgroundColor: ACCENT,
              color: CTA_INK,
            }}
          >
            {cta}
          </span>
        </div>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "JetBrains Mono", data: regular, weight: 400, style: "normal" },
        { name: "JetBrains Mono", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}

/** The dimmed colour, for a card that lays its own headline out. */
export const OG_INK_DIM = INK_DIM;
