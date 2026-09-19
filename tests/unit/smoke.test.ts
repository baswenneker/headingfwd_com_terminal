import { describe, expect, it } from "vitest";
import { migratedDb, schema } from "./helpers/db";

describe("unit layer wiring", () => {
  it("migrates the in-memory database and can insert a session", async () => {
    const db = await migratedDb();
    await db.insert(schema.chatSessions).values({
      sessionId: "session_smoke",
      verified: true,
      messageCount: 0,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });
    const rows = await db.query.chatSessions.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.sessionId).toBe("session_smoke");
  });
});
