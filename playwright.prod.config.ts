import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

/**
 * The `@prod` tests, against a production build (`pnpm test:e2e:prod`).
 *
 * The default suite runs on `next dev`, which renders every request and never
 * writes the route cache, so status codes, the proxy and caching only show
 * their real behaviour here. Playwright has no web server per project, hence a
 * config of its own on top of the base one.
 *
 * Production means drafts are hidden, exactly as on the live site. The base
 * config loads .env.test into this process, and Playwright always passes this
 * process's environment to the server, so `ENVIRONMENT` and `NODE_ENV` are
 * overridden below rather than left out.
 */
const PORT = 3098;

export default defineConfig({
  ...base,
  use: { ...base.use, baseURL: `http://localhost:${PORT}` },
  projects: [
    {
      name: "prod",
      use: { ...devices["Desktop Chrome"] },
      grep: /@prod/,
    },
  ],
  webServer: {
    command: `pnpm build && pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    // Always a fresh build: a server left running may predate the change.
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      ENVIRONMENT: "production",
      NODE_ENV: "production",
      NEXT_PUBLIC_DISABLE_CAPTCHA: "true",
      SKIP_ENV_VALIDATION: "1",
    },
  },
});
