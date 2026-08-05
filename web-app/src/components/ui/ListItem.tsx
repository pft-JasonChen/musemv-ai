/* eslint-disable @next/next/no-img-element */
import { DpIcon } from "@/components/ui/DpIcon";

/**
 * DP's `ListItem`, **`song` variant only** (`src/styles/designer/ListItem.css`).
 *
 * DP's component has two variants. Only `song` has a caller in WA today — the
 * `/mv/room` My Creations rail — so only `song` is built. DP's own file makes
 * the same argument for the four Figma variants it left out: a variant with no
 * caller is speculative scaffolding, and the CSS is vendored whole either way,
 * so adding `community` later is markup, not a re-sync.
 *
 * The `community` variant is also the one whose avatar navigates by assigning a
 * location directly, which would have to be reworked onto `next/link` +
 * `localePath()` (R-9) before it could ship. Not porting it now avoids
 * importing that problem early.
 */
export function ListItem({
  coverImage,
  title,
  subtitle,
  isPlaying = false,
}: {
  coverImage?: string;
  title: string;
  subtitle?: string;
  isPlaying?: boolean;
}) {
  return (
    <div className="list-item list-item--song">
      <div className="list-item__main">
        <div className="list-item__album-art list-item__album-art--song">
          {coverImage && <img src={coverImage} alt="" className="list-item__album-image" />}
          <div className="list-item__album-scrim" aria-hidden="true" />
          <DpIcon name={isPlaying ? "ic_pause" : "ic_play"} className="list-item__play-icon" />
        </div>
        <div className="list-item__info">
          <p className="list-item__title">{title}</p>
          {subtitle && <p className="list-item__subtitle">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}
