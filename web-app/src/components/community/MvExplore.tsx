"use client";

import { NEW_MVS, TRENDING_MVS } from "@/lib/mv/community";
import { CommunityEmpty, useOnline } from "@/components/community/EmptyState";
import { DetailNavbar } from "@/components/shell/DetailNavbar";
import { MvGridSections } from "@/components/community/MvGridSections";

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
 *
 * The grid itself (both sections, the justified/masonry/wrap layout math) now
 * lives in `MvGridSections` — extracted 2026-08-07 on its second consumer,
 * `CommunityMvPlayer` (`/watch`), which needed the exact same two sections
 * below the player to match DP. See that file for the full reasoning.
 */

export function MvExplore() {
  const online = useOnline();
  const isEmpty = TRENDING_MVS.length === 0 && NEW_MVS.length === 0;

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
          <MvGridSections />
        )}
      </div>
    </>
  );
}
