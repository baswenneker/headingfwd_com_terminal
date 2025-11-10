// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { index, sqliteTableCreator } from "drizzle-orm/sqlite-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator(
  (name) => `headingfwd_com_terminal_${name}`,
);

// Chat sessions table
export const chatSessions = createTable(
  "chat_session",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    sessionId: d.text({ length: 256 }).notNull().unique(),
    verified: d.integer({ mode: "boolean" }).default(false).notNull(),
    messageCount: d.integer().default(0).notNull(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    lastActivityAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    expiresAt: d.integer({ mode: "timestamp" }).notNull(),
  }),
  (t) => [
    index("session_id_idx").on(t.sessionId),
    index("expires_at_idx").on(t.expiresAt),
  ],
);

// Chat messages table
export const chatMessages = createTable(
  "chat_message",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    sessionId: d.text({ length: 256 }).notNull(),
    role: d.text({ length: 32 }).notNull(), // 'user' | 'assistant'
    content: d.text().notNull(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  }),
  (t) => [index("session_message_idx").on(t.sessionId)],
);

// Rate limit logs table (temporary storage for rate limiting)
export const rateLimitLogs = createTable(
  "rate_limit_log",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    identifier: d.text({ length: 256 }).notNull(), // session ID or IP hash
    action: d.text({ length: 64 }).notNull(), // 'message' | 'session_create'
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  }),
  (t) => [
    index("identifier_action_idx").on(t.identifier, t.action),
    index("created_at_idx").on(t.createdAt),
  ],
);

// Email logs table (for tracking email sends)
export const emailLogs = createTable(
  "email_log",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    sessionId: d.text({ length: 256 }).notNull(),
    senderEmail: d.text({ length: 256 }).notNull(),
    senderName: d.text({ length: 256 }),
    subject: d.text({ length: 500 }).notNull(),
    bodyPreview: d.text({ length: 1000 }), // First 1000 chars for logging
    resendMessageId: d.text({ length: 256 }),
    status: d.text({ length: 32 }).notNull(), // 'sent' | 'failed' | 'rate_limited'
    errorMessage: d.text(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  }),
  (t) => [
    index("session_email_idx").on(t.sessionId),
    index("sender_email_idx").on(t.senderEmail),
    index("created_at_email_idx").on(t.createdAt),
  ],
);
