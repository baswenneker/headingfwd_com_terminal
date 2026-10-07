import { revalidateTag } from "next/cache";
import { CONTENT_TAG } from "~/content/cached-posts";
import { draftPreviewEnabled } from "~/content/posts";

/**
 * Expires every cache entry built from the content files, so the next request
 * reads them again. Called by the file watcher in src/instrumentation.ts when
 * a post or an image changes in dev. Absent in production, where the files
 * cannot change under a running server.
 */
export function POST() {
  if (!draftPreviewEnabled()) {
    return new Response(null, { status: 404 });
  }
  revalidateTag(CONTENT_TAG, { expire: 0 });
  return new Response(null, { status: 204 });
}
