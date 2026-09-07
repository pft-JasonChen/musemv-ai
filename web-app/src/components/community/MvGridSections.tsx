"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NEW_MVS, TRENDING_MVS, mvCoverRatio, type CommunityMv } from "@/lib/mv/community";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";
import { useMediaQuery, PHONE_QUERY } from "@/lib/ssr";
import {
  computeJustifiedRows,
  aspectRatioOf,
  DESKTOP_QUERY,
  MAX_ROW_HEIGHT,
  type MvRatio,
} from "@/lib/mv/justifiedRows";

/**
 * The "Top Picks" / "Newly Released" justified grid — extracted from
 * `MvExplore` (`/explore/mvs`) on its second consumer, `CommunityMvPlayer`
 * (`/watch`). Same rule this codebase already follows for `DpIcon` /
 * `useMediaQuery` / `useDialogTransition`: a third private copy is how two
 * sources of truth start.
 *
 * DP's `MVDetailPage` renders these same two sections below the player in
 * ITS "selected" state too — `/mv-detail?id=…` is one file, list state and
 * player state both keep the grid mounted underneath. WA had split the grid
 * off into its own route (`/explore/mvs`) and `/watch` dropped it entirely;
 * this restores DP's behaviour (designer request, 2026-08-07) without
 * duplicating `MvExplore`'s layout/data logic.
 *
 * Deliberately no "exclude the MV you're watching" filter — DP doesn't
 * filter its own catalog either (`MV_CATALOG` includes the selected item).
 */

const TOP_PICKS = TRENDING_MVS;
const NEWLY_RELEASED = NEW_MVS;

type GridItem = CommunityMv & { ratio: MvRatio };

const withRatio = (items: readonly CommunityMv[]): GridItem[] =>
  items.map((m) => ({ ...m, ratio: mvCoverRatio(m.id) }));

function gridLink(locale: Locale, mv: GridItem) {
  return { href: localePath(locale, `/watch?id=${mv.id}`) };
}

function gridCard(mv: GridItem) {
  return (
    <Card
      type="Video"
      ratio={mv.ratio}
      community
      title={mv.title}
      username={mv.creator}
      likes={mv.likes}
      badge={mv.badge ?? undefined}
      coverImage={mv.thumb}
    />
  );
}

/**
 * Desktop-only horizontal-scroll row for "Top Picks Music Videos" (product
 * owner, 2026-09-07) — everywhere else (this section on phone/tablet, and
 * "Newly Released Music Videos" at every width) stays the wrapping/justified
 * grid `MvGrid` already rendered; only this ONE section, only ≥1024px,
 * switches to a single row + Previous/Next arrows once it overflows.
 *
 * No DP reference for this exists — `MVDetailPage.css` has no prev/next
 * classes anywhere near `.mv-detail__grid` — so this borrows the Home page's
 * own established pattern instead of inventing a new one: `NewMVsSection`'s
 * scroll-state logic (`canScrollBack`/`canScrollForward`, gated on real
 * overflow so an arrow never sits there as a dead control) duplicated a
 * third time, matching how `TopPicksSection`'s copy of the same pattern
 * already duplicated the first one — this codebase has no shared hook for
 * it yet, and extracting one is a separate refactor, not part of this ask.
 * New classes (`.mv-top-picks-row*`, `designer-overrides.css`) rather than
 * reusing `.new-mvs__*` verbatim — those are `new-mvs`'s own scoped names.
 *
 * ── EQUAL CARD HEIGHT, VARIABLE WIDTH (product owner, 2026-09-07 follow-up) ──
 *
 * `Card`'s own CSS is `width: 100%; aspect-ratio: <ratio>` (`Card.css`) —
 * height always follows whatever width its wrapper gives it. A single fixed
 * `--mv-top-picks-card-width` for every item (the first cut of this row)
 * therefore gave 4:3 cards a SHORTER height than 3:4 ones at the same width
 * — inconsistent with "Newly Released Music Videos"' own justified grid
 * below, where every card in a row shares one height and WIDTH is what
 * varies by ratio. Same fix here: one shared height (`MAX_ROW_HEIGHT`, the
 * justified grid's own ceiling, reused rather than inventing a second
 * constant) and each item's width computed as `height * aspectRatioOf(ratio)`
 * — exactly the arithmetic `computeJustifiedRows` already does per row,
 * just against a single implicit row instead of solving where to break
 * multiple ones (there's only one row here, nothing to justify).
 */
function MvTopPicksRow({ items }: { items: readonly GridItem[] }) {
  const { locale } = useLocale();
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  function updateScrollState() {
    const row = rowRef.current;
    if (!row) return;
    setCanScrollBack(row.scrollLeft > 1);
    setCanScrollForward(row.scrollLeft + row.clientWidth < row.scrollWidth - 1);
  }

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, []);

  function scrollByCard(direction: -1 | 1) {
    const row = rowRef.current;
    const firstItem = row?.querySelector<HTMLElement>(".mv-top-picks-item");
    if (!row || !firstItem) return;
    const gap = Number.parseFloat(window.getComputedStyle(row).columnGap) || 0;
    row.scrollBy({ left: direction * (firstItem.offsetWidth + gap), behavior: "smooth" });
  }

  return (
    <div className="mv-top-picks-row-wrapper">
      <div className="mv-top-picks-row" ref={rowRef} onScroll={updateScrollState}>
        {items.map((mv) => (
          <Link
            key={mv.id}
            {...gridLink(locale, mv)}
            className="mv-top-picks-item"
            style={{ width: MAX_ROW_HEIGHT * aspectRatioOf(mv.ratio) }}
          >
            {gridCard(mv)}
          </Link>
        ))}
      </div>

      {canScrollBack && (
        <div className="mv-top-picks-previous">
          <IconButton
            size="large"
            variant="ghost"
            icon="ic_arrow_left"
            label="Previous"
            onClick={() => scrollByCard(-1)}
          />
        </div>
      )}

      {canScrollForward && (
        <div className="mv-top-picks-next">
          <IconButton
            size="large"
            variant="ghost"
            icon="ic_arrow_right"
            label="Next"
            onClick={() => scrollByCard(1)}
          />
        </div>
      )}
    </div>
  );
}

function MvGrid({ items, asRow = false }: { items: readonly GridItem[]; asRow?: boolean }) {
  const { locale } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // See `MvExplore`'s header note (the R-2 pattern) for why this isn't a
  // `typeof window` SSR-guarded `useState` initializer.
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const isPhone = useMediaQuery(PHONE_QUERY);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) =>
      setContainerWidth(entries[0].contentRect.width),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function link(mv: GridItem) {
    return { href: localePath(locale, `/watch?id=${mv.id}`) };
  }

  function card(mv: GridItem) {
    return (
      <Card
        type="Video"
        ratio={mv.ratio}
        community
        title={mv.title}
        username={mv.creator}
        likes={mv.likes}
        badge={mv.badge ?? undefined}
        coverImage={mv.thumb}
      />
    );
  }

  // Phones get DP's two-column masonry — see `MvExplore`'s header note for
  // why this branch exists at all (without it the grid is blank <768px).
  if (isPhone) {
    const columns: GridItem[][] = [[], []];
    const heights = [0, 0];
    items.forEach((mv) => {
      const shorter = heights[0] <= heights[1] ? 0 : 1;
      columns[shorter].push(mv);
      heights[shorter] += 1 / aspectRatioOf(mv.ratio);
    });

    return (
      <div className="mv-detail__mobile-grid" ref={containerRef}>
        {columns.map((column, columnIndex) => (
          <div className="mv-detail__mobile-column" key={columnIndex}>
            {column.map((mv) => (
              <Link key={mv.id} {...link(mv)} className="mv-detail__grid-item">
                {card(mv)}
              </Link>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // Below Laptop width the justified-row maths (built around the 1440 desktop
  // frame Figma provides) has no room to work — fall back to the simpler
  // fixed-width wrapping grid.
  if (!isDesktop) {
    return (
      <div className="mv-detail__grid mv-detail__grid--wrap" ref={containerRef}>
        {items.map((mv) => (
          <Link
            key={mv.id}
            {...link(mv)}
            className={`mv-detail__grid-item mv-detail__grid-item--${mv.ratio.replace(":", "-")}`}
          >
            {card(mv)}
          </Link>
        ))}
      </div>
    );
  }

  // Desktop-only opt-in (see `MvTopPicksRow`'s own header comment) — everything
  // above this point (phone/tablet) is unaffected by `asRow`.
  if (asRow) {
    return <MvTopPicksRow items={items} />;
  }

  const rows = computeJustifiedRows(items, containerWidth);

  return (
    <div className="mv-detail__grid" ref={containerRef}>
      {rows.map((row, rowIndex) => (
        <div className="mv-detail__grid-row" key={rowIndex}>
          {row.items.map((mv) => (
            <Link
              key={mv.id}
              {...link(mv)}
              className="mv-detail__grid-item"
              style={{ width: row.coverHeight * aspectRatioOf(mv.ratio) }}
            >
              {card(mv)}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}

/** The two sections together, exactly as both `/explore/mvs` and `/watch` mount them. */
export function MvGridSections() {
  const topPicks = withRatio(TOP_PICKS);
  const newlyReleased = withRatio(NEWLY_RELEASED);

  return (
    <>
      <section className="mv-detail__grid-section mv-detail__grid-section--primary">
        <SectionHeader title="Top Picks Music Videos" mobileTitle="Top Picks" />
        <MvGrid items={topPicks} asRow />
      </section>

      <section className="mv-detail__grid-section">
        <SectionHeader title="Newly Released Music Videos" mobileTitle="New MVs" />
        <MvGrid items={newlyReleased} />
      </section>
    </>
  );
}
