/**
 * Image assets for a post.
 *
 * An author drops a file in `public/blog/<slug>/` and references it by name:
 * `![A diagram](pipeline.png)`. This module turns that name into a public
 * path plus the file's intrinsic width and height, read from the bytes at
 * build time — so the page reserves the right box before the image loads and
 * nothing jumps while reading, without dimensions in the Markdown.
 *
 * SVG files are handled differently: their markup is returned so the renderer
 * can inline it, letting a hand-drawn diagram pick up the page's colours
 * through `currentColor`.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { imageSize } from "image-size";
import type { ResolvedImage } from "./remark-post-structure";

const PUBLIC_DIR = join(process.cwd(), "public");

/** Everything one post's renderer needs to place its images. */
export interface PostAssets {
  /** Resolve an image URL as written in the Markdown. */
  resolve: (url: string) => ResolvedImage | null;
  /** Markup of every inlined SVG, keyed by its public path. */
  inlineSvg: Map<string, string>;
}

/** URLs that are already absolute or external are passed through untouched. */
function isExternal(url: string): boolean {
  return /^[a-z]+:/i.test(url) || url.startsWith("//");
}

/**
 * Build the asset resolver for one post. Nothing is read until an image is
 * actually referenced, so a post with no images touches no files.
 */
export function postAssets(slug: string): PostAssets {
  const inlineSvg = new Map<string, string>();
  const cache = new Map<string, ResolvedImage | null>();

  function read(url: string): ResolvedImage | null {
    if (isExternal(url)) return null;

    // A bare filename belongs to this post; an absolute path is taken as-is.
    const src = url.startsWith("/") ? url : `/blog/${slug}/${url}`;
    const file = join(PUBLIC_DIR, src.replace(/^\//, ""));

    let bytes: Buffer;
    try {
      bytes = readFileSync(file);
    } catch {
      return null;
    }

    if (src.toLowerCase().endsWith(".svg")) {
      inlineSvg.set(src, bytes.toString("utf8"));
      return { kind: "svg", src };
    }

    const { width, height } = imageSize(bytes);
    if (!width || !height) {
      throw new Error(`could not read the dimensions of ${src}`);
    }
    return { kind: "raster", src, width, height };
  }

  return {
    inlineSvg,
    resolve(url) {
      if (!cache.has(url)) cache.set(url, read(url));
      return cache.get(url) ?? null;
    },
  };
}
