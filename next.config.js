/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/**
 * Content-Security-Policy, as one string. Report-only for now: it is written
 * from what the site loads today (Turnstile, Vercel analytics and speed
 * insights, YouTube thumbnails and embeds on the case pages, the inline
 * JSON-LD scripts), and is meant to be watched in production before it is
 * enforced.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://va.vercel-scripts.com",
  "frame-src https://challenges.cloudflare.com https://www.youtube.com https://www.youtube-nocookie.com",
  "img-src 'self' data: https://img.youtube.com https://i.ytimg.com",
  "connect-src 'self' https://challenges.cloudflare.com https://vitals.vercel-insights.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** @type {import("next").NextConfig} */
const config = {
  // The server does not need to announce what it runs on.
  poweredByHeader: false,
  // Ensure drizzle migrations are included in production builds
  outputFileTracingIncludes: {
    "/api/**/*": ["./drizzle/**/*"],
    "/*": ["./drizzle/**/*"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: contentSecurityPolicy,
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // `/agents.txt` is an alias for crawlers that look for that name —
      // forward it to the canonical full file at `/llms.txt`.
      { source: "/agents.txt", destination: "/llms.txt", permanent: true },
      // The previous headingfwd.com served a language prefix per locale. Search
      // Console still reports `/nl/` and `/en/` as 404s, so send those two roots
      // to the homepage they stand for. Only the roots: an unknown page under a
      // dead prefix has no equivalent here, and redirecting it to `/` anyway
      // would turn a clear 404 into a soft one.
      { source: "/nl", destination: "/", permanent: true },
      { source: "/en", destination: "/", permanent: true },
      // `/index` served the homepage byte for byte. One canonical address for
      // it, so the duplicate resolves instead of competing.
      { source: "/index", destination: "/", permanent: true },
    ];
  },
};

export default config;
