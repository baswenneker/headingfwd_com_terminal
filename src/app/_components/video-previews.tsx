"use client";

import { useState } from "react";
import type { CaseVideo } from "~/content/cases";
import styles from "./video-previews.module.css";

/**
 * Click-to-play YouTube previews for a case.
 *
 * Each video renders as a lightweight facade: just its thumbnail plus a play
 * button. Clicking swaps in the real YouTube iframe for that one video — loaded
 * paused, never autoplaying, so the visitor stays in control — and no YouTube
 * script loads until then, keeping the page fast.
 *
 * This is the only client component on an editorial page, and only on a case
 * that actually has videos. The page around it stays server-rendered.
 */
export function VideoPreviews({ videos }: { videos: CaseVideo[] }) {
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <section className={styles.videoSection}>
      <h2 className={styles.videoSectionTitle}>Video — see it in action</h2>
      <div className={styles.videoGrid}>
        {videos.map((v) => (
          <figure key={v.id} className={styles.videoCard}>
            <div className={styles.videoFrame}>
              {playing === v.id ? (
                <iframe
                  className={styles.videoIframe}
                  src={`https://www.youtube.com/embed/${v.id}?rel=0`}
                  title={v.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  className={styles.videoThumb}
                  onClick={() => setPlaying(v.id)}
                  aria-label={`Play video: ${v.title}`}
                >
                  {/* External YouTube thumbnail (facade). A plain <img> avoids
                      next/image remote-pattern config for a decorative preview.
                      `hqdefault.jpg` is always 480×360; stating it reserves the
                      box before the bytes arrive, so a case page with five
                      previews never shifts mid-read. The alt is empty: the
                      button's aria-label already names the video, and a
                      second name would be read out twice. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className={styles.videoThumbImg}
                    src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
                    width={480}
                    height={360}
                    alt=""
                    loading="lazy"
                  />
                  <span className={styles.videoPlay} aria-hidden="true">
                    ▶
                  </span>
                  {v.result && (
                    <span className={styles.videoBadge} aria-hidden="true">
                      {v.result === "fail" ? "❌" : "✅"}
                    </span>
                  )}
                </button>
              )}
            </div>
            <figcaption className={styles.videoCaption}>
              <a
                href={v.url}
                target="_blank"
                rel="noreferrer"
                className={styles.videoTitle}
              >
                {v.title}
              </a>
              {v.note && <span className={styles.videoNote}>{v.note}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
