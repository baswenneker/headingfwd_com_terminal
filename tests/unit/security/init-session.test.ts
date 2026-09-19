import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { migratedDb, truncateAll, db } from "../helpers/db";

/**
 * A/S4 — one client can only mint so many sessions per hour. Turnstile is
 * stubbed: the unit layer never calls Cloudflare.
 */
vi.mock("~/server/services/turnstile", () => ({
  verifyTurnstileToken: vi.fn(async () => ({ success: true })),
}));

const { createCaller } = await import("~/server/api/root");

function callerFor(ip: string) {
  return createCaller({
    db,
    headers: new Headers({ "x-forwarded-for": `${ip}, 10.0.0.1` }),
  });
}

describe("chat.initSession", () => {
  beforeAll(async () => {
    await migratedDb();
  });

  beforeEach(async () => {
    await truncateAll();
  });

  it("refuses past the cap for one client and keeps serving another", async () => {
    const caller = callerFor("203.0.113.9");
    for (let i = 0; i < 5; i++) {
      const result = await caller.chat.initSession({ turnstileToken: "tok" });
      expect(result.sessionId).toMatch(/^session_/);
    }

    await expect(
      caller.chat.initSession({ turnstileToken: "tok" }),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });

    const other = callerFor("198.51.100.4");
    await expect(
      other.chat.initSession({ turnstileToken: "tok" }),
    ).resolves.toMatchObject({ sessionId: expect.stringMatching(/^session_/) });

    const sessions = await db.query.chatSessions.findMany();
    expect(sessions).toHaveLength(6);
  });

  it("keys on the client address, not on the address itself being stored", async () => {
    const caller = callerFor("203.0.113.9");
    await caller.chat.initSession({ turnstileToken: "tok" });

    const rows = await db.query.rateLimitLogs.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.action).toBe("session_create");
    expect(rows[0]?.identifier).not.toContain("203.0.113.9");
    expect(rows[0]?.identifier).toHaveLength(64);
  });

  it("throws a tRPC error rather than creating a session past the cap", async () => {
    const caller = callerFor("192.0.2.77");
    for (let i = 0; i < 5; i++) {
      await caller.chat.initSession({ turnstileToken: "tok" });
    }
    const error = await caller.chat
      .initSession({ turnstileToken: "tok" })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(TRPCError);
    expect(await db.query.chatSessions.findMany()).toHaveLength(5);
  });
});
