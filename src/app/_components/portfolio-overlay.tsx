"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { marked } from "marked";
import { type Case, type CaseVideo, isComingSoonCase } from "~/content/cases";
import { CONTACT } from "~/content/site-content";
import styles from "./portfolio-overlay.module.css";

/**
 * ASCII block-letter "FWD" banner, verbatim from the design reference.
 * white-space:pre in the CSS class preserves the exact column spacing.
 */
const ASCII_BANNER = `██████  ██   ██  █████
██      ██   ██  ██  ██
█████   ██ █ ██  ██  ██
██      ███████  ██  ██
██      ██   ██  █████ `;

/**
 * Tag separator used in the list row — four spaces, a dot, four spaces.
 * Keeps the list view compact while still being scannable.
 */
const TAG_SEP = "    ·    ";

interface PortfolioOverlayProps {
  cases: Case[];
  /** Zero-based index of the currently highlighted / open case. */
  pfIndex: number;
  /** Whether the detail view is open (true) or the list is shown (false). */
  pfDetail: boolean;
  onSetPfIndex: (i: number) => void;
  onSetPfDetail: (d: boolean) => void;
  /** Called when the visitor exits the portfolio back to the terminal. */
  onExit: () => void;
}

/**
 * Fullscreen portfolio browser overlay.
 *
 * Renders on top of the terminal window when the visitor opens the portfolio.
 * Supports two views: a case list (pfDetail=false) and a case detail page
 * (pfDetail=true). Navigation works by keyboard (arrow keys, Enter, Esc) and
 * by mouse (hover selects, click opens, buttons work on click).
 *
 * The overlay takes keyboard focus on mount so arrow keys work immediately.
 * Clicking inside the overlay re-focuses it to restore keyboard nav after
 * mouse interaction.
 *
 * Case data is purely prop-driven — the array comes from `~/content/cases`
 * (the single source of truth). The detail view renders each case's full
 * Markdown `body`; two optional fields (`image`, `caseUrl`) unlock extra UI
 * automatically when present.
 */
export function PortfolioOverlay({
  cases,
  pfIndex,
  pfDetail,
  onSetPfIndex,
  onSetPfDetail,
  onExit,
}: PortfolioOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Grab keyboard focus as soon as the overlay appears so arrow keys work
  // immediately without the visitor having to click first.
  useEffect(() => {
    overlayRef.current?.focus();
  }, []);

  /** Re-focus the overlay after mouse interaction so keyboard nav keeps working. */
  function refocusOverlay() {
    overlayRef.current?.focus();
  }

  /**
   * Keyboard handler for the overlay.
   *
   * List view: ↑/↓ move selection (wraps), ↵ opens the detail, Esc exits
   * to the terminal.
   *
   * Detail view: ←/→ switch case (wraps), Esc or Backspace returns to the
   * list. Enter and ↑/↓ are not handled in detail mode.
   *
   * preventDefault is called on every handled key to stop the browser from
   * scrolling the page or triggering other default behaviours.
   */
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const n = cases.length;

    if (pfDetail) {
      if (e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault();
        onSetPfDetail(false);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onSetPfIndex((pfIndex + 1) % n);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onSetPfIndex((pfIndex - 1 + n) % n);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      onSetPfIndex((pfIndex + 1) % n);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      onSetPfIndex((pfIndex - 1 + n) % n);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onSetPfDetail(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onExit();
    }
  }

  // Clamp pfIndex to valid range in case the cases array changes.
  const safeIndex = Math.max(0, Math.min(pfIndex, cases.length - 1));
  const current = cases[safeIndex]!;

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={refocusOverlay}
    >
      {/* Faint 42px grid overlay — purely decorative */}
      <div className={styles.overlayGrid} aria-hidden="true" />

      {/* Top bar: path on the left, exit button on the right */}
      <div className={styles.topBar}>
        <span className={styles.topBarPrompt}>
          bas@headingfwd:
          <span className={styles.topBarAccent}>~/portfolio</span>
        </span>
        <button className={styles.exitBtn} onClick={onExit}>
          {'[ esc ] exit'}
        </button>
      </div>

      {/* ASCII "FWD" banner — decorative art (the brand is conveyed by the path
          label and subhead), hidden from assistive tech. aria-hidden also keeps
          this horizontally-scrollable <pre> out of the keyboard tab order. */}
      <pre className={styles.asciiBanner} aria-hidden="true">
        {ASCII_BANNER}
      </pre>
      <div className={styles.subhead}>
        {'// selected work — AI engineering & product design'}
      </div>

      {/*
       * Secondary pointer to the LinkedIn profile. stopPropagation keeps the
       * overlay's click-to-refocus handler from firing when the link is clicked,
       * so the anchor navigates instead of just re-focusing the overlay.
       */}
      <a
        href={CONTACT.linkedin}
        target="_blank"
        rel="noreferrer"
        className={styles.subheadLink}
        onClick={(e) => e.stopPropagation()}
      >
        {'→ or view my LinkedIn profile'}
      </a>

      {/* Render list or detail depending on navigation state */}
      {!pfDetail ? (
        <ListView
          cases={cases}
          selectedIndex={safeIndex}
          onHover={onSetPfIndex}
          onOpen={(i) => {
            onSetPfIndex(i);
            onSetPfDetail(true);
          }}
        />
      ) : (
        <DetailView
          caseItem={current}
          index={safeIndex}
          total={cases.length}
          onBack={() => onSetPfDetail(false)}
          onPrev={() => onSetPfIndex((safeIndex - 1 + cases.length) % cases.length)}
          onNext={() => onSetPfIndex((safeIndex + 1) % cases.length)}
        />
      )}
    </div>
  );
}

// ── List view ────────────────────────────────────────────────────────────────

interface ListViewProps {
  cases: Case[];
  selectedIndex: number;
  onHover: (i: number) => void;
  onOpen: (i: number) => void;
}

/**
 * Shows all cases as a scannable list.
 *
 * Hovering a row highlights it (updates the keyboard selection in sync).
 * Clicking a row opens the detail view for that case.
 * The selected row carries a 2px accent left border and a faint background.
 */
function ListView({ cases, selectedIndex, onHover, onOpen }: ListViewProps) {
  return (
    <>
      <div className={styles.listView}>
        {cases.map((c, i) => (
          <div
            key={c.slug}
            className={
              i === selectedIndex
                ? `${styles.listRow} ${styles.listRowSelected}`
                : styles.listRow
            }
            onMouseEnter={() => onHover(i)}
            onClick={() => onOpen(i)}
          >
            <span className={styles.listRowIndex}>{c.n}</span>
            <div>
              <div className={styles.listRowName}>
                {c.title}
                {isComingSoonCase(c) && (
                  <span className={styles.listRowBadge}>coming soon</span>
                )}
              </div>
              <div className={styles.listRowKind}>{c.kind}</div>
              <div className={styles.listRowTags}>{c.tags.join(TAG_SEP)}</div>
            </div>
          </div>
        ))}
        <div className={styles.listDivider} />
      </div>
      <div className={styles.listHelper}>
        {'↑ ↓ navigate · ↵ open · or click a case · esc returns to terminal'}
      </div>
    </>
  );
}

// ── Detail view ──────────────────────────────────────────────────────────────

interface DetailViewProps {
  caseItem: Case;
  index: number;
  total: number;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * Shows the full detail for a single case.
 *
 * Renders a compact metadata line, tag chips, an optional hero image, and the
 * case's full write-up — the Markdown `body` from the single source of truth,
 * converted to HTML with `marked` and styled by the `.caseBody` rules. The
 * body is trusted static content (it ships in `~/content/cases`, never user
 * input), so rendering it via dangerouslySetInnerHTML is safe and lets the
 * terminal aesthetic style every element (incl. tables and quotes).
 *
 * ← prev / next → buttons cycle through cases without returning to the list.
 * Esc or Backspace (handled by the parent overlay) returns to the list.
 */
function DetailView({ caseItem, index, total, onBack, onPrev, onNext }: DetailViewProps) {
  // Convert the Markdown body to HTML once per case (memoised on the body).
  const bodyHtml = useMemo(
    () => marked.parse(caseItem.body) as string,
    [caseItem.body],
  );

  // Coming-soon cases are teasers: the write-up is replaced by a placeholder.
  const comingSoon = isComingSoonCase(caseItem);

  // Compact metadata line: sector · period · status · role (period and role
  // only when present). Coming-soon cases surface that state instead of their
  // lifecycle status.
  const meta = [caseItem.sector];
  if (caseItem.period) meta.push(caseItem.period);
  meta.push(comingSoon ? "coming soon" : caseItem.status);
  if (caseItem.role) meta.push(caseItem.role);

  return (
    <div className={styles.detailView}>
      {/* Return to list */}
      <button className={styles.backBtn} onClick={onBack}>
        ← back to all work
      </button>

      {/* Case index + position counter */}
      <div className={styles.detailCounter}>
        <span className={styles.detailCounterN}>{caseItem.n}</span>
        <span className={styles.detailCounterLabel}>{index + 1} / {total}</span>
      </div>

      {/* Title, one-line kind and metadata */}
      <h2 className={styles.detailTitle}>{caseItem.title}</h2>
      <div className={styles.detailKind}>{caseItem.kind}</div>
      <div className={styles.detailMeta}>{meta.join("  ·  ")}</div>

      {/* Tag chips */}
      <div className={styles.detailTags}>
        {caseItem.tags.map((tag) => (
          <span key={tag} className={styles.detailTag}>
            {tag}
          </span>
        ))}
      </div>

      {/*
       * Optional hero image — rendered only when caseItem.image is set. With no
       * image the detail jumps straight to the write-up (no placeholder box).
       */}
      {caseItem.image && (
        <div className={styles.detailVisualImage}>
          <Image
            src={caseItem.image.src}
            alt={caseItem.image.alt}
            fill
            sizes="(max-width: 800px) 100vw, 800px"
            style={{ objectFit: "cover" }}
          />
        </div>
      )}

      {/*
       * Write-up region. Published cases render their full Markdown body;
       * coming-soon cases render a placeholder panel instead — the same case
       * still shows its title, kind, meta and tags above, so it reads as a
       * proper teaser rather than an empty page.
       */}
      {comingSoon ? (
        <div className={styles.comingSoon}>
          <div className={styles.comingSoonMark}>🚧 coming soon</div>
          <p className={styles.comingSoonText}>
            This case is being written up soon. Want to know more now, or build
            something similar? Feel free to get in touch.
          </p>
        </div>
      ) : (
        <div
          className={styles.caseBody}
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      )}

      {/*
       * Click-to-play video previews — rendered from the structured `videos`
       * field (not the Markdown body) so the overlay can show real thumbnails
       * and embed players. Keyed by slug so play state resets per case.
       */}
      {!comingSoon && caseItem.videos && caseItem.videos.length > 0 && (
        <VideoPreviews key={caseItem.slug} videos={caseItem.videos} />
      )}

      {/* Button row — prev/next navigation + CTA + optional case link */}
      <div className={styles.detailButtons}>
        <button className={styles.outlineBtn} onClick={onPrev}>
          ← prev
        </button>
        <button className={styles.outlineBtn} onClick={onNext}>
          next →
        </button>

        {/*
         * "read the case study →" appears only when caseItem.caseUrl is set.
         * Add caseUrl in cases.ts to activate this button — no changes to this
         * component are needed.
         */}
        {caseItem.caseUrl && (
          <a
            href={caseItem.caseUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.outlineBtn}
            onClick={(e) => e.stopPropagation()}
          >
            read the case study →
          </a>
        )}

        <a
          href={CONTACT.linkedin}
          target="_blank"
          rel="noreferrer"
          className={styles.ctaBtn}
          onClick={(e) => e.stopPropagation()}
        >
          work with me →
        </a>
      </div>
    </div>
  );
}

// ── Video previews ───────────────────────────────────────────────────────────

/**
 * Click-to-play YouTube previews for a case.
 *
 * Each video renders as a lightweight facade: just its thumbnail plus a play
 * button. Clicking swaps in the real YouTube iframe for that one video — loaded
 * paused, never autoplaying, so the visitor stays in control — and no YouTube
 * script loads until then, keeping the detail view fast. The parent keys this
 * component by case slug, so the loaded state resets when switching cases.
 */
function VideoPreviews({ videos }: { videos: CaseVideo[] }) {
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <section className={styles.videoSection}>
      <div className={styles.videoSectionTitle}>
        {"// video — see it in action"}
      </div>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlaying(v.id);
                  }}
                  aria-label={`Play video: ${v.title}`}
                >
                  {/* External YouTube thumbnail (facade). A plain <img> avoids
                      next/image remote-pattern config for a decorative preview. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className={styles.videoThumbImg}
                    src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
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
                onClick={(e) => e.stopPropagation()}
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
