import type { CSSProperties, MouseEvent } from 'react'
import icPlay from '../../assets/icons/ic_play.svg'
import icPause from '../../assets/icons/ic_pause.svg'
import icFavoriteOff from '../../assets/icons/ic_favorite_off.svg'
import icAccount from '../../assets/icons/ic_account.svg'
import { communityProfileHref } from '../../data/profile'
import './Card.css'

export type CardType = 'Video' | 'Song'
export type CardRatio = '3:4' | '4:3'

interface CardProps {
  type?: CardType
  /** Video only — Song is always 1:1 in Figma. */
  ratio?: CardRatio
  community?: boolean
  title: string
  /** Shown when community=false. */
  subtitle?: string
  /** Shown when community=true. */
  username?: string
  likes?: number
  /** Falls back to a placeholder icon when omitted — most users won't have uploaded one. */
  avatarUrl?: string
  /** e.g. "HOT" / "NEW" — optional, works in any Type/Community/Ratio combination. */
  badge?: string
  coverImage?: string
  className?: string
  /** Swaps the play icon for a pause icon — for Song cards with real audio. */
  isPlaying?: boolean
  /** Makes the play button interactive (e.g. toggle real playback) instead of decorative.
   *  Stops the click from bubbling, so a Card wrapped in a link doesn't also navigate. */
  onPlayClick?: () => void
}

function maskStyle(src: string): CSSProperties {
  // Vite inlines small SVGs as a data URI containing literal single quotes,
  // so the url() value must be double-quoted or the browser drops it as invalid.
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function Card({
  type = 'Video',
  ratio = '3:4',
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
  const isVideo = type === 'Video'
  const effectiveRatio = isVideo ? ratio : '1:1'
  const hasCover = community || !isVideo

  const classes = [
    'card',
    `card--${isVideo ? 'video' : 'song'}`,
    hasCover ? `card--cover-${effectiveRatio.replace(':', '-')}` : 'card--flat',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  function handlePlayClick(event: MouseEvent) {
    event.preventDefault()
    event.stopPropagation()
    onPlayClick?.()
  }

  const playIcon = <span className="card__play-icon" style={maskStyle(isPlaying ? icPause : icPlay)} aria-hidden="true" />

  const playButton = (
    <div className="card__play-row">
      {onPlayClick ? (
        <button
          type="button"
          className={`card__play card__play--${isVideo ? 'video' : 'song'}`}
          onClick={handlePlayClick}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {playIcon}
        </button>
      ) : (
        <div className={`card__play card__play--${isVideo ? 'video' : 'song'}`}>{playIcon}</div>
      )}
    </div>
  )

  // Optional on/off toggle, same idea as Button's leading/trailing icon —
  // shown whenever a badge is passed in, regardless of type/community/ratio.
  const badgeElement = badge && (
    <div className="card__badge-row">
      <span className={`card__badge${badge === 'NEW' ? ' card__badge--new' : ''}`}>{badge}</span>
    </div>
  )

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
          {coverImage && <img src={coverImage} alt="" className="card__cover-image card__cover-image--flat" />}
          <div className="card__cover-scrim card__cover-scrim--flat" aria-hidden="true" />
          {badgeElement}
        </>
      )}

      <div className="card__body">
        <p className="card__title">{title}</p>

        {community ? (
          <div className="card__user-row">
            {/* Card is often wrapped in a link to its own detail page —
                preventDefault (blocks that anchor's navigation) +
                stopPropagation, same convention as ListItem, so clicking the
                creator's avatar/name goes to their profile instead. */}
            <button
              type="button"
              className="card__user-link"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (username) window.location.href = communityProfileHref(username)
              }}
            >
              <span className="card__avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="card__avatar-image" />
                ) : (
                  <span className="card__avatar-icon" style={maskStyle(icAccount)} aria-hidden="true" />
                )}
              </span>
              <span className="card__username">{username}</span>
            </button>
            <span className="card__likes">
              <span className="card__likes-icon" style={maskStyle(icFavoriteOff)} aria-hidden="true" />
              <span className="card__likes-count">{likes}</span>
            </span>
          </div>
        ) : (
          <p className="card__subtitle">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

export default Card
