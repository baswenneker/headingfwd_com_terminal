/**
 * Runs before every unit test file (see vitest.config.ts).
 *
 * `~/env` validates `process.env` the moment it is imported and `~/server/db`
 * opens a libsql client the moment it is imported, so the dummy values have to
 * be in place before either module loads. Nothing here is a secret: the unit
 * layer never talks to OpenAI, Resend, Cloudflare or Turso.
 *
 * A test that needs a different value sets it with `vi.stubEnv` and resets
 * modules (`vi.resetModules()`) before importing the module under test.
 */
process.env.SKIP_ENV_VALIDATION ??= "1";
// NODE_ENV is typed read-only by @types/node; assign through a plain record.
(process.env as Record<string, string | undefined>).NODE_ENV ??= "test";
process.env.ENVIRONMENT ??= "test";
process.env.DATABASE_URL ??= "file::memory:";
process.env.NEXT_PUBLIC_DISABLE_CAPTCHA ??= "false";
process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??= "unit-test-site-key";
process.env.TURNSTILE_SECRET_KEY ??= "unit-test-secret-key";
process.env.OPENAI_API_KEY ??= "sk-unit-test";
process.env.RESEND_API_KEY ??= "re_unit_test";
process.env.MESSAGE_RATE_LIMIT ??= "10";
