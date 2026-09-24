import { migrate } from "drizzle-orm/libsql/migrator";
import { db, client } from "~/server/db";
import * as schema from "~/server/db/schema";

/**
 * The application database for a unit test file: the same `~/server/db`
 * module the code under test imports, pointed at `file::memory:` by
 * tests/unit/setup.ts and migrated from `drizzle/` so the schema is the one
 * production runs. Vitest isolates module registries per file, so each file
 * starts from an empty database.
 */
export async function migratedDb() {
  await migrate(db, { migrationsFolder: "./drizzle" });
  return db;
}

/** Empty every table between tests without dropping the schema. */
export async function truncateAll() {
  await db.delete(schema.emailLogs);
  await db.delete(schema.pendingEmails);
  await db.delete(schema.rateLimitLogs);
  await db.delete(schema.chatMessages);
  await db.delete(schema.chatSessions);
}

export { db, client, schema };
