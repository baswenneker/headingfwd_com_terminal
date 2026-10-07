import { cacheLife } from "next/cache";
import {
  draftPreviewEnabled,
  findRoutablePost,
  publishedPosts,
  routablePosts,
  type Post,
} from "~/content/posts";

/**
 * Cached views of the post list, for the routes.
 *
 * Visibility depends on today's date, so a page that lists or renders posts
 * has to decide it again after midnight in Amsterdam. The routes therefore
 * read posts through these functions rather than the synchronous ones in
 * `posts.ts`: the result is prerendered at build time and recomputed at most
 * an hour after it goes stale, so a scheduled post goes live on its date
 * without a new deploy.
 *
 * Outside production the entry is refreshed in the background a second
 * after it was served, so a post the author has just written, or a draft they
 * are editing, shows up on the second refresh. That is the shortest lifetime
 * that still prerenders: anything shorter turns the read into request-time
 * work, which Cache Components reports as an error on every page view in dev.
 *
 * This is a module of its own because `posts.ts` must load without Next.js:
 * the end-to-end suite imports it directly.
 */
function cacheVisibility(): void {
  if (draftPreviewEnabled()) {
    cacheLife({ stale: 30, revalidate: 1, expire: 300 });
  } else {
    cacheLife("hours");
  }
}

/** `routablePosts()`, cached for the routes. */
export async function getRoutablePosts(): Promise<Post[]> {
  "use cache";
  cacheVisibility();
  return routablePosts();
}

/** `publishedPosts()`, cached for the routes. */
export async function getPublishedPosts(): Promise<Post[]> {
  "use cache";
  cacheVisibility();
  return publishedPosts();
}

/** `findRoutablePost()`, cached for the routes. */
export async function getRoutablePost(slug: string): Promise<Post | undefined> {
  "use cache";
  cacheVisibility();
  return findRoutablePost(slug);
}
