import { describe, expect, it } from "vitest";
import RootImage from "~/app/opengraph-image";
import PostImage from "~/app/(editorial)/blog/[slug]/opengraph-image";
import * as CommandImage from "~/app/(terminal)/[command]/opengraph-image";

/**
 * The two `opengraph-image.tsx` route handlers. Both export a default async
 * function returning an `ImageResponse` (a `Response` subclass from
 * `next/og`, which renders through satori — this runs fine under Vitest's
 * Node environment, verified separately: no environment override was needed).
 *
 * Assertions stay at the byte level (PNG signature, IHDR dimensions) rather
 * than pixel content, since satori's rendering is not something a unit test
 * should pin.
 */

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

async function pngBytes(response: Response): Promise<Uint8Array> {
  return new Uint8Array(await response.arrayBuffer());
}

/** IHDR width/height: bytes 16-23, big-endian 32-bit each. */
function ihdrDimensions(bytes: Uint8Array): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

describe("root opengraph-image", () => {
  it("renders a 1200x630 PNG", async () => {
    const response = await RootImage();
    expect(response.headers.get("content-type")).toBe("image/png");

    const bytes = await pngBytes(response);
    expect(Array.from(bytes.slice(0, 8))).toEqual(PNG_SIGNATURE);
    expect(ihdrDimensions(bytes)).toEqual({ width: 1200, height: 630 });
  });
});

describe("post opengraph-image", () => {
  it("renders a 1200x630 PNG for a published post", async () => {
    const response = await PostImage({
      params: Promise.resolve({ slug: "ai-goedkoper-rekening-hoger" }),
    });
    expect(response.headers.get("content-type")).toBe("image/png");

    const bytes = await pngBytes(response);
    expect(Array.from(bytes.slice(0, 8))).toEqual(PNG_SIGNATURE);
    expect(ihdrDimensions(bytes)).toEqual({ width: 1200, height: 630 });
  });
});

describe("command opengraph-image", () => {
  it("renders cards only for registered commands", () => {
    expect(CommandImage.dynamicParams).toBe(false);
    expect(CommandImage.generateStaticParams().length).toBeGreaterThan(0);
  });
});
