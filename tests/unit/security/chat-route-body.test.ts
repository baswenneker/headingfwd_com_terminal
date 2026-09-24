import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { migratedDb, truncateAll, schema } from "../helpers/db";

/**
 * A/S5 — every body that does not fit the shape the route works from is a
 * 400, and no parser or runtime text reaches the client.
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

function rawRequest(body: string) {
  return new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

async function errorBody(res: Response) {
  return (await res.json()) as { error: string; code?: string };
}

describe("/api/chat request body", () => {
  beforeAll(async () => {
    const db = await migratedDb();
    await truncateAll();
    await db.insert(schema.chatSessions).values({
      sessionId: "session_body",
      verified: true,
      messageCount: 0,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
  });

  beforeEach(() => {
    streamTextSpy.mockClear();
  });

  it("refuses a body that is not JSON without echoing the parser", async () => {
    const res = await POST(rawRequest("{nope"));
    expect(res.status).toBe(400);
    const body = await errorBody(res);
    expect(body.code).toBe("INVALID_INPUT");
    expect(body.error).toBe("Invalid request body");
  });

  it("refuses an empty body", async () => {
    const res = await POST(rawRequest(""));
    expect(res.status).toBe(400);
    expect((await errorBody(res)).error).toBe("Invalid request body");
  });

  it("refuses a message without parts", async () => {
    const res = await POST(
      rawRequest(
        JSON.stringify({
          messages: [{ id: "m1", role: "user" }],
          sessionId: "session_body",
        }),
      ),
    );
    expect(res.status).toBe(400);
    expect(streamTextSpy).not.toHaveBeenCalled();
  });

  it("refuses an empty message list and a missing session id", async () => {
    const noMessages = await POST(
      rawRequest(JSON.stringify({ messages: [], sessionId: "session_body" })),
    );
    expect(noMessages.status).toBe(400);

    const noSession = await POST(
      rawRequest(
        JSON.stringify({
          messages: [{ id: "m1", role: "user", parts: [] }],
        }),
      ),
    );
    expect(noSession.status).toBe(400);
  });

  it("still refuses a last message over the length cap", async () => {
    const res = await POST(
      rawRequest(
        JSON.stringify({
          messages: [
            {
              id: "m1",
              role: "user",
              parts: [{ type: "text", text: "x".repeat(4100) }],
            },
          ],
          sessionId: "session_body",
        }),
      ),
    );
    expect(res.status).toBe(400);
    expect((await errorBody(res)).error).toContain("Message too long");
  });
});
