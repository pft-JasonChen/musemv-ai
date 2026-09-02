"use client";

import { NEW_MVS, TRENDING_MVS } from "@/lib/mv/community";
import { CommunityEmpty, useOnline } from "@/components/community/EmptyState";
import { DetailNavbar, useBackNavigation } from "@/components/shell/DetailNavbar";
import { useDemoFlag } from "@/components/demo/useDemo";
import { FeedEmpty } from "@/components/community/FeedEmpty";
import { MvGridSections } from "@/components/community/MvGridSections";
import { DpIcon } from "@/components/ui/DpIcon";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";

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
 *
 * ── MOBILE HEADER + HIDDEN TAB BAR, 2026-08-20 (product owner, reverses A5's
 *    "no phone back" call for this screen) ─────────────────────────────────
 *
 * A5's original reasoning — "Explore is a mobile tab-bar destination, so a
 * back control solves nothing" — assumed the bottom tab bar stays visible
 * here. Product owner decided it should not: below 767px (A19: the only MV
 * catalog a phone can reach is this screen's PRIMARY section, i.e. Trending),
 * this becomes its own full "Trending MV" screen with a real back control,
 * not a tab-bar destination browsed in place.
 *
 * `.mv-detail__mobile-header` / `.mv-detail__mobile-back` are DP's own
 * classes (`MVDetailPage.css`), already verbatim-gated and already fully
 * styled (sticky 50px bar, 28px/1fr/28px grid) — they were simply unused
 * markup until now, the same "CSS is ahead of the port" shape this codebase
 * has hit repeatedly. `AppShell`'s always-mounted `MobileHeader` /
 * `MobileTabBar` are hidden for this route via `designer-overrides.css`
 * (`:has(.mv-detail)`, same technique `CreditsPage.css` already uses for its
 * own header-only hide) — DP's CSS has no rule for that because DP has no
 * separate shell component to hide in the first place.
 *
 * ── MUST BE `.mv-detail`'s FIRST CHILD, not a sibling before it (fixed
 *    2026-08-21) ────────────────────────────────────────────────────────────
 * `.mv-detail__mobile-header`'s own rule is `margin: 0 -16px; padding: 10px
 * 16px 0` — a full-bleed bar that only lands back at a 16px inset because it
 * is meant to cancel `.mv-detail`'s OWN 16px mobile padding (`.mv-detail {
 * padding: 0 16px 24px }` at 767px). Rendered as a sibling BEFORE `.mv-detail`
 * instead, there is no 16px padding for the negative margin to cancel — the
 * -16px pulls it 16px past the (unpadded) viewport edge and the +16px
 * padding only walks it back to exactly 0, so Back and the title sat flush
 * against the screen edges with no inset at all. Nesting it as the first
 * flex child restores the pairing DP's CSS assumes.
 */

export function MvExplore() {
  const online = useOnline();
  // Product owner, 2026-09-01: `feedEmpty` is the only way to REACH this state
  // — the two seed arrays are module constants and can never be empty for
  // real. Applied as the last render-time branch, never by emptying a seed.
  const demoEmpty = useDemoFlag("feedEmpty");
  const isEmpty = demoEmpty || (TRENDING_MVS.length === 0 && NEW_MVS.length === 0);
  const { locale } = useLocale();
  const goBack = useBackNavigation("/");

  return (
    <>
      {/* Sticky, rendered as the view's own first child — see DetailNavbar for
          why App Router can't use DP's navbar-as-a-prop arrangement. Back falls
          back to Home, since this page IS its section's entry point. */}
      {/* Suppresses DetailNavbar's OWN compact mobile bar so it doesn't stack
          with `.mv-detail__mobile-header` below — desktop is unaffected, this
          modifier only does anything under 767px (DetailNavbar.css). */}
      <DetailNavbar fallbackPath="/" hideMobileBar />

      <div className="mv-detail">
        {/* Phone-only (`.mv-detail__mobile-header` is `display: none` until
            767px — MVDetailPage.css) — Back + the page title, since this is
            the one MV catalog a phone can reach (A19). Must be `.mv-detail`'s
            first child, see this file's header comment. */}
        <div className="mv-detail__mobile-header">
          <a
            href={localePath(locale, "/")}
            onClick={(e) => {
              e.preventDefault();
              goBack();
            }}
            className="mv-detail__mobile-back"
            aria-label="Back"
          >
            <DpIcon name="ic_arrow_left" />
          </a>
          <h1>Trending MV</h1>
        </div>

        {/* EXP-06's offline/empty states are still WA's Tailwind component. It
            replaces the grid rather than sitting inside it, so the two systems
            never meet on one element — same arrangement /history uses for its
            empty state and ⋯ menu. It migrates when its own slice comes up. */}
        {!online ? (
          <CommunityEmpty variant="offline" />
        ) : isEmpty ? (
          /* Was `CommunityEmpty variant="empty"`. Swapped 2026-09-01 so all
             five feed surfaces share ONE empty block — see FeedEmpty.tsx. The
             copy is unchanged; only the visual moved onto /creator's. */
          <FeedEmpty />
        ) : (
          <MvGridSections />
        )}
      </div>
    </>
  );
}
