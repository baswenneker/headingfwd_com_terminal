import { type MetadataRoute } from "next";

/**
 * `/sitemap.xml` — the indexable surfaces of the site. Two HTML routes (the
 * terminal home and the deep-linked portfolio) plus the plain-text agent
 * source at `/llms.txt`, which is a real, crawlable URL worth surfacing.
 *
 * `lastModified` is intentionally omitted rather than stamped with a build-time
 * date: the metadata route runs during static generation where `Date.now()` is
 * discouraged, and an inaccurate date is worse than none.
 */
const SITE_URL = "https://headingfwd.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/portfolio`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/llms.txt`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
