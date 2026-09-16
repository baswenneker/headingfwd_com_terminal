import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * `/opengraph-image` — the site-wide social card.
 *
 * Next applies this to every route that does not declare its own, so it is the
 * fallback for the terminal, the overviews and anything added later. The blog
 * post route has its own `opengraph-image.tsx` and keeps it; a page that sets
 * `openGraph.images` in its metadata still overrides both.
 *
 * Satori has no cascade and no CSS custom properties, so the tokens appear as
 * literal hexes. They are the editorial surface from src/styles/globals.css —
 * when a token changes there, change it here too.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "HeadingFWD — AI Engineering & Consultancy";

/** Satori needs a real font buffer — ttf, otf or woff, never woff2. */
async function mono(weight: "Regular" | "Bold") {
  return readFile(
    join(process.cwd(), "src/app/fonts", `JetBrainsMono-${weight}.ttf`),
  );
}

export default async function Image() {
  const [regular, bold] = await Promise.all([mono("Regular"), mono("Bold")]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "68px 76px",
        backgroundColor: "#07090b",
        backgroundImage:
          "radial-gradient(120% 90% at 50% -10%, rgba(46, 230, 246, 0.07), rgba(0, 0, 0, 0) 55%)",
        fontFamily: "JetBrains Mono",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 4,
            backgroundColor: "#0a0a0a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#00ffff",
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
            color: "#eafbfe",
          }}
        >
          headingfwd
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 76,
            lineHeight: 1.02,
            letterSpacing: "-0.06em",
            fontWeight: 700,
            color: "#2ee6f6",
          }}
        >
          <div style={{ display: "flex", gap: 18 }}>
            <span>AI Engineering</span>
            <span
              style={{ color: "rgba(198, 220, 225, 0.62)", letterSpacing: 0 }}
            >
              &amp;
            </span>
          </div>
          <span>Consultancy</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            fontSize: 24,
          }}
        >
          <span style={{ color: "#c6dce1" }}>
            Ik bouw agents, loops en intelligente software.
          </span>
          <span style={{ color: "rgba(198, 220, 225, 0.62)" }}>
            Training voor dev-teams en consultancy op AI-strategie.
          </span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <div
          style={{ height: 1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
        />
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
            <span style={{ color: "#eafbfe" }}>
              Bas Wenneker
              <span style={{ color: "#2ee6f6" }}> — AI lead/engineer</span>
            </span>
            <span style={{ color: "rgba(198, 220, 225, 0.62)" }}>
              headingfwd.com
            </span>
          </div>
          <span
            style={{
              fontSize: 17,
              padding: "10px 16px",
              borderRadius: 8,
              backgroundColor: "#2ee6f6",
              color: "#04181c",
            }}
          >
            Open de terminal
          </span>
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "JetBrains Mono", data: regular, weight: 400, style: "normal" },
        { name: "JetBrains Mono", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}
