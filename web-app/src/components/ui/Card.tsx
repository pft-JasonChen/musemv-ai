"use client";
/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { formatCount } from "@/lib/mv/community";
import { DpIcon } from "@/components/ui/DpIcon";

/**
 * ── MIGRATED FROM THE DESIGNER PROTOTYPE (plan Phase 3, /explore/mvs slice) ──
 *
 * Port of DP's `components/Card/Card.tsx`; classes come from
 * `src/styles/designer/Card.css`, verbatim. Per G3-d this subtree carries NO
 * Tailwind utilities.
 *
 * It lands with `/explore/mvs` because that is its first real consumer, but the
 * whole component is ported rather than just the Video/community combination —
 * `/explore/songs`, `/creator` and Home all take the other branches, and porting
 * a quarter of it now would mean re-deriving the rest three more times.
 *
 * THREE DELIBERATE DEPARTURES FROM DP:
 *
 *  1. Icons are `DpIcon` (a public-path mask) rather than DP's bundler-inlined
 *     `import icPlay from '…svg'`. That relies on a Vite glob helper Next has no
 *     equivalent for, and G1-b bans the construct by name anyway.
 *
 *  2. The creator link navigates with `router.push(localePath(…))`, not DP's
 *     hard location assignment to `communityProfileHref(username)`. R-9: a raw
 *     href is a full page load AND drops the locale prefix — which looks perfect
 *     in English and is broken in the other eight locales. It stays a `<button>`
 *     (not a Link) because Card is itself wrapped in an anchor by its callers
 *     and nesting anchors is invalid HTML; preventDefault + stopPropagation is
 *     DP's own convention here and is what stops the outer link also firing.
 *     WA has one generic creator page, so every existing call site routes to
 *     `/creator` with no username param — this matches them.
 *
 *  3. `likes` is run through `formatCount`. DP hardcodes 38 for every video so
 *     it never exercised the width; WA's community fixtures go to 3,050, which
 *     overflows the pill as a raw integer.
 */

export type CardType = "Video" | "Song";
export type CardRatio = "3:4" | "4:3";

interface CardProps {
  type?: CardType;
  /** Video only — Song is always 1:1 in Figma. */
  ratio?: CardRatio;
  community?: boolean;
  title: string;
  /** Shown when community=false. */
  subtitle?: string;
  /** Shown when community=true. */
  username?: string;
  likes?: number;
  /** Falls back to a placeholder icon when omitted — most users won't have uploaded one. */
  avatarUrl?: string;
  /** e.g. "HOT" / "NEW" — optional, works in any Type/Community/Ratio combination. */
  badge?: string;
  coverImage?: string;
  className?: string;
  /** Swaps the play icon for a pause icon — for Song cards with real audio. */
  isPlaying?: boolean;
  /** Makes the play button interactive (e.g. toggle real playback) instead of decorative.
   *  Stops the click from bubbling, so a Card wrapped in a link doesn't also navigate. */
  onPlayClick?: () => void;
}

export function Card({
  type = "Video",
  ratio = "3:4",
  community = false,
  title,
  subtitle,
  username,
  likes,
  avatarUrl,
  badge,
  coverImage,
  className,
  isPlaying = false,
  onPlayClick,
}: CardProps) {
  const router = useRouter();
  const { locale } = useLocale();

  const isVideo = type === "Video";
  const effectiveRatio = isVideo ? ratio : "1:1";
  const hasCover = community || !isVideo;

  const classes = [
    "card",
    `card--${isVideo ? "video" : "song"}`,
    hasCover ? `card--cover-${effectiveRatio.replace(":", "-")}` : "card--flat",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  function handlePlayClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    onPlayClick?.();
  }

  const playIcon = <DpIcon name={isPlaying ? "ic_pause" : "ic_play"} className="card__play-icon" />;

  const playButton = (
    <div className="card__play-row">
      {onPlayClick ? (
        <button
          type="button"
          className={`card__play card__play--${isVideo ? "video" : "song"}`}
          onClick={handlePlayClick}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {playIcon}
        </button>
      ) : (
        <div className={`card__play card__play--${isVideo ? "video" : "song"}`}>{playIcon}</div>
      )}
    </div>
  );

  // Optional on/off toggle, same idea as Button's leading/trailing icon —
  // shown whenever a badge is passed in, regardless of type/community/ratio.
  const badgeElement = badge && (
    <div className="card__badge-row">
      <span className={`card__badge${badge === "NEW" ? " card__badge--new" : ""}`}>{badge}</span>
    </div>
  );

  return (
    <div className={classes}>
      {hasCover ? (
        <div className="card__cover">
          {coverImage && <img src={coverImage} alt="" className="card__cover-image" />}
          {isVideo && <div className="card__cover-scrim" aria-hidden="true" />}
          {badgeElement}
          {playButton}
        </div>
      ) : (
        <>
          {coverImage && (
            <img src={coverImage} alt="" className="card__cover-image card__cover-image--flat" />
          )}
          <div className="card__cover-scrim card__cover-scrim--flat" aria-hidden="true" />
          {badgeElement}
        </>
      )}

      <div className="card__body">
        <p className="card__title">{title}</p>

        {community ? (
          <div className="card__user-row">
            <button
              type="button"
              className="card__user-link"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(localePath(locale, "/creator"));
              }}
            >
              <span className="card__avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="card__avatar-image" />
                ) : (
                  <DpIcon name="ic_account" className="card__avatar-icon" />
                )}
              </span>
              <span className="card__username">{username}</span>
            </button>
            <span className="card__likes">
              <DpIcon name="ic_favorite_off" className="card__likes-icon" />
              <span className="card__likes-count">{formatCount(likes ?? 0)}</span>
            </span>
          </div>
        ) : (
          <p className="card__subtitle">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
