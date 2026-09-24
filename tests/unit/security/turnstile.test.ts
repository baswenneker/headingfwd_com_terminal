import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstileToken } from "~/server/services/turnstile";

/**
 * A/S8 — a token is only ours if Cloudflare says it was solved on one of our
 * own hosts, and the client address goes along with the check.
 */
type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

function stubSiteverify(payload: Record<string, unknown>) {
  const fetchMock = vi.fn<FetchLike>(
    async () =>
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function bodyOf(fetchMock: ReturnType<typeof stubSiteverify>) {
  const init = fetchMock.mock.calls[0]?.[1];
  return JSON.parse(String(init?.body)) as Record<string, unknown>;
}

describe("verifyTurnstileToken", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("accepts a challenge solved on one of our hosts", async () => {
    stubSiteverify({ success: true, hostname: "headingfwd.com" });
    await expect(verifyTurnstileToken("tok")).resolves.toEqual({
      success: true,
    });
  });

  it("refuses a challenge solved on a foreign host", async () => {
    stubSiteverify({ success: true, hostname: "evil.example" });
    const result = await verifyTurnstileToken("tok");
    expect(result.success).toBe(false);
    expect(result.error).toContain("hostname");
  });

  it("refuses a verification that names no host", async () => {
    stubSiteverify({ success: true });
    expect((await verifyTurnstileToken("tok")).success).toBe(false);
  });

  it("sends the client address along with the token", async () => {
    const fetchMock = stubSiteverify({
      success: true,
      hostname: "headingfwd.com",
    });
    await verifyTurnstileToken("tok", { remoteIp: "203.0.113.9" });

    const body = bodyOf(fetchMock);
    expect(body.remoteip).toBe("203.0.113.9");
    expect(body.response).toBe("tok");
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
  });

  it("allows localhost outside production and refuses it in production", async () => {
    stubSiteverify({ success: true, hostname: "localhost" });
    expect((await verifyTurnstileToken("tok")).success).toBe(true);

    vi.stubEnv("ENVIRONMENT", "production");
    vi.resetModules();
    const production = await import("~/server/services/turnstile");
    stubSiteverify({ success: true, hostname: "localhost" });
    expect((await production.verifyTurnstileToken("tok")).success).toBe(false);
  });

  it("skips the host check for a Cloudflare test secret", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");
    vi.stubEnv("ENVIRONMENT", "production");
    vi.resetModules();
    const withTestKey = await import("~/server/services/turnstile");
    stubSiteverify({ success: true, hostname: "example.com" });
    expect((await withTestKey.verifyTurnstileToken("tok")).success).toBe(true);
  });

  it("refuses example.com for a real secret", async () => {
    stubSiteverify({ success: true, hostname: "example.com" });
    expect((await verifyTurnstileToken("tok")).success).toBe(false);
  });

  it("allows localhost under next dev when ENVIRONMENT is left at production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ENVIRONMENT", "production");
    vi.resetModules();
    const dev = await import("~/server/services/turnstile");
    stubSiteverify({ success: true, hostname: "localhost" });
    expect((await dev.verifyTurnstileToken("tok")).success).toBe(true);
  });
});
