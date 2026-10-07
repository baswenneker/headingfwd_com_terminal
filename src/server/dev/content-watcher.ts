import { watch, type FSWatcher } from "node:fs";
import { join } from "node:path";

/**
 * Dev only: expire the cached content as soon as a post or an image changes,
 * so the first refresh after a save shows it.
 *
 * The routes read posts through `"use cache"` functions (src/content/
 * cached-posts.ts), and Next does not know those depend on files outside the
 * module graph. This watcher tells it: on a change it calls
 * /api/dev/content-changed, which expires the `content` cache tag.
 */

/** Directories whose files end up in a cached render, relative to the repo. */
const WATCHED = [
  "content/blog",
  "public/blog",
  "public/portfolio",
  "public/workshops",
];

/** An editor saves a file in several writes; wait until they settle. */
const DEBOUNCE_MS = 150;

// `register()` can run more than once in one dev process; keep one watcher.
const state = globalThis as { __contentWatchers?: FSWatcher[] };

export function watchContent(): void {
  if (state.__contentWatchers) return;
  state.__contentWatchers = [];

  let timer: NodeJS.Timeout | undefined;
  const notify = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const port = process.env.PORT ?? "3000";
      fetch(`http://localhost:${port}/api/dev/content-changed`, {
        method: "POST",
      }).catch((error: unknown) => {
        console.warn("[content] could not expire the content cache:", error);
      });
    }, DEBOUNCE_MS);
  };

  for (const dir of WATCHED) {
    try {
      state.__contentWatchers.push(
        watch(join(process.cwd(), dir), { recursive: true }, notify),
      );
    } catch {
      // The directory does not exist yet (no images for that section).
    }
  }
}
