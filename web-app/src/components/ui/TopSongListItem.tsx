"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import Link from "next/link";
import { DpIcon } from "@/components/ui/DpIcon";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { buildShareUrl } from "@/lib/share";
import { formatCount } from "@/lib/mv/community";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";

/**
 * ── MIGRATED FROM DP `TopSongListItem` (plan Phase 3, slice 3b) ──────────────
 *
 * Figma "Top_Song_01..10" (nodes 1409:34853-62 at 1440, 1549:27432-41 at 1920).
 * Deliberately NOT DP's shared `ListItem` — bigger 17px title, 14px username,
 * its own icon sizes. `/explore/songs` is the only screen that uses it, which is
 * why slice 3b brings this one across and leaves `ListItem` in the drop.
 *
 * Classes come from `src/styles/designer/TopSongListItem.css`, verbatim. No
 * Tailwind in this subtree (G3-d) — the one Tailwind component referenced,
 * `ShareDialog`, portals to `document.body` through `Modal`, so the two systems
 * never meet on a shared element. Same arrangement /history uses for its ⋯ menu.
 *
 * WHAT CHANGED FROM DP, AND WHY
 *
 *  · REAL STATS. DP passes `plays={0} likes={0} shares={0}` because it has no
 *    per-song engagement data. WA does, so the caller passes the real numbers
 *    through `formatCount` — the same call 3a made for `Card`'s like count and
 *    for wiring its two sections to two real catalogs.
 *
 *  · THE CREATOR LINK IS A `next/link` + `localePath` (R-9). DP assigns
 *    `communityProfileHref(username)` straight onto the document's location,
 *    which is a full page load AND drops the locale prefix — invisible in
 *    English, broken in the other 8 locales. G1-b's greps catch the two literal
 *    shapes of that mistake; this one they cannot see, so it is held by hand.
 *
 *  · CREATE IS GATED (GL-02 / EXP-02). DP's Create button is inert. WA's old
 *    `/explore/songs` row had a working one behind `requireLogin`, and the
 *    action-level gate is a G5-d #3 behaviour — it comes across intact rather
 *    than being re-derived. Same for Like, which WA gates on the player.
 *
 *  · DP's Create button is its `Button` component; WA writes DP's BEM classes
 *    directly on a `<button>`, matching how Sidebar / RoomNavbar / DetailNavbar
 *    already consume `designer/Button.css`.
 */
export function TopSongListItem({
  songId,
  coverImage,
  title,
  username,
  plays,
  likes,
  shares,
  isPlaying = false,
  onSelect,
  onCreate,
  onToggleLike,
  liked,
}: {
  songId: string;
  coverImage?: string;
  title: string;
  username?: string;
  plays: number;
  likes: number;
  shares: number;
  /** Swaps the album-art play icon for a pause icon. */
  isPlaying?: boolean;
  /** Selects this song as Now Playing and starts real playback. */
  onSelect: () => void;
  /** GL-02/EXP-02: gated at the action by the caller. */
  onCreate: () => void;
  onToggleLike: () => void;
  liked: boolean;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const { locale } = useLocale();

  // Rendered twice by design: DP swaps which copy is visible at >=1920, where
  // Figma moves the stats out of the stacked text column into their own row.
  // `SongDetailPage.css` owns that swap; both copies always exist in the DOM.
  const stats = (
    <>
      <span className="top-song__stat">
        <DpIcon name="ic_headphones" className="top-song__stat-icon" />
        {formatCount(plays)}
      </span>
      <span className="top-song__stat">
        <DpIcon name="ic_favorite_off" className="top-song__stat-icon" />
        {formatCount(likes)}
      </span>
      <span className="top-song__stat">
        <DpIcon name="ic_share" className="top-song__stat-icon" />
        {formatCount(shares)}
      </span>
    </>
  );

  return (
    <div className="top-song">
      <button
        type="button"
        className="top-song__album-art"
        onClick={onSelect}
        aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
      >
        {coverImage && <img src={coverImage} alt="" className="top-song__album-image" />}
        <div className="top-song__album-scrim" aria-hidden="true" />
        <DpIcon name={isPlaying ? "ic_pause" : "ic_play"} className="top-song__play-icon" />
      </button>

      <div className="top-song__info">
        <div className="top-song__heading">
          <button type="button" className="top-song__title" onClick={onSelect}>
            {title}
          </button>
          {username && (
            <Link href={localePath(locale, "/creator")} className="top-song__user-row">
              <span className="top-song__avatar">
                <DpIcon name="ic_account" className="top-song__avatar-icon" />
              </span>
              <span className="top-song__username">{username}</span>
            </Link>
          )}
        </div>

        <div className="top-song__social top-song__social--stacked">{stats}</div>
      </div>

      <div className="top-song__social top-song__social--inline">{stats}</div>

      <div className="top-song__actions">
        <button
          type="button"
          className={`top-song__like${liked ? " top-song__like--active" : ""}`}
          onClick={onToggleLike}
          aria-label={liked ? `Unlike ${title}` : `Like ${title}`}
        >
          <DpIcon
            name={liked ? "ic_favorite_on" : "ic_favorite_off"}
            className="top-song__like-icon"
          />
        </button>
        <button
          type="button"
          className="top-song__share"
          onClick={() => setShareOpen(true)}
          aria-label={`Share ${title}`}
        >
          <DpIcon name="ic_share" className="top-song__share-icon" />
        </button>
        <button type="button" className="button button--small button--tertiary" onClick={onCreate}>
          <span className="button__label">Create</span>
        </button>
      </div>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={title}
        url={buildShareUrl(songId)}
      />
    </div>
  );
}
