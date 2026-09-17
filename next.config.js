/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Ensure drizzle migrations are included in production builds
  outputFileTracingIncludes: {
    "/api/**/*": ["./drizzle/**/*"],
    "/*": ["./drizzle/**/*"],
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
    ];
  },
};

export default config;
