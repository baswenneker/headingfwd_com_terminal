import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { type Config } from "drizzle-kit";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * drizzle-kit invokes this file directly — it loads no env file of its own,
 * it only sees the real process env. `~/env` reads `process.env` the moment
 * it is imported, so on a fresh checkout with only `.env.local` (see
 * .env.example) `pnpm db:push` failed: DATABASE_URL was never set in the
 * process running drizzle-kit. Load the same two files playwright.config.ts
 * and tests/global-setup.ts already load, in the same order — `.env.local`
 * first, `.env` as its fallback — and `override: false` on both, so a
 * variable already set in the real process env (CI, the shell, Docker)
 * always wins over either file.
 *
 * `~/env` is deliberately NOT imported here, even after this dotenv call.
 * Its zod validation runs as a module-level side effect at import time, and
 * a static `import` is hoisted above every other statement in the file
 * regardless of where it is written, so a static import would always run
 * before the dotenv calls below ever executed. The obvious fix — a dynamic
 * `import("~/env")` — does not work either: it would need either a top-level
 * `await` (drizzle-kit loads this file through esbuild compiled to
 * CommonJS, which rejects that outright) or an async default export
 * (drizzle-kit's own config schema rejects a Promise: "Expected object,
 * received promise"). DATABASE_URL/TURSO_AUTH_TOKEN are read directly from
 * `process.env` below instead — the same two variables `~/env` would have
 * validated, with the same fallback behaviour.
 */
loadEnv({ path: resolve(__dirname, ".env.local"), override: false });
loadEnv({ path: resolve(__dirname, ".env"), override: false });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local or .env (see .env.example), " +
      "or export it in the shell running drizzle-kit.",
  );
}

const isTurso = databaseUrl.startsWith("libsql://");

export default {
  schema: "./src/server/db/schema.ts",
  dialect: isTurso ? "turso" : "sqlite",
  dbCredentials: isTurso
    ? {
        url: databaseUrl,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      }
    : {
        url: databaseUrl,
      },
  tablesFilter: ["headingfwd_com_terminal_*"],
} satisfies Config;
