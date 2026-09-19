import { describe, expect, it } from "vitest";
import BlogListImage from "~/app/(editorial)/blog/opengraph-image";
import CaseImage from "~/app/(editorial)/portfolio/[slug]/opengraph-image";
import PortfolioListImage from "~/app/(editorial)/portfolio/opengraph-image";
import CommandImage, {
  generateStaticParams as commandParams,
} from "~/app/(terminal)/[command]/opengraph-image";
import { generateStaticParams as caseParams } from "~/app/(editorial)/portfolio/[slug]/opengraph-image";
import { COMMAND_PAGES } from "~/app/_components/terminal-commands";
import { visibleCases } from "~/content/cases";

/**
 * The four `opengraph-image` routes added for SEO2 — the command pages, both
 * overviews and a case. The root and post cards are covered separately in
 * tests/unit/opengraph-image.test.ts; all six share one renderer
 * (`~/app/_components/og-card`), so what these assert is that each route hands
 * it usable slots and gets a card of the size crawlers expect back.
 *
 * Byte-level assertions only (PNG signature, IHDR dimensions): satori's
 * pixels are not something a unit test should pin.
 */

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

/** IHDR width/height: bytes 16-23, big-endian 32-bit each. */
function ihdrDimensions(bytes: Uint8Array): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

async function expectCard(response: Response) {
  expect(response.headers.get("content-type")).toBe("image/png");
  const bytes = new Uint8Array(await response.arrayBuffer());
  expect(Array.from(bytes.slice(0, 8))).toEqual(PNG_SIGNATURE);
  expect(ihdrDimensions(bytes)).toEqual({ width: 1200, height: 630 });
}

describe("command opengraph-image", () => {
  it("pre-renders one card per command page", () => {
    expect(commandParams()).toEqual(
      COMMAND_PAGES.map((c) => ({ command: c.token })),
    );
    expect(COMMAND_PAGES.length).toBeGreaterThan(0);
  });

  it("renders a 1200x630 PNG for a command page", async () => {
    await expectCard(
      await CommandImage({ params: Promise.resolve({ command: "services" }) }),
    );
  });
});

describe("case opengraph-image", () => {
  it("pre-renders one card per visible case", () => {
    expect(caseParams()).toEqual(visibleCases().map((c) => ({ slug: c.slug })));
    expect(visibleCases().length).toBeGreaterThan(0);
  });

  it("renders a 1200x630 PNG for a case", async () => {
    const first = visibleCases()[0]!;
    await expectCard(
      await CaseImage({ params: Promise.resolve({ slug: first.slug }) }),
    );
  });

  it("renders a card for an unknown slug rather than throwing", async () => {
    await expectCard(
      await CaseImage({ params: Promise.resolve({ slug: "no-such-case" }) }),
    );
  });
});

describe("overview opengraph-images", () => {
  it("renders a 1200x630 PNG for /blog", async () => {
    await expectCard(await BlogListImage());
  });

  it("renders a 1200x630 PNG for /portfolio", async () => {
    await expectCard(await PortfolioListImage());
  });
});
