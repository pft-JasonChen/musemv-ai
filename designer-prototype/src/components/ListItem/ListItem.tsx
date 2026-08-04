import { useState } from 'react'
import type { CSSProperties } from 'react'
import Button from '../Button/Button'
import ShareDialog, { shareOrOpenDialog } from '../ShareDialog/ShareDialog'
import { communityProfileHref } from '../../data/profile'
import icPlay from '../../assets/icons/ic_play.svg'
import icPause from '../../assets/icons/ic_pause.svg'
import icAccount from '../../assets/icons/ic_account.svg'
import icHeadphones from '../../assets/icons/ic_headphones.svg'
import icFavoriteOff from '../../assets/icons/ic_favorite_off.svg'
import icFavoriteOn from '../../assets/icons/ic_favorite_on.svg'
import icShare from '../../assets/icons/ic_share.svg'
import icChevronRight from '../../assets/icons/ic_chevron-right.svg'
import './ListItem.css'

// Figma "List/List Item/dt" (node 1270:21039) is one master component with
// several Type variants (Song/Community/Settings/Credit/Option/History).
// Only the two variants any page actually needs are built here — Option/
// Settings/Credit/History have no current caller, so they're left out
// rather than built speculatively (see AGENTS.md's rule against
// unnecessary engineering scaffolding); the full spec was fetched from
// Figma if a page ever needs one of them.
// - "community" (default) — username + plays/likes/shares stats + an
//   optional like/share/Create actions row (`cta`). Figma gives Community
//   a genuinely different layout depending on how much room it has: at
//   narrow widths (Figma's "Mobile" variant) title/username/stats stack
//   into one column; at wide widths (Figma's "Desktop" variant) title+
//   username stay a 2-line block but the stats break out into their own
//   side-by-side column instead of stacking under the username. That's
//   driven by a CSS container query on this component's own rendered
//   width, not a viewport breakpoint — the same ListItem shows up in a
//   roomy 2-column list (Home's New Songs) and in a narrow 432px sidebar
//   (My Creations) at the exact same viewport size, so only the
//   component's actual box width can tell them apart.
// - "song" — just a subtitle line + a chevron (tap to view) or a "Create"
//   pill (`cta`), no stats, no actions row. Used for My Creations, which
//   already sits inside one shared bordered list container.

interface ListItemProps {
  coverImage?: string
  title: string
  variant?: 'community' | 'song'
  /** community: shows the like/share/Create actions row. song: swaps the
   *  trailing chevron for a "Create" pill instead. */
  cta?: boolean
  /** community variant only. Omitted hides the user row. */
  username?: string
  /** Falls back to a placeholder icon when omitted — most users won't have uploaded one. */
  avatarUrl?: string
  plays?: number
  likes?: number
  shares?: number
  defaultLiked?: boolean
  /** song variant only — e.g. "AI Song" (no real genre/mood data exists per song yet). */
  subtitle?: string
  isPlaying?: boolean
}

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function ListItem({
  coverImage,
  title,
  variant = 'community',
  cta = false,
  username,
  avatarUrl,
  plays = 0,
  likes = 0,
  shares = 0,
  defaultLiked = false,
  subtitle,
  isPlaying = false,
}: ListItemProps) {
  const [liked, setLiked] = useState(defaultLiked)
  const [shareOpen, setShareOpen] = useState(false)
  const isSong = variant === 'song'

  return (
    <div className={`list-item${isSong ? ' list-item--song' : ''}`}>
      <div className="list-item__main">
        <div className={`list-item__album-art${isSong ? ' list-item__album-art--song' : ''}`}>
          {coverImage && <img src={coverImage} alt="" className="list-item__album-image" />}
          <div className="list-item__album-scrim" aria-hidden="true" />
          <span className="list-item__play-icon" style={maskStyle(isPlaying ? icPause : icPlay)} aria-hidden="true" />
        </div>

        {isSong ? (
          <div className="list-item__info">
            <p className="list-item__title">{title}</p>
            {subtitle && <p className="list-item__subtitle">{subtitle}</p>}
          </div>
        ) : (
          <div className="list-item__community-body">
            <div className="list-item__community-heading">
              <p className="list-item__title">{title}</p>
              {username && (
                // ListItem is often wrapped in a link to the item's own detail
                // page (e.g. My Creations) — preventDefault (blocks that
                // anchor's own navigation) + stopPropagation (blocks any
                // other click listener further up), same as .list-item__actions
                // below, so clicking the avatar/name goes to their profile
                // instead of the card's own destination.
                <button
                  type="button"
                  className="list-item__user-row"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.location.href = communityProfileHref(username)
                  }}
                >
                  <span className="list-item__avatar">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="list-item__avatar-image" />
                    ) : (
                      <span className="list-item__avatar-icon" style={maskStyle(icAccount)} aria-hidden="true" />
                    )}
                  </span>
                  <span className="list-item__username">{username}</span>
                </button>
              )}
            </div>

            <div className="list-item__social-row">
              <span className="list-item__stat">
                <span className="list-item__stat-icon" style={maskStyle(icHeadphones)} aria-hidden="true" />
                {plays}
              </span>
              <span className="list-item__stat">
                <span className="list-item__stat-icon" style={maskStyle(icFavoriteOff)} aria-hidden="true" />
                {likes}
              </span>
              <span className="list-item__stat">
                <span className="list-item__stat-icon" style={maskStyle(icShare)} aria-hidden="true" />
                {shares}
              </span>
            </div>
          </div>
        )}
      </div>

      {isSong ? (
        cta ? (
          <Button size="Small" variant="Tertiary">
            Create
          </Button>
        ) : (
          <span className="list-item__chevron" style={maskStyle(icChevronRight)} aria-hidden="true" />
        )
      ) : (
        cta && (
          <>
            {/* preventDefault + stopPropagation (bubble phase, after each button's
                own onClick has already run): ListItem is sometimes wrapped in a
                link (e.g. New Songs Section) to open the full song page — these
                buttons should act in place, not also navigate there. Just
                stopPropagation isn't enough: it blocks other listeners but not
                the anchor's own built-in navigation, which only preventDefault
                stops. */}
            <div
              className="list-item__actions"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <button
                type="button"
                className={`list-item__like${liked ? ' list-item__like--active' : ''}`}
                onClick={() => setLiked((current) => !current)}
                aria-label={liked ? 'Unlike' : 'Like'}
              >
                <span className="list-item__like-icon" style={maskStyle(liked ? icFavoriteOn : icFavoriteOff)} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="list-item__share"
                onClick={() => shareOrOpenDialog(title, () => setShareOpen(true))}
                aria-label="Share"
              >
                <span className="list-item__share-icon" style={maskStyle(icShare)} aria-hidden="true" />
              </button>
              <Button size="Small" variant="Tertiary">
                Create
              </Button>
            </div>

            <ShareDialog title={title} isOpen={shareOpen} onClose={() => setShareOpen(false)} />
          </>
        )
      )}
    </div>
  )
}

export default ListItem
