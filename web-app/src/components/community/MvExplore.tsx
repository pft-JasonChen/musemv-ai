"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NEW_MVS, TRENDING_MVS, mvCoverRatio, type CommunityMv } from "@/lib/mv/community";
import { CommunityEmpty, useOnline } from "@/components/community/EmptyState";
import { DetailNavbar } from "@/components/shell/DetailNavbar";
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
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, first screen after /history) ──
 *
 * Source: the LOWER half of DP's `MVDetailPage` — the justified gallery (S15,
 * a deliberate redesign, not a like-for-like port of the old 4-column grid).
 * DP's one file covers two of our routes; its upper half (`.mv-player*`) is
 * `/watch` and is a separate slice. Classes come from
 * `src/styles/designer/MVDetailPage.css`, verbatim; no Tailwind in this subtree
 * (G3-d).
 *
 * CLICKING A CARD NAVIGATES (2026-08-06). Slice 3a deliberately kept WA's
 * in-place `CommunityMvDialog`, on the grounds that dialog-vs-navigate is a
 * behaviour change needing its own slice and its own e2e. This is that slice:
 * the product owner reported the dialog as a DP mismatch. DP's grid links at
 * `/mv-detail?id=…`, which is this app's `/watch` — the screen migrated in 3d
 * from the very same DP file's upper half. So the destination already existed
 * and already had the player, the like/share and the Create MV CTA; the dialog
 * was a second, older rendering of the same thing. It is gone from this screen.
 * The offline and empty states (EXP-06) are unchanged.
 *
 * TWO SECTIONS, REAL DATA. DP shows "Top Picks" and "Newly Released" and fills
 * the second by REVERSING the same catalog — it has no second list. WA has two
 * genuinely different ones, so they map straight onto the designer's layout:
 * Top Picks ← TRENDING_MVS, Newly Released ← NEW_MVS.
 *
 * ── AND THAT IS EXACTLY WHY THE PHONE LAYOUT COSTS SOMETHING (drop 2) ────────
 * DP's mobile rule hides every `.mv-detail__grid-section` and re-shows only
 * `--primary`. For DP that is lossless: its second section is the first one
 * reversed, so nothing is unreachable. For WA it means **NEW_MVS is not
 * reachable at all below 768px** — Newly Released is desktop-only.
 *
 * Product owner decided 2026-08-07: FOLLOW DP, and record the cost here rather
 * than hide it. This is the same call, and the same shape, as the `/explore/songs`
 * phone tab-pills decision the day before (`designer-overrides.css`, A4). If it
 * turns out to matter it is a designer request for a mobile two-section design,
 * not something to patch around with an override.
 *
 * The alternative that was rejected — putting `--primary` on BOTH sections — was
 * one class and would have kept both catalogs. It was turned down because it is
 * a deviation that DECAYS: every future drop reverts it, exactly like the `Idea`
 * buttons.
 *
 * The old "← Home" text button is gone because `DetailNavbar` now carries back
 * navigation; this screen is where Q6's `router.back()`-with-fallback lands.
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

  /**
   * ── THE R-2 PATTERN, SECOND INSTANCE ──────────────────────────────────────
   *
   * DP writes this as
   *   useState(() => typeof window !== 'undefined' ? matchMedia(q).matches : false)
   * — the same shape as the Sidebar's, which slice 2a measured throwing React
   * error 418, `hydration failed`, at 1000px. The `typeof window` guard stops it
   * CRASHING under SSR, which is exactly what makes it look safe; what it
   * actually guarantees is that server and first client render disagree.
   *
   * A sweep of the whole drop found this pattern in exactly two files. Both are
   * fixed; there is no third.
   *
   * The fix itself moved OUT of here in slice 3b: `/song/play` needs the same
   * question asked of the phone cutover, and the pre-flight is explicit about not
   * ending up with two sources for it. `useMediaQuery` carries the reasoning.
   */
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

  /**
   * The href is WA's own route for playing a community MV (D3 — DP's
   * `/mv-detail?id=&from=` scheme is not adopted, and Q6 rejects `?from=`
   * outright, so the id travels but the origin does not). No intercepted click
   * any more: this is a plain `next/link` navigation, so middle-click, copy-link
   * and a normal click all reach the same place.
   */
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

  /**
   * ── PHONES GET DP'S TWO-COLUMN MASONRY (drop 2, `2670ed2`) ─────────────────
   *
   * Not a nicety — without it this screen is BLANK below 768px. That drop's
   * `MVDetailPage.css` hides `.mv-detail__grid-section` outright on phones and
   * expects `.mv-detail__mobile-grid` to take over; re-copying the stylesheet
   * verbatim (which G2-b requires) therefore deleted the screen until this
   * branch existed. Measured 2026-08-06: `.mv-detail__grid` present in the DOM,
   * `display: none`, nothing else painted.
   *
   * The split is greedy-by-estimated-height, and a plain `index % 2` is the
   * wrong answer for the same reason it was upstream: `mvCoverRatio` alternates
   * 3:4 / 4:3 by index, so an even-by-COUNT split puts every tall cover in one
   * column and every short one in the other. Both columns share a width, so
   * `1 / aspectRatio` is a valid proportional height to balance on.
   */
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

export function MvExplore() {
  const online = useOnline();

  const topPicks = withRatio(TOP_PICKS);
  const newlyReleased = withRatio(NEWLY_RELEASED);
  const isEmpty = topPicks.length === 0 && newlyReleased.length === 0;

  return (
    <>
      {/* Sticky, rendered as the view's own first child — see DetailNavbar for
          why App Router can't use DP's navbar-as-a-prop arrangement. Back falls
          back to Home, since this page IS its section's entry point. */}
      {/* A5: no phone back — Explore is a mobile tab-bar destination, so there is
          nothing to be trapped in and the row would only cost vertical space. */}
      <DetailNavbar fallbackPath="/" hideMobileBar />

      <div className="mv-detail">
        {/* EXP-06's offline/empty states are still WA's Tailwind component. It
            replaces the grid rather than sitting inside it, so the two systems
            never meet on one element — same arrangement /history uses for its
            empty state and ⋯ menu. It migrates when its own slice comes up. */}
        {!online ? (
          <CommunityEmpty variant="offline" />
        ) : isEmpty ? (
          <CommunityEmpty variant="empty" />
        ) : (
          <>
            {/* `--primary` is what survives on phones. DP's mobile rule hides
                every `.mv-detail__grid-section` and re-shows only this one, with
                its SectionHeader suppressed — see the header note above for the
                catalog that costs us. */}
            <section className="mv-detail__grid-section mv-detail__grid-section--primary">
              {/* This page is already the "See all" destination, so neither
                  section links anywhere further. */}
              <SectionHeader title="Top Picks Music Videos" mobileTitle="Top Picks" />
              <MvGrid items={topPicks} />
            </section>

            <section className="mv-detail__grid-section">
              <SectionHeader title="Newly Released Music Videos" mobileTitle="New MVs" />
              <MvGrid items={newlyReleased} />
            </section>
          </>
        )}
      </div>
    </>
  );
}
