"use client";

import { DpIcon } from "@/components/ui/DpIcon";

/**
 * The empty state for a FEED — the three Home rails, the two explore
 * catalogs, and the genre-filtered song list.
 *
 * ── WHY THIS EXISTS (product owner, 2026-09-01) ─────────────────────────────
 *
 * The empty-state coverage was inconsistent in a way only a real backend would
 * have exposed. `/creator` has had a proper empty state since 2026-08-28
 * (Figma "Community User Profile — Empty", reachable via `?demo=1`'s
 * `profileEmpty`), and `/explore/mvs` had a Tailwind-era one. The three Home
 * rails and `/explore/songs`' list had NOTHING: the seed arrays are never
 * empty, so nobody could reach the state, and the day the real feed returns
 * zero items every one of those surfaces would have rendered a bare heading
 * over blank space. That was `TBD-EXP-06`.
 *
 * The decision was "reuse `/creator`'s block, do not wait for a new design".
 *
 * ── WHAT IS REUSED, AND WHAT IS DELIBERATELY NOT ────────────────────────────
 *
 * The VISUAL is `/creator`'s: the same `ic_media` glyph and the same
 * `.history-page__empty-*` type classes, so the two states read as one family.
 *
 * The COPY is `CommunityEmpty`'s existing `empty` variant — "Nothing here yet"
 * / "Be the first to create!" — NOT `/creator`'s "No works released yet".
 * Both strings are already approved; this picks the one that was approved for
 * *this* surface. `/creator`'s wording is about one person's own output and
 * reads wrong on a global feed, and inventing a third string would have put an
 * unsourced product decision into the spec.
 *
 * No CTA. `/creator` shows a create button only on your OWN profile, on the
 * reasoning that prompting a visitor to go create on a stranger's page reads
 * as wrong. A feed has no owner at all, so there is no case where the CTA
 * would be the `self` one — and the Home screen's own tool selector is already
 * the create entry point a few hundred pixels up the page.
 *
 * ── HOW IT IS REACHED ───────────────────────────────────────────────────────
 *
 * Real data can never empty these lists, so `?demo=1`'s `feedEmpty` switch is
 * the only way in — the same arrangement `profileEmpty` already uses for
 * `/creator`. Every consumer applies it as the LAST render-time branch
 * (`demoEmpty ? [] : rows`), never by mutating a seed constant.
 *
 * `/explore/songs` is the one consumer where this ALSO has a real trigger with
 * the flag off: a genre tab whose catalog holds no songs renders empty, which
 * used to be a bare list with no message at all (`DESIGNER-TODO` A30).
 */
export function FeedEmpty({ className }: { className?: string }) {
  return (
    <div className={`feed-empty${className ? ` ${className}` : ""}`}>
      <DpIcon name="ic_media" className="history-page__empty-icon" />
      <div className="history-page__empty-message">
        <p className="history-page__empty-title">Nothing here yet</p>
        <p className="history-page__empty-subtitle">Be the first to create!</p>
      </div>
    </div>
  );
}
