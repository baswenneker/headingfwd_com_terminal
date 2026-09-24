import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  checkRateLimit,
  checkSessionRateLimit,
  limitFromEnv,
} from "~/server/services/rate-limiter";
import { migratedDb, truncateAll, schema } from "../helpers/db";

/**
 * A/S3 — the limiter has to hold its cap when calls overlap, and it may not
 * leave rows behind once they are older than the longest window.
 */
describe("checkRateLimit", () => {
  beforeAll(async () => {
    await migratedDb();
  });

  beforeEach(async () => {
    await truncateAll();
  });

  it("allows up to the cap and refuses the next one", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) {
      results.push(await checkRateLimit("id-a", "message", 3, 60_000));
    }
    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results[2]?.remaining).toBe(0);
    expect(results[3]?.remaining).toBe(0);
  });

  it("never lets more than the cap through when calls overlap", async () => {
    const db = await migratedDb();
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        checkRateLimit("id-burst", "message", 5, 60_000),
      ),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(5);

    const rows = await db.query.rateLimitLogs.findMany();
    expect(rows).toHaveLength(20);
  });

  it("sweeps rows older than the longest window for every identifier", async () => {
    const db = await migratedDb();
    const old = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await db.insert(schema.rateLimitLogs).values([
      { identifier: "someone-else", action: "message", createdAt: old },
      { identifier: "someone-else", action: "email_send", createdAt: old },
    ]);

    await checkRateLimit("id-b", "message", 3, 60_000);

    const rows = await db.query.rateLimitLogs.findMany();
    expect(rows.map((r) => r.identifier)).toEqual(["id-b"]);
  });

  it("removes a refused request's row when denied attempts do not count", async () => {
    const db = await migratedDb();
    const results = [];
    for (let i = 0; i < 5; i++) {
      results.push(
        await checkRateLimit("id-c", "session_create", 3, 60_000, {
          countDenied: false,
        }),
      );
    }
    expect(results.map((r) => r.allowed)).toEqual([
      true,
      true,
      true,
      false,
      false,
    ]);
    expect(await db.query.rateLimitLogs.findMany()).toHaveLength(3);
  });

  it("holds the cap under overlap when denied attempts do not count", async () => {
    const db = await migratedDb();
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        checkRateLimit("id-d", "session_create", 5, 60_000, {
          countDenied: false,
        }),
      ),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
    expect(await db.query.rateLimitLogs.findMany()).toHaveLength(5);
  });

  it("lets one client start 20 sessions an hour and keeps 20 rows after a refusal", async () => {
    const db = await migratedDb();
    const results = [];
    for (let i = 0; i < 21; i++) {
      results.push(await checkSessionRateLimit("client-a"));
    }
    expect(results.slice(0, 20).every((r) => r.allowed)).toBe(true);
    expect(results[20]?.allowed).toBe(false);
    expect(await db.query.rateLimitLogs.findMany()).toHaveLength(20);
  });
});

describe("limitFromEnv", () => {
  it("falls back on an empty, non-numeric, zero or negative value", () => {
    expect(limitFromEnv(undefined, 10)).toBe(10);
    expect(limitFromEnv("", 10)).toBe(10);
    expect(limitFromEnv("abc", 10)).toBe(10);
    expect(limitFromEnv("0", 20)).toBe(20);
    expect(limitFromEnv("-3", 20)).toBe(20);
  });

  it("uses a positive number as given", () => {
    expect(limitFromEnv("15", 10)).toBe(15);
  });
});
