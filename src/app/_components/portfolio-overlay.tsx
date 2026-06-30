"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { type Project } from "./terminal-projects";
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
  projects: Project[];
  /** Zero-based index of the currently highlighted / open project. */
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
 * Supports two views: a project list (pfDetail=false) and a project detail
 * page (pfDetail=true). Navigation works by keyboard (arrow keys, Enter, Esc)
 * and by mouse (hover selects, click opens, buttons work on click).
 *
 * The overlay takes keyboard focus on mount so arrow keys work immediately.
 * Clicking inside the overlay re-focuses it to restore keyboard nav after
 * mouse interaction.
 *
 * Project data is purely prop-driven. Two optional fields on each project
 * (image and caseUrl) are rendered automatically when provided — no code
 * change is needed, only editing the data file.
 */
export function PortfolioOverlay({
  projects,
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
   * Detail view: ←/→ switch project (wraps), Esc or Backspace returns to the
   * list. Enter and ↑/↓ are not handled in detail mode.
   *
   * preventDefault is called on every handled key to stop the browser from
   * scrolling the page or triggering other default behaviours.
   */
  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const n = projects.length;

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

  // Clamp pfIndex to valid range in case projects array changes.
  const safeIndex = Math.max(0, Math.min(pfIndex, projects.length - 1));
  const current = projects[safeIndex]!;

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

      {/* ASCII "FWD" banner */}
      <pre className={styles.asciiBanner}>{ASCII_BANNER}</pre>
      <div className={styles.subhead}>
        {'// selected work — AI engineering & product design'}
      </div>

      {/* Render list or detail depending on navigation state */}
      {!pfDetail ? (
        <ListView
          projects={projects}
          selectedIndex={safeIndex}
          onHover={onSetPfIndex}
          onOpen={(i) => {
            onSetPfIndex(i);
            onSetPfDetail(true);
          }}
        />
      ) : (
        <DetailView
          project={current}
          index={safeIndex}
          total={projects.length}
          onBack={() => onSetPfDetail(false)}
          onPrev={() => onSetPfIndex((safeIndex - 1 + projects.length) % projects.length)}
          onNext={() => onSetPfIndex((safeIndex + 1) % projects.length)}
        />
      )}
    </div>
  );
}

// ── List view ────────────────────────────────────────────────────────────────

interface ListViewProps {
  projects: Project[];
  selectedIndex: number;
  onHover: (i: number) => void;
  onOpen: (i: number) => void;
}

/**
 * Shows all projects as a scannable list.
 *
 * Hovering a row highlights it (updates the keyboard selection in sync).
 * Clicking a row opens the detail view for that project.
 * The selected row carries a 2px accent left border and a faint background.
 */
function ListView({ projects, selectedIndex, onHover, onOpen }: ListViewProps) {
  return (
    <>
      <div className={styles.listView}>
        {projects.map((project, i) => (
          <div
            key={project.n}
            className={
              i === selectedIndex
                ? `${styles.listRow} ${styles.listRowSelected}`
                : styles.listRow
            }
            onMouseEnter={() => onHover(i)}
            onClick={() => onOpen(i)}
          >
            <span className={styles.listRowIndex}>{project.n}</span>
            <div>
              <div className={styles.listRowName}>{project.name}</div>
              <div className={styles.listRowKind}>{project.kind}</div>
              <div className={styles.listRowTags}>{project.tags.join(TAG_SEP)}</div>
            </div>
          </div>
        ))}
        <div className={styles.listDivider} />
      </div>
      <div className={styles.listHelper}>
        {'↑ ↓ navigate · ↵ open · or click a project · esc returns to terminal'}
      </div>
    </>
  );
}

// ── Detail view ──────────────────────────────────────────────────────────────

interface DetailViewProps {
  project: Project;
  index: number;
  total: number;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * Shows the full detail for a single project.
 *
 * Renders tag chips, body paragraphs, and a visual box. The visual box shows
 * a real image when project.image is set, or a striped placeholder otherwise.
 * A "read the case study →" link appears when project.caseUrl is set.
 *
 * ← prev / next → buttons cycle through projects without returning to the
 * list. Esc or Backspace (handled by the parent overlay) returns to the list.
 */
function DetailView({ project, index, total, onBack, onPrev, onNext }: DetailViewProps) {
  return (
    <div className={styles.detailView}>
      {/* Return to list */}
      <button className={styles.backBtn} onClick={onBack}>
        ← back to all work
      </button>

      {/* Project index + position counter */}
      <div className={styles.detailCounter}>
        <span className={styles.detailCounterN}>{project.n}</span>
        <span className={styles.detailCounterLabel}>{index + 1} / {total}</span>
      </div>

      {/* Title and kind */}
      <h2 className={styles.detailTitle}>{project.name}</h2>
      <div className={styles.detailKind}>{project.kind}</div>

      {/* Tag chips */}
      <div className={styles.detailTags}>
        {project.tags.map((tag) => (
          <span key={tag} className={styles.detailTag}>
            {tag}
          </span>
        ))}
      </div>

      {/* Body paragraphs */}
      <div className={styles.detailBody}>
        {project.detail.map((para, i) => (
          <p key={i} className={styles.detailPara}>
            {para}
          </p>
        ))}
      </div>

      {/*
       * Visual box — shows a real image when project.image is provided,
       * otherwise falls back to the striped placeholder. No component change
       * is needed to activate the image: add the `image` field in
       * terminal-projects.ts and it appears here automatically.
       */}
      {project.image ? (
        <div className={styles.detailVisualImage}>
          <Image
            src={project.image.src}
            alt={project.image.alt}
            fill
            sizes="(max-width: 800px) 100vw, 800px"
            style={{ objectFit: "cover" }}
          />
        </div>
      ) : (
        <div className={styles.detailVisual}>
          {'[ project visual / case study — drop one in on request ]'}
        </div>
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
         * "read the case study →" appears only when project.caseUrl is set.
         * Add caseUrl in terminal-projects.ts to activate this button —
         * no changes to this component are needed.
         */}
        {project.caseUrl && (
          <a
            href={project.caseUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.outlineBtn}
            onClick={(e) => e.stopPropagation()}
          >
            read the case study →
          </a>
        )}

        <a
          href="mailto:bas@headingfwd.com"
          className={styles.ctaBtn}
          onClick={(e) => e.stopPropagation()}
        >
          work with me →
        </a>
      </div>
    </div>
  );
}
