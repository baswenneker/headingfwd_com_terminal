/**
 * Runs before every unit test file (see vitest.config.ts).
 *
 * `~/env` validates `process.env` the moment it is imported and `~/server/db`
 * opens a libsql client the moment it is imported, so these values have to be
 * in place before either module loads. Nothing here is a secret: the unit
 * layer never talks to OpenAI, Resend, Cloudflare or Turso.
 *
 * Every value is ASSIGNED, not defaulted. The unit layer decides its own
 * environment rather than inheriting one: the CI workflow sets the variables
 * the end-to-end suite needs for every job, and two of them are wrong here —
 * `DATABASE_URL` points at a file whose directory only the Playwright run
 * creates, and `NEXT_PUBLIC_DISABLE_CAPTCHA=true` takes `verifyTurnstileToken`
 * down its bypass branch, which is the one branch the Turnstile tests are not
 * about. Reading the ambient environment made those tests pass locally and
 * fail in CI.
 *
 * A test that needs a different value sets it with `vi.stubEnv` and resets
 * modules (`vi.resetModules()`) before importing the module under test; that
 * still works, because it happens after this file has run.
 */
process.env.SKIP_ENV_VALIDATION = "1";
// NODE_ENV is typed read-only by @types/node; assign through a plain record.
(process.env as Record<string, string | undefined>).NODE_ENV = "test";
process.env.ENVIRONMENT = "test";
process.env.DATABASE_URL = "file::memory:";
process.env.TURSO_AUTH_TOKEN = "";
process.env.NEXT_PUBLIC_DISABLE_CAPTCHA = "false";
process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "unit-test-site-key";
process.env.TURNSTILE_SECRET_KEY = "unit-test-secret-key";
process.env.OPENAI_API_KEY = "sk-unit-test";
process.env.RESEND_API_KEY = "re_unit_test";
process.env.MESSAGE_RATE_LIMIT = "10";
delete process.env.SESSION_RATE_LIMIT;
delete process.env.LANGSMITH_TRACING;
