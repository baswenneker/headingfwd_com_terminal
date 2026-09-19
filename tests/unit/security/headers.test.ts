import { describe, expect, it } from "vitest";

/**
 * A/S6 — what every response carries, read from the config itself so the list
 * cannot quietly shrink. SEO6 rides along: `/index` has one address.
 */
interface NextConfig {
  poweredByHeader?: boolean;
  headers?: () => Promise<
    { source: string; headers: { key: string; value: string }[] }[]
  >;
  redirects?: () => Promise<
    { source: string; destination: string; permanent: boolean }[]
  >;
}

const config = (await import("../../../next.config.js"))
  .default as unknown as NextConfig;

describe("next.config headers", () => {
  it("does not announce the framework", () => {
    expect(config.poweredByHeader).toBe(false);
  });

  it("sets the security headers on every path", async () => {
    const rules = (await config.headers?.()) ?? [];
    const rule = rules.find((r) => r.source === "/:path*");
    expect(rule).toBeDefined();

    const headers = new Map(rule!.headers.map((h) => [h.key, h.value]));
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(headers.get("X-Frame-Options")).toBe("DENY");
    expect(headers.get("Permissions-Policy")).toContain("camera=()");
    expect(headers.get("Permissions-Policy")).toContain("microphone=()");
    expect(headers.get("Permissions-Policy")).toContain("geolocation=()");
    expect(headers.get("Strict-Transport-Security")).toContain(
      "max-age=63072000",
    );

    const csp = headers.get("Content-Security-Policy-Report-Only");
    expect(csp).toBeDefined();
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("https://challenges.cloudflare.com");
  });

  it("redirects /index to the homepage", async () => {
    const redirects = (await config.redirects?.()) ?? [];
    expect(redirects).toContainEqual({
      source: "/index",
      destination: "/",
      permanent: true,
    });
  });
});
