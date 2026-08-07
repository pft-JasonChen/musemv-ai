"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NEW_MVS, TRENDING_MVS, mvCoverRatio, type CommunityMv } from "@/lib/mv/community";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { useMediaQuery, PHONE_QUERY } from "@/lib/ssr";
import {
  computeJustifiedRows,
  aspectRatioOf,
  DESKTOP_QUERY,
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

function MvGrid({ items }: { items: readonly GridItem[] }) {
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
        <MvGrid items={topPicks} />
      </section>

      <section className="mv-detail__grid-section">
        <SectionHeader title="Newly Released Music Videos" mobileTitle="New MVs" />
        <MvGrid items={newlyReleased} />
      </section>
    </>
  );
}
