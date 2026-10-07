"use client";

/**
 * Last-resort error screen, for an error in the root layout itself. It
 * replaces that layout, so it renders its own `html` and `body` and cannot
 * rely on the global stylesheet or the webfont: everything is inline, in the
 * terminal's colours. `error.tsx` handles every error below the layout.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#07090b",
          color: "#cfe2e7",
          fontFamily: "Menlo, Consolas, 'DejaVu Sans Mono', monospace",
        }}
      >
        <main style={{ padding: 24, maxWidth: 560 }}>
          <p style={{ color: "#ff6e6e", margin: 0 }}>
            zsh: headingfwd.com failed to load
            {error.digest ? ` (ref ${error.digest})` : ""}
          </p>
          <h1 style={{ fontSize: 22, color: "#eafbfe" }}>
            Something went wrong.
          </h1>
          <button
            type="button"
            onClick={retry}
            style={{
              font: "inherit",
              fontWeight: 700,
              color: "#2ee6f6",
              background: "none",
              border: "1px solid #2ee6f6",
              borderRadius: 6,
              padding: "6px 14px",
              cursor: "pointer",
            }}
          >
            retry
          </button>
        </main>
      </body>
    </html>
  );
}
