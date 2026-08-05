"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NEW_MVS, TRENDING_MVS, mvCoverRatio, type CommunityMv } from "@/lib/mv/community";
import { CommunityEmpty, useOnline } from "@/components/community/EmptyState";
import { CommunityMvDialog } from "./CommunityMvDialog";
import { DetailNavbar } from "@/components/shell/DetailNavbar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Card } from "@/components/ui/Card";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { useMediaQuery } from "@/lib/ssr";
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
 * WHAT DID NOT CHANGE. Clicking a video still opens `CommunityMvDialog` in
 * place, exactly as before — the plan's per-screen rule is to replace JSX and
 * class names while keeping WA's behaviour, and dialog-vs-navigate is a
 * behaviour change that would need its own slice and its own e2e. The offline
 * and empty states (EXP-06) are also unchanged.
 *
 * TWO SECTIONS, REAL DATA. DP shows "Top Picks" and "Newly Released" and fills
 * the second by REVERSING the same catalog — it has no second list. WA has two
 * genuinely different ones, so they map straight onto the designer's layout:
 * Top Picks ← TRENDING_MVS, Newly Released ← NEW_MVS.
 *
 * The old "← Home" text button is gone because `DetailNavbar` now carries back
 * navigation; this screen is where Q6's `router.back()`-with-fallback lands.
 */

const TOP_PICKS = TRENDING_MVS;
const NEWLY_RELEASED = NEW_MVS;

type GridItem = CommunityMv & { ratio: MvRatio };

const withRatio = (items: readonly CommunityMv[]): GridItem[] =>
  items.map((m) => ({ ...m, ratio: mvCoverRatio(m.id) }));

function MvGrid({ items, onOpen }: { items: readonly GridItem[]; onOpen: (id: string) => void }) {
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
   * outright). The click is intercepted so it opens the dialog instead, which
   * is what this screen has always done; the real href is what makes
   * middle-click and "copy link address" work and what lets axe see a link with
   * a destination. Same convention as the /history card.
   */
  function link(mv: GridItem) {
    return {
      href: localePath(locale, `/watch?id=${mv.id}`),
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        onOpen(mv.id);
      },
    };
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

export function MvExplore({ initialPlayId }: { initialPlayId?: string }) {
  const [playId, setPlayId] = useState<string | null>(initialPlayId ?? null);
  const online = useOnline();

  const topPicks = withRatio(TOP_PICKS);
  const newlyReleased = withRatio(NEWLY_RELEASED);
  const isEmpty = topPicks.length === 0 && newlyReleased.length === 0;

  return (
    <>
      {/* Sticky, rendered as the view's own first child — see DetailNavbar for
          why App Router can't use DP's navbar-as-a-prop arrangement. Back falls
          back to Home, since this page IS its section's entry point. */}
      <DetailNavbar fallbackPath="/" />

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
            <section className="mv-detail__grid-section">
              {/* This page is already the "See all" destination, so neither
                  section links anywhere further. */}
              <SectionHeader title="Top Picks Music Videos" mobileTitle="Top Picks" />
              <MvGrid items={topPicks} onOpen={setPlayId} />
            </section>

            <section className="mv-detail__grid-section">
              <SectionHeader title="Newly Released Music Videos" mobileTitle="New MVs" />
              <MvGrid items={newlyReleased} onOpen={setPlayId} />
            </section>
          </>
        )}
      </div>

      <CommunityMvDialog open={playId != null} mvId={playId} onClose={() => setPlayId(null)} />
    </>
  );
}
