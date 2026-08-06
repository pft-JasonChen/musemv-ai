import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import AppLayout from '../../layouts/AppLayout/AppLayout'
import DetailNavbar from '../../components/DetailNavbar/DetailNavbar'
import SectionHeader from '../../components/SectionHeader/SectionHeader'
import Card from '../../components/Card/Card'
import Button from '../../components/Button/Button'
import IconButton from '../../components/IconButton/IconButton'
import ShareDialog, { shareOrOpenDialog } from '../../components/ShareDialog/ShareDialog'
import { communityProfileHref } from '../../data/profile'
import icAccount from '../../assets/icons/ic_account.svg'
import icFavoriteOff from '../../assets/icons/ic_favorite_off.svg'
import icFavoriteOn from '../../assets/icons/ic_favorite_on.svg'
import icShare from '../../assets/icons/ic_share.svg'
import icArrowRight from '../../assets/icons/ic_arrow_right.svg'
import icPlay from '../../assets/icons/ic_play.svg'
import icPause from '../../assets/icons/ic_pause.svg'
import icSpeakerOn from '../../assets/icons/ic_speaker_on.svg'
import icSpeakerOff from '../../assets/icons/ic_speaker_off.svg'
import icExpand from '../../assets/icons/ic_expand.svg'
import icArrowLeft from '../../assets/icons/ic_arrow_left.svg'
import { MUSIC_VIDEOS } from '../../data/musicVideos'
import type { MvRatio } from '../../data/musicVideos'
import './MVDetailPage.css'

// Figma "New MVs — See All — Community_L_Portrait/Landscape" (nodes
// 1459:10288 / 1459:11202). Real cover+video pairs (and the mock
// username/likes/badge/ratio alongside them) live in src/data/musicVideos.ts
// — Home's New Music Videos section reads the exact same catalog, so the
// same id always shows the same cover/video on both pages.
const MV_CATALOG = MUSIC_VIDEOS

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function VideoPlayer({ item, backHref }: { item: (typeof MV_CATALOG)[number]; backHref: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)

  const isPortrait = item.ratio === '3:4'
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(true)
  const [liked, setLiked] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [shareOpen, setShareOpen] = useState(false)

  function handleLoadedMetadata() {
    const video = videoRef.current
    if (!video) return
    setDuration(video.duration)
  }

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play()
      setPlaying(true)
    } else {
      video.pause()
      setPlaying(false)
    }
  }

  function toggleMute() {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      playerRef.current?.requestFullscreen()
    }
  }

  function seekFromClientX(clientX: number) {
    const track = progressRef.current
    const video = videoRef.current
    if (!track || !video || !video.duration) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    video.currentTime = ratio * video.duration
    setCurrentTime(video.currentTime)
  }

  function handleProgressPointerDown(event: ReactPointerEvent) {
    seekFromClientX(event.clientX)
    function handleMove(moveEvent: PointerEvent) {
      seekFromClientX(moveEvent.clientX)
    }
    function handleUp() {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
  }

  const progressRatio = duration ? currentTime / duration : 0

  return (
    <div className={`mv-player${isPortrait ? ' mv-player--portrait' : ''}`} ref={playerRef}>
      <div className="mv-player__mobile-header">
        <a href={backHref} className="mv-player__mobile-back" aria-label="Back to Trending MVs">
          <span className="mv-player__mobile-back-icon" style={maskStyle(icArrowLeft)} aria-hidden="true" />
        </a>
        <div className="mv-player__mobile-heading">
          <p>{item.title}</p>
          <span>{item.ratio === '3:4' ? 'Singing | 1-2 min' : 'Storytelling | 2-3 min'}</span>
        </div>
        <span className="mv-player__mobile-header-spacer" aria-hidden="true" />
      </div>
      {isPortrait && (
        <video className="mv-player__backdrop" src={item.video} muted loop autoPlay playsInline aria-hidden="true" />
      )}
      <div className="mv-player__backdrop-scrim" aria-hidden="true" />

      <div className={`mv-player__stage${isPortrait ? ' mv-player__stage--portrait' : ''}`}>
        <video
          key={item.video}
          ref={videoRef}
          className="mv-player__video"
          src={item.video}
          autoPlay
          loop
          muted={muted}
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onClick={togglePlay}
        />
      </div>

      <div className="mv-player__floating">
        <div className="mv-player__meta-row">
          <div className="mv-player__meta">
            <p className="mv-player__title">{item.title}</p>
            <button
              type="button"
              className="mv-player__user"
              onClick={() => (window.location.href = communityProfileHref(item.username))}
            >
              <span className="mv-player__avatar">
                <span className="mv-player__avatar-icon" style={maskStyle(icAccount)} aria-hidden="true" />
              </span>
              <span className="mv-player__username">{item.username}</span>
            </button>
          </div>

          <div className="mv-player__actions">
            <button
              type="button"
              className="mv-player__mobile-profile"
              onClick={() => (window.location.href = communityProfileHref(item.username))}
              aria-label={`View ${item.username}'s profile`}
            >
              <span className="mv-player__avatar-icon" style={maskStyle(icAccount)} aria-hidden="true" />
            </button>
            <div className="mv-player__like-share">
              <IconButton
                size="Medium"
                variant="Ghost"
                icon={liked ? icFavoriteOn : icFavoriteOff}
                label={liked ? 'Unlike' : 'Like'}
                onClick={() => setLiked((current) => !current)}
                className={`mv-player__action-icon${liked ? ' mv-player__action-icon--active' : ''}`}
              />
              <IconButton
                size="Medium"
                variant="Ghost"
                icon={icShare}
                label="Share"
                onClick={() => shareOrOpenDialog(item.title, () => setShareOpen(true))}
                className="mv-player__action-icon"
              />
            </div>
            <Button
              size="Medium"
              variant="Primary"
              trailingIcon={icArrowRight}
              className="mv-player__cta"
              onClick={() => { window.location.href = '/mv-create' }}
            >
              <span className="mv-player__cta-desktop">Create MV</span>
              <span className="mv-player__cta-mobile">Create Music Video</span>
            </Button>
          </div>
        </div>

        <div className="mv-player__controls">
          <button
            type="button"
            className="mv-player__control-btn"
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            <span className="mv-player__control-icon" style={maskStyle(playing ? icPause : icPlay)} aria-hidden="true" />
          </button>

          <span className="mv-player__time">{formatTime(currentTime)}</span>

          <div className="mv-player__progress" ref={progressRef} onPointerDown={handleProgressPointerDown}>
            <div className="mv-player__progress-track" />
            <div className="mv-player__progress-fill" style={{ width: `${progressRatio * 100}%` }} />
            <div className="mv-player__progress-thumb" style={{ left: `${progressRatio * 100}%` }} />
          </div>

          <span className="mv-player__time">{formatTime(duration)}</span>

          <button
            type="button"
            className="mv-player__control-btn"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            <span
              className="mv-player__control-icon"
              style={maskStyle(muted ? icSpeakerOff : icSpeakerOn)}
              aria-hidden="true"
            />
          </button>

          <button type="button" className="mv-player__control-btn mv-player__fullscreen" onClick={toggleFullscreen} aria-label="Fullscreen">
            <span className="mv-player__control-icon" style={maskStyle(icExpand)} aria-hidden="true" />
          </button>
        </div>
      </div>

      <ShareDialog title={item.title} isOpen={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  )
}

// Justified-row grid (desktop only — see MvGrid) — each row is filled edge
// to edge before wrapping, instead of flex-wrap's default behavior of
// leaving whatever remainder in each row (visible as a ragged gap on the
// second row before this fix). Cover height is shared per row and picked
// within [MIN_ROW_HEIGHT, MAX_ROW_HEIGHT], so a row mixing 3:4/4:3 items
// still lines up, and item width = that shared height * the item's own
// aspect ratio (aiming for MAX_ROW_HEIGHT, only shrinking as far as needed
// to make the row's items exactly fill the container width).
const GRID_GAP = 20
const MIN_ROW_HEIGHT = 240
const MAX_ROW_HEIGHT = 280
const DESKTOP_QUERY = '(min-width: 1024px)'

function aspectRatioOf(ratio: MvRatio): number {
  return ratio === '4:3' ? 4 / 3 : 3 / 4
}

interface JustifiedRow {
  items: MusicVideoWithMeta[]
  coverHeight: number
}

type MusicVideoWithMeta = (typeof MV_CATALOG)[number]

function computeJustifiedRows(items: readonly MusicVideoWithMeta[], containerWidth: number): JustifiedRow[] {
  if (containerWidth <= 0) return [{ items: [...items], coverHeight: MAX_ROW_HEIGHT }]

  const rows: JustifiedRow[] = []
  let i = 0

  while (i < items.length) {
    let aspectSum = 0
    let count = 0
    let height = MAX_ROW_HEIGHT
    let ranOutOfItems = true

    while (i + count < items.length) {
      const aspect = aspectRatioOf(items[i + count].ratio)
      const newAspectSum = aspectSum + aspect
      const newCount = count + 1
      const availableWidth = containerWidth - GRID_GAP * (newCount - 1)
      const heightIfIncluded = availableWidth / newAspectSum

      if (count === 0 || heightIfIncluded >= MIN_ROW_HEIGHT) {
        aspectSum = newAspectSum
        count = newCount
        height = heightIfIncluded
        continue
      }

      // Adding the next item would shrink the row below the floor. Pick
      // whichever of "stop here" (row ends up taller than MAX) or "include
      // it anyway" (row ends up shorter than MIN) lands closer to the
      // target range — either way the row still fills the container
      // exactly, since neither branch clamps.
      const overshootIfStop = Math.max(0, height - MAX_ROW_HEIGHT)
      const undershootIfInclude = MIN_ROW_HEIGHT - heightIfIncluded
      if (undershootIfInclude < overshootIfStop) {
        aspectSum = newAspectSum
        count = newCount
        height = heightIfIncluded
      }
      ranOutOfItems = false
      break
    }

    // Only the trailing row (stopped because there simply weren't enough
    // items left, not because of a deliberate fit decision) is allowed to
    // not fully justify — clamp its height instead of stretching content
    // that isn't there to fill the row.
    if (ranOutOfItems) {
      height = Math.min(MAX_ROW_HEIGHT, Math.max(MIN_ROW_HEIGHT, height))
    }

    rows.push({ items: items.slice(i, i + count), coverHeight: height })
    i += count
  }

  return rows
}

// Reused by both sections below — same catalog, just a different order per
// section (see NEWLY_RELEASED) so the page doesn't read as two copies of one
// grid when there's no separate content to fill it with.
function MvGrid({ items, source }: { items: readonly MusicVideoWithMeta[]; source: 'home' | 'mv-create' | 'history' | 'community-profile' }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(DESKTOP_QUERY).matches : false,
  )
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_QUERY)
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => setContainerWidth(entries[0].contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Below Laptop width, the justified-row math (built around the 1440
  // desktop frame Figma provides) doesn't have room to work with — fall
  // back to the simpler fixed-width wrapping grid instead.
  if (isMobile) {
    // A plain index % 2 split looks even by count, but MUSIC_VIDEOS alternates
    // ratio by index too (RATIOS[index % 2] in musicVideos.ts) — so it landed
    // every 3:4 (taller) item in one column and every 4:3 (shorter) item in
    // the other, making one column run far longer than the other. Greedily
    // adding each item to whichever column's estimated height (both columns
    // share the same width, so 1/aspectRatio is a valid proportional height)
    // is currently smaller keeps the two columns balanced regardless of the
    // source ratio pattern.
    const columns: MusicVideoWithMeta[][] = [[], []]
    const columnHeights = [0, 0]
    items.forEach((mv) => {
      const shorter = columnHeights[0] <= columnHeights[1] ? 0 : 1
      columns[shorter].push(mv)
      columnHeights[shorter] += 1 / aspectRatioOf(mv.ratio)
    })
    return (
      <div className="mv-detail__mobile-grid" ref={containerRef}>
        {columns.map((column, columnIndex) => (
          <div className="mv-detail__mobile-column" key={columnIndex}>
            {column.map((mv) => (
              <a key={mv.id} href={`/mv-detail?id=${mv.id}&from=${source}&view=all`} className="mv-detail__grid-item">
                <Card
                  type="Video"
                  ratio={mv.ratio}
                  community
                  title={mv.title}
                  username={mv.username}
                  likes={mv.likes}
                  coverImage={mv.cover}
                />
              </a>
            ))}
          </div>
        ))}
      </div>
    )
  }

  if (!isDesktop) {
    return (
      <div className="mv-detail__grid mv-detail__grid--wrap" ref={containerRef}>
        {items.map((mv) => (
          <a
            key={mv.id}
            href={`/mv-detail?id=${mv.id}&from=${source}&view=all`}
            className={`mv-detail__grid-item mv-detail__grid-item--${mv.ratio.replace(':', '-')}`}
          >
            <Card
              type="Video"
              ratio={mv.ratio}
              community
              title={mv.title}
              username={mv.username}
              likes={mv.likes}
              badge={mv.badge}
              coverImage={mv.cover}
            />
          </a>
        ))}
      </div>
    )
  }

  const rows = computeJustifiedRows(items, containerWidth)

  return (
    <div className="mv-detail__grid" ref={containerRef}>
      {rows.map((row, rowIndex) => (
        <div className="mv-detail__grid-row" key={rowIndex}>
          {row.items.map((mv) => (
            <a
              key={mv.id}
              href={`/mv-detail?id=${mv.id}&from=${source}&view=all`}
              className="mv-detail__grid-item"
              style={{ width: row.coverHeight * aspectRatioOf(mv.ratio) }}
            >
              <Card
                type="Video"
                ratio={mv.ratio}
                community
                title={mv.title}
                username={mv.username}
                likes={mv.likes}
                badge={mv.badge}
                coverImage={mv.cover}
              />
            </a>
          ))}
        </div>
      ))}
    </div>
  )
}

// Not a second real category — just MV_CATALOG reordered (reversed) so its
// badges/covers land in different grid positions than Top Picks above it.
const NEWLY_RELEASED = [...MV_CATALOG].reverse()

function MVDetailPage() {
  const params = new URLSearchParams(window.location.search)
  const selected = MV_CATALOG.find((mv) => mv.id === params.get('id'))
  const fromAll = params.get('view') === 'all'
  const requestedSource = params.get('from')
  const source =
    requestedSource === 'mv-create' || requestedSource === 'history' || requestedSource === 'community-profile'
      ? requestedSource
      : 'home'
  const backHref =
    source === 'mv-create'
      ? '/mv-create'
      : source === 'history'
        ? '/history'
        : source === 'community-profile'
          ? '/community-profile?tab=music-videos'
          : '/home'

  return (
    <AppLayout navbar={<DetailNavbar credits={390} backHref={backHref} hideMobileBar />} showMobileHeader={false}>
      <div className={`mv-detail${selected ? ' mv-detail--selected' : ''}`}>
        {!selected && (
          <header className="mv-detail__mobile-header">
            <a href={backHref} className="mv-detail__mobile-back" aria-label="Back">
              <span style={maskStyle(icArrowLeft)} aria-hidden="true" />
            </a>
            <h1>Trending MVs</h1>
            <span className="mv-detail__mobile-header-spacer" aria-hidden="true" />
          </header>
        )}
        {selected && <VideoPlayer item={selected} backHref={fromAll ? `/mv-detail?from=${source}` : backHref} />}

        {/* This page is already the "See all" destination, so neither
            section links anywhere further. */}
        <section className="mv-detail__grid-section mv-detail__grid-section--primary">
          <SectionHeader title="Trending Music Videos" showSeeAll={false} />
          <MvGrid items={MV_CATALOG} source={source} />
        </section>

        <section className="mv-detail__grid-section">
          <SectionHeader title="Newly Released Music Video" showSeeAll={false} />
          <MvGrid items={NEWLY_RELEASED} source={source} />
        </section>
      </div>
    </AppLayout>
  )
}

export default MVDetailPage
