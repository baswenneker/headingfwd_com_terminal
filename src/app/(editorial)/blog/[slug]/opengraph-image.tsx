import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { findRoutablePost } from "~/content/posts";

/**
 * `/blog/<slug>/opengraph-image` — the social card for one post.
 *
 * Next picks this file up automatically for the route it sits in and adds the
 * resulting URL to the page's Open Graph and Twitter metadata, so
 * `generateMetadata` in page.tsx needs no `images` entry. A post that sets
 * `image` in its frontmatter still wins: an explicit `openGraph.images`
 * overrides the file convention.
 *
 * Every value below is a literal, not a token. This renders through satori,
 * which has no cascade and no CSS custom properties — the hexes are the
 * editorial surface from src/styles/globals.css, copied by hand. When a token
 * changes there, change it here too.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "HeadingFWD blog post";

/** Satori needs a real font buffer — ttf, otf or woff, never woff2. */
async function mono(weight: "Regular" | "Bold") {
  return readFile(
    join(process.cwd(), "src/app/fonts", `JetBrainsMono-${weight}.ttf`),
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = findRoutablePost(slug);
  const title = post?.title ?? "HeadingFWD";

  // The dimmed lead-in: everything up to and including the first full stop.
  const split = title.indexOf(". ");
  const lead = split === -1 ? "" : title.slice(0, split + 1);
  const rest = split === -1 ? title : title.slice(split + 2);

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
        <span
          style={{
            fontSize: 16,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#2ee6f6",
          }}
        >
          {post?.kicker ?? "Blog post"}
        </span>
      </div>

      <h1
        style={{
          margin: 0,
          fontSize: 52,
          lineHeight: 1.15,
          letterSpacing: "-0.02em",
          fontWeight: 700,
          color: "#eafbfe",
          display: "flex",
          flexWrap: "wrap",
          gap: "0 14px",
          maxWidth: 940,
        }}
      >
        {lead ? (
          <span style={{ color: "rgba(198, 220, 225, 0.62)" }}>{lead}</span>
        ) : null}
        <span>{rest}</span>
      </h1>

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
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 20, color: "#eafbfe" }}>
              Bas Wenneker
              <span style={{ color: "#2ee6f6" }}> — AI lead/engineer</span>
            </span>
            <span style={{ fontSize: 20, color: "rgba(198, 220, 225, 0.62)" }}>
              headingfwd.com/blog
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
            Lees de post
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
