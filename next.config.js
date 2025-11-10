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
};

export default config;
