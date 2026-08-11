"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { formatCount } from "@/lib/mv/community";
import { DpIcon } from "@/components/ui/DpIcon";
import { ShareDialog } from "@/components/ui/ShareDialog";

/**
 * DP's `ListItem` (`src/styles/designer/ListItem.css`).
 *
 * ── BOTH OF DP'S VARIANTS ARE NOW BUILT ────────────────────────────────────
 *
 * `song` shipped with `/mv/room`'s My Creations rail. `community` arrives with
 * the landing page, whose "Newly Released Songs" block is its first caller —
 * username, plays/likes/shares, and a like/share/Create actions row. DP's own
 * file makes the same argument for the four Figma variants it left out
 * (Settings / Credit / Option / History): a variant with no caller is
 * speculative scaffolding, and the CSS is vendored whole either way.
 *
 * ── WHAT IS DELIBERATELY *NOT* COPIED FROM DP ──────────────────────────────
 *
 *  · **The song variant's trailing chevron.** DP renders one whenever `cta` is
 *    off. WA's three existing `song` call sites are non-interactive rails, and
 *    a chevron there would advertise a tap target that does nothing. The
 *    existing markup is left byte-for-byte as it was so those three screens'
 *    baselines do not move; this component grew, it did not change.
 *  · **`window.location.href` for the avatar and the Create pill.** Both become
 *    `router.push(localePath(…))` (R-9): a raw href is a full page load AND
 *    drops the locale prefix, which looks perfect in English and is broken in
 *    the other eight locales. WA has one generic creator page, so the avatar
 *    routes to `/creator` with no username param, matching `Card`.
 *  · **`shareOrOpenDialog`'s `navigator.share` branch.** WA has one share
 *    surface, `ShareDialog`, and every other migrated screen opens it directly.
 *
 * ── THE STATS ARE FORMATTED, WHICH DP DOES NOT DO ──────────────────────────
 *
 * DP hardcodes `0` for all three counts, so it never exercised the width. WA's
 * fixtures reach five digits, which overflows the row; `formatCount` is the same
 * fix `Card` needed for exactly the same reason.
 *
 * ── EVERY ICON HERE WAS TAG-CHECKED AGAINST `ListItem.css` (D4) ────────────
 *
 * `.list-item__play-icon`, `__avatar-icon`, `__stat-icon`, `__like-icon` and
 * `__share-icon` all set `background-color` (`currentColor` or a token) plus
 * `mask-*` ⇒ `DpIcon`, and none of the five rules selects by element, so a
 * `<span>` is correct. `.list-item__album-image` and `__avatar-image` are
 * `width`/`height` only ⇒ real `<img>`.
 */
export function ListItem({
  coverImage,
  title,
  variant = "song",
  subtitle,
  isPlaying = false,
  cta = false,
  username,
  avatarUrl,
  plays = 0,
  likes = 0,
  shares = 0,
  defaultLiked = false,
  shareUrl,
  onCreate,
  onSelect,
  onPlay,
}: {
  coverImage?: string;
  title: string;
  /** Defaults to `song` — the variant WA had first. DP's own default is `community`. */
  variant?: "song" | "community";
  /** song only — e.g. "AI Song". */
  subtitle?: string;
  isPlaying?: boolean;
  /** community: shows the like/share/Create actions row. */
  cta?: boolean;
  /** community only. Omitted hides the user row. */
  username?: string;
  /** Falls back to a placeholder icon — most users will not have uploaded one. */
  avatarUrl?: string;
  plays?: number;
  likes?: number;
  shares?: number;
  defaultLiked?: boolean;
  /** Where Share copies from. Omit and the share button is not rendered. */
  shareUrl?: string;
  /** The Create pill. Callers wrap this in `requireLogin` themselves — the gate
   *  belongs to the screen's product rule, not to a presentational row. */
  onCreate?: () => void;
  /** Opens this item's own detail page. Fires on a click ANYWHERE in the row
   *  (designer request, 2026-08-11 — was title-only before, on the reasoning
   *  that a row-wide zone makes the user/like/share/Create targets easy to
   *  trigger by accident; overridden because those targets already
   *  `stopPropagation()` their own clicks, so they were never actually at
   *  risk). Album art keeps its own dedicated "preview in place" behavior
   *  (`onPlay`) rather than also navigating — that is a deliberately
   *  separate interaction, not one of the two exceptions asked for. */
  onSelect?: () => void;
  /** Album-art click — starts playback in place without navigating. Falls back
   *  to `onSelect`. Omit both and the art stays a non-interactive `<div>`. */
  onPlay?: () => void;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const [liked, setLiked] = useState(defaultLiked);
  const [shareOpen, setShareOpen] = useState(false);

  const isSong = variant === "song";
  const artAction = onPlay ?? onSelect;

  const artContent = (
    <>
      {coverImage && <img src={coverImage} alt="" className="list-item__album-image" />}
      <div className="list-item__album-scrim" aria-hidden="true" />
      <DpIcon name={isPlaying ? "ic_pause" : "ic_play"} className="list-item__play-icon" />
    </>
  );

  const artClass = `list-item__album-art${isSong ? " list-item__album-art--song" : ""}`;

  const titleEl = <p className="list-item__title">{title}</p>;

  return (
    <div
      className={`list-item${isSong ? " list-item--song" : ""}${onSelect ? " list-item--clickable" : ""}`}
      onClick={onSelect}
    >
      <div className="list-item__main">
        {artAction ? (
          <button
            type="button"
            className={artClass}
            // Album art keeps its own "preview in place" behaviour — stop the
            // click here so it doesn't ALSO bubble up and trigger the row's
            // onSelect navigation (see onSelect's own doc comment above).
            onClick={(e) => {
              e.stopPropagation();
              artAction();
            }}
            aria-label={isPlaying ? `Pause ${title}` : `Play ${title}`}
          >
            {artContent}
          </button>
        ) : (
          <div className={artClass}>{artContent}</div>
        )}

        {isSong ? (
          <div className="list-item__info">
            {titleEl}
            {subtitle && <p className="list-item__subtitle">{subtitle}</p>}
          </div>
        ) : (
          <div className="list-item__community-body">
            <div className="list-item__community-heading">
              {titleEl}
              {username && (
                // The row is often wrapped in a link to the item's own page, so
                // preventDefault (blocks that anchor's own navigation) plus
                // stopPropagation (blocks any listener further up) is what makes
                // the avatar go to the profile rather than the row's target.
                <button
                  type="button"
                  className="list-item__user-row"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(localePath(locale, "/creator"));
                  }}
                >
                  <span className="list-item__avatar">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="list-item__avatar-image" />
                    ) : (
                      <DpIcon name="ic_account" className="list-item__avatar-icon" />
                    )}
                  </span>
                  <span className="list-item__username">{username}</span>
                </button>
              )}
            </div>

            <div className="list-item__social-row">
              <span className="list-item__stat">
                <DpIcon name="ic_headphones" className="list-item__stat-icon" />
                {formatCount(plays)}
              </span>
              <span className="list-item__stat">
                <DpIcon name="ic_favorite_off" className="list-item__stat-icon" />
                {formatCount(likes + (liked ? 1 : 0))}
              </span>
              <span className="list-item__stat">
                <DpIcon name="ic_share" className="list-item__stat-icon" />
                {formatCount(shares)}
              </span>
            </div>
          </div>
        )}
      </div>

      {!isSong && cta && (
        <>
          {/* preventDefault + stopPropagation on the bubble, after each button's
              own onClick has run: this group is inside a link, and these controls
              act in place rather than also navigating. stopPropagation alone is
              not enough — it blocks other listeners but not the anchor's own
              built-in navigation, which only preventDefault stops. */}
          <div
            className="list-item__actions"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <button
              type="button"
              className={`list-item__like${liked ? " list-item__like--active" : ""}`}
              onClick={() => setLiked((current) => !current)}
              aria-label={liked ? "Unlike" : "Like"}
            >
              <DpIcon
                name={liked ? "ic_favorite_on" : "ic_favorite_off"}
                className="list-item__like-icon"
              />
            </button>
            {shareUrl && (
              <button
                type="button"
                className="list-item__share"
                onClick={() => setShareOpen(true)}
                aria-label="Share"
              >
                <DpIcon name="ic_share" className="list-item__share-icon" />
              </button>
            )}
            {/* Designer fix, 2026-08-11: gated on `onCreate` being passed —
                a "Create" pill with nothing to do (Song Result's "My
                Creations" rail has no remix action for the user's OWN
                song) is a dead control, not a smaller feature. Every
                existing caller already passes `onCreate` whenever it sets
                `cta`, so this changes nothing for them. */}
            {onCreate && (
              <button
                type="button"
                className="button button--small button--tertiary"
                onClick={onCreate}
              >
                <span className="button__label">Create</span>
              </button>
            )}
          </div>

          {shareUrl && (
            <ShareDialog
              open={shareOpen}
              onClose={() => setShareOpen(false)}
              title={title}
              url={shareUrl}
            />
          )}
        </>
      )}
    </div>
  );
}
