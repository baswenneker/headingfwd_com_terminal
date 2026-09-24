import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { redactSessionId } from "~/lib/errors";
import { getTableName } from "drizzle-orm";
import { migratedDb, truncateAll, db, client, schema } from "../helpers/db";

/**
 * A/S9 — sessions do not pile up for ever, and a session id is not written
 * into a log line whole.
 */
vi.mock("~/server/services/turnstile", () => ({
  verifyTurnstileToken: vi.fn(async () => ({ success: true })),
}));

const { createCaller } = await import("~/server/api/root");

const caller = () =>
  createCaller({
    db,
    headers: new Headers({ "x-forwarded-for": "203.0.113.20" }),
  });

describe("housekeeping", () => {
  beforeAll(async () => {
    await migratedDb();
  });

  beforeEach(async () => {
    await truncateAll();
    await db.delete(schema.pendingEmails);
  });

  it("keeps only enough of a session id to follow one visitor", () => {
    const redacted = redactSessionId(
      "session_2f7f6e2a-5a1e-4f10-9b7a-1d5c9a0b3e77",
    );
    expect(redacted).not.toContain("1d5c9a0b3e77");
    expect(redacted.startsWith("session_")).toBe(true);
    expect(redactSessionId(undefined)).toBe("none");
  });

  it("drops sessions long past their expiry, with their turns and previews", async () => {
    const stale = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    await db.insert(schema.chatSessions).values({
      sessionId: "session_stale",
      verified: true,
      messageCount: 3,
      createdAt: stale,
      lastActivityAt: stale,
      expiresAt: stale,
    });
    await db.insert(schema.chatMessages).values({
      sessionId: "session_stale",
      role: "user",
      content: "long gone",
      createdAt: stale,
    });
    await db.insert(schema.pendingEmails).values({
      sessionId: "session_stale",
      senderEmail: "visitor@example.com",
      messageHash: "hash",
      nonce: "nonce",
      createdAt: stale,
    });

    await caller().chat.initSession({ turnstileToken: "tok" });

    const sessions = await db.query.chatSessions.findMany();
    expect(sessions.map((s) => s.sessionId)).not.toContain("session_stale");
    expect(await db.query.chatMessages.findMany()).toHaveLength(0);
    expect(await db.query.pendingEmails.findMany()).toHaveLength(0);
  });

  it("leaves a session that expired minutes ago alone", async () => {
    await db.insert(schema.chatSessions).values({
      sessionId: "session_recent",
      verified: true,
      messageCount: 1,
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
      lastActivityAt: new Date(Date.now() - 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 30 * 60 * 1000),
    });

    await caller().chat.initSession({ turnstileToken: "tok" });

    const sessions = await db.query.chatSessions.findMany();
    expect(sessions.map((s) => s.sessionId)).toContain("session_recent");
  });

  it("leaves no turn or preview without its session when the sweep fails part-way", async () => {
    const stale = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    await db.insert(schema.chatSessions).values({
      sessionId: "session_stale",
      verified: true,
      messageCount: 1,
      createdAt: stale,
      lastActivityAt: stale,
      expiresAt: stale,
    });
    await db.insert(schema.chatMessages).values({
      sessionId: "session_stale",
      role: "user",
      content: "still here",
      createdAt: stale,
    });
    await db.insert(schema.pendingEmails).values({
      sessionId: "session_stale",
      senderEmail: "visitor@example.com",
      messageHash: "hash",
      nonce: "nonce",
      createdAt: new Date(),
    });

    // Make the preview delete fail, mid-sweep.
    await client.execute(
      `CREATE TRIGGER fail_preview_delete BEFORE DELETE ON ${getTableName(schema.pendingEmails)}
       BEGIN SELECT RAISE(ABORT, 'boom'); END`,
    );
    try {
      await expect(
        caller().chat.initSession({ turnstileToken: "tok" }),
      ).rejects.toThrow();
    } finally {
      await client.execute("DROP TRIGGER fail_preview_delete");
    }

    const sessionIds = new Set(
      (await db.query.chatSessions.findMany()).map((s) => s.sessionId),
    );
    const orphans = [
      ...(await db.query.chatMessages.findMany()),
      ...(await db.query.pendingEmails.findMany()),
    ].filter((row) => !sessionIds.has(row.sessionId));
    expect(orphans).toHaveLength(0);
    expect(sessionIds.has("session_stale")).toBe(true);
  });
});
