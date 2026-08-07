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
import './TopSongListItem.css'

// Figma "Top_Song_01..10" (nodes 1409:34853-62 at 1440, 1549:27432-41 at
// 1920) — distinct from the shared ListItem (bigger 17px title, 14px
// username, its own icon sizes). At >=1920 the plays/likes/shares stats move
// out of the stacked text column to sit as their own row — see
// SongDetailPage.css for where that reflow is wired up.

interface TopSongListItemProps {
  coverImage?: string
  title: string
  /** No real per-song creator identity data exists yet, so callers pass the
   *  same "ScottWu" placeholder used for creator identity elsewhere. */
  username?: string
  avatarUrl?: string
  plays: number
  likes: number
  shares: number
  defaultLiked?: boolean
  /** Title click — navigates to this song's full result/detail view. */
  onSelect?: () => void
  /** Album-art play icon click — starts/toggles in-place playback without
   *  navigating anywhere. Falls back to onSelect if omitted. */
  onPlay?: () => void
  /** Swaps the album-art play icon for a pause icon. */
  isPlaying?: boolean
}

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function TopSongListItem({
  coverImage,
  title,
  username,
  avatarUrl,
  plays,
  likes,
  shares,
  defaultLiked = false,
  onSelect,
  onPlay,
  isPlaying = false,
}: TopSongListItemProps) {
  const [liked, setLiked] = useState(defaultLiked)
  const [shareOpen, setShareOpen] = useState(false)

  const stats = (
    <>
      <span className="top-song__stat">
        <span className="top-song__stat-icon" style={maskStyle(icHeadphones)} aria-hidden="true" />
        {plays}
      </span>
      <span className="top-song__stat">
        <span className="top-song__stat-icon" style={maskStyle(icFavoriteOff)} aria-hidden="true" />
        {likes}
      </span>
      <span className="top-song__stat">
        <span className="top-song__stat-icon" style={maskStyle(icShare)} aria-hidden="true" />
        {shares}
      </span>
    </>
  )

  return (
    <div className="top-song">
      <button
        type="button"
        className="top-song__album-art"
        onClick={onPlay ?? onSelect}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {coverImage && <img src={coverImage} alt="" className="top-song__album-image" />}
        <div className="top-song__album-scrim" aria-hidden="true" />
        <span className="top-song__play-icon" style={maskStyle(isPlaying ? icPause : icPlay)} aria-hidden="true" />
      </button>

      <div className="top-song__info">
        <div className="top-song__heading">
          <button type="button" className="top-song__title" onClick={onSelect}>
            {title}
          </button>
          {username && (
            <button
              type="button"
              className="top-song__user-row"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.location.href = communityProfileHref(username)
              }}
            >
              <span className="top-song__avatar">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="top-song__avatar-image" />
                ) : (
                  <span className="top-song__avatar-icon" style={maskStyle(icAccount)} aria-hidden="true" />
                )}
              </span>
              <span className="top-song__username">{username}</span>
            </button>
          )}
        </div>

        <div className="top-song__social top-song__social--stacked">{stats}</div>
      </div>

      <div className="top-song__social top-song__social--inline">{stats}</div>

      <div className="top-song__actions">
        <button
          type="button"
          className={`top-song__like${liked ? ' top-song__like--active' : ''}`}
          onClick={() => setLiked((current) => !current)}
          aria-label={liked ? 'Unlike' : 'Like'}
        >
          <span className="top-song__like-icon" style={maskStyle(liked ? icFavoriteOn : icFavoriteOff)} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="top-song__share"
          onClick={() => shareOrOpenDialog(title, () => setShareOpen(true))}
          aria-label="Share"
        >
          <span className="top-song__share-icon" style={maskStyle(icShare)} aria-hidden="true" />
        </button>
        <Button size="Small" variant="Tertiary">
          Create
        </Button>
      </div>

      <ShareDialog title={title} isOpen={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  )
}

export default TopSongListItem
