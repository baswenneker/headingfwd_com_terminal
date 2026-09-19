import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { migratedDb, truncateAll, schema } from "../helpers/db";

/**
 * A/S2, A/S3 — what `/api/chat` demands of a session before it does anything
 * else. `streamText` is stubbed: the unit layer never calls OpenAI.
 */
const { streamTextSpy } = vi.hoisted(() => ({ streamTextSpy: vi.fn() }));

vi.mock("langsmith/experimental/vercel", () => ({
  wrapAISDK: (sdk: unknown) => sdk,
}));

vi.mock("@ai-sdk/openai", () => ({ openai: () => ({ modelId: "stub" }) }));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return {
    ...actual,
    streamText: (options: unknown) => {
      streamTextSpy(options);
      return {
        toUIMessageStreamResponse: () =>
          new Response("stream", { status: 200 }),
      };
    },
  };
});

vi.mock("~/server/services/email", () => ({
  sendContactEmail: vi.fn(async () => ({ success: true })),
}));

const { POST } = await import("~/app/api/chat/route");

function chatRequest(body: unknown) {
  return new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function userMessage(text: string) {
  return { id: "m1", role: "user", parts: [{ type: "text", text }] };
}

async function insertSession(sessionId: string, verified: boolean) {
  const db = await migratedDb();
  await db.insert(schema.chatSessions).values({
    sessionId,
    verified,
    messageCount: 0,
    createdAt: new Date(),
    lastActivityAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
  });
}

describe("/api/chat session handling", () => {
  beforeAll(async () => {
    await migratedDb();
  });

  beforeEach(async () => {
    await truncateAll();
    streamTextSpy.mockClear();
  });

  it("answers 404 for an unknown session and writes no rate-limit row", async () => {
    const db = await migratedDb();
    const res = await POST(
      chatRequest({
        messages: [userMessage("hello")],
        sessionId: "session_does-not-exist",
      }),
    );

    expect(res.status).toBe(404);
    const rows = await db.query.rateLimitLogs.findMany();
    expect(rows).toHaveLength(0);
    expect(streamTextSpy).not.toHaveBeenCalled();
  });

  it("answers 403 for an expired session and writes no rate-limit row", async () => {
    const db = await migratedDb();
    await db.insert(schema.chatSessions).values({
      sessionId: "session_expired",
      verified: true,
      messageCount: 0,
      createdAt: new Date(Date.now() - 60 * 60 * 1000),
      lastActivityAt: new Date(Date.now() - 60 * 60 * 1000),
      expiresAt: new Date(Date.now() - 60 * 1000),
    });

    const res = await POST(
      chatRequest({
        messages: [userMessage("hello")],
        sessionId: "session_expired",
      }),
    );

    expect(res.status).toBe(403);
    expect(await db.query.rateLimitLogs.findMany()).toHaveLength(0);
  });

  it("answers 403 for a session that never passed the CAPTCHA", async () => {
    const db = await migratedDb();
    await insertSession("session_unverified", false);

    const res = await POST(
      chatRequest({
        messages: [userMessage("hello")],
        sessionId: "session_unverified",
      }),
    );

    expect(res.status).toBe(403);
    expect((await res.json()) as { code?: string }).toMatchObject({
      code: "FORBIDDEN",
    });
    expect(streamTextSpy).not.toHaveBeenCalled();
    expect(await db.query.rateLimitLogs.findMany()).toHaveLength(0);
  });

  it("lets a live session through and rate-limits it", async () => {
    const db = await migratedDb();
    await insertSession("session_live", true);

    const res = await POST(
      chatRequest({
        messages: [userMessage("hello")],
        sessionId: "session_live",
      }),
    );

    expect(res.status).toBe(200);
    expect(streamTextSpy).toHaveBeenCalledTimes(1);
    expect(await db.query.rateLimitLogs.findMany()).toHaveLength(1);
  });
});
