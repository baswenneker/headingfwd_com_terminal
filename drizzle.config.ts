import { type Config } from "drizzle-kit";

import { env } from "~/env";

const isTurso = env.DATABASE_URL.startsWith("libsql://");

export default {
  schema: "./src/server/db/schema.ts",
  dialect: isTurso ? "turso" : "sqlite",
  dbCredentials: isTurso
    ? {
        url: env.DATABASE_URL,
        authToken: env.TURSO_AUTH_TOKEN!,
      }
    : {
        url: env.DATABASE_URL,
      },
  tablesFilter: ["headingfwd_com_terminal_*"],
} satisfies Config;
