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
  // `/agents.txt` is an alias for crawlers that look for that name — forward
  // it to the canonical full file at `/llms.txt`.
  async redirects() {
    return [
      { source: "/agents.txt", destination: "/llms.txt", permanent: true },
    ];
  },
};

export default config;
