import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { createPortal } from 'react-dom'
import AppLayout from '../../layouts/AppLayout/AppLayout'
import DetailNavbar from '../../components/DetailNavbar/DetailNavbar'
import Tabs from '../../components/Tabs/Tabs'
import TopSongListItem from '../../components/TopSongListItem/TopSongListItem'
import ShareDialog, { shareOrOpenDialog } from '../../components/ShareDialog/ShareDialog'
import LyricsSheet from '../../components/LyricsSheet/LyricsSheet'
import SongPlayBar from '../../components/SongPlayBar/SongPlayBar'
import { useSongPlayer } from '../../hooks/useSongPlayer'
import { SONGS } from '../../data/songs'
import { communityProfileHref } from '../../data/profile'
import icAccount from '../../assets/icons/ic_account.svg'
import icFavoriteOff from '../../assets/icons/ic_favorite_off.svg'
import icFavoriteOn from '../../assets/icons/ic_favorite_on.svg'
import icShare from '../../assets/icons/ic_share.svg'
import icSingingMic from '../../assets/icons/ic_singing_mic.svg'
import icSkipBack from '../../assets/icons/ic_skip_back.svg'
import icSkipForward from '../../assets/icons/ic_skip_forward.svg'
import icPlay from '../../assets/icons/ic_play.svg'
import icPause from '../../assets/icons/ic_pause.svg'
import icArrowRight from '../../assets/icons/ic_arrow_right.svg'
import icArrowLeft from '../../assets/icons/ic_arrow_left.svg'
import './SongDetailPage.css'

// Figma "Top Picks Songs — See All — Community_L" (nodes 1409:34847 at
// 1440, 1549:27425 at 1920). Real songs/covers now live in
// src/data/songs.ts — no fake mock data or fabricated creator names here.

const TABS = ['All', 'Top Picks', 'Trending', 'New Releases']

// No real per-tab data exists to actually filter by (Top Picks/Trending/New
// Releases aren't distinguished in the song data), so each tab just reorders
// the same catalog differently — enough to make switching tabs visibly do
// something, without fabricating category data that doesn't exist.
function sortForTab(tab: string): typeof SONGS {
  if (tab === 'Top Picks') return [...SONGS].reverse()
  if (tab === 'Trending') return [...SONGS].sort((a, b) => a.title.localeCompare(b.title))
  if (tab === 'New Releases') return [...SONGS].sort((a, b) => b.title.localeCompare(a.title))
  return SONGS
}

// Not official lyrics — each song's own generated lyrics from its
// title.json (see src/data/songs.ts), one per song rather than one shared
// placeholder string.
const FALLBACK_LYRICS = ['♪ No lyrics available for this one yet ♪']

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Figma "Song Player — Community" (node 120:1023, mobile-only) — below the
// app-mobile breakpoint, tapping a song in the list takes over the whole
// screen with this dedicated player. Desktop no longer has an inline Now
// Playing panel of its own — clicking a row there navigates straight to
// SongCreatePage's result-stage player instead (see selectSong below).
// Only one Figma frame was given for this mobile player, sized around a
// 320–375 phone — the upper end of this app's mobile range (up to 767px)
// scales the same layout proportionally rather than guessing a second
// breakpoint.
function MobileNowPlaying({
  song,
  onPrev,
  onNext,
  playing,
  currentTime,
  duration,
  audioRef,
  isOpen,
  onClose,
}: {
  song: (typeof SONGS)[number]
  onPrev: () => void
  onNext: () => void
  playing: boolean
  currentTime: number
  duration: number
  audioRef: RefObject<HTMLAudioElement | null>
  isOpen: boolean
  onClose: () => void
}) {
  const progressRef = useRef<HTMLDivElement>(null)
  const [liked, setLiked] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [showLyrics, setShowLyrics] = useState(false)

  const lyricLines = song.lyricLines.length ? song.lyricLines : FALLBACK_LYRICS

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      audio.play()
    } else {
      audio.pause()
    }
  }

  function seekFromClientX(clientX: number) {
    const track = progressRef.current
    const audio = audioRef.current
    if (!track || !audio || !audio.duration) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    audio.currentTime = ratio * audio.duration
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

  // Portalled to <body> — position:fixed here would otherwise be trapped
  // inside .app-layout__content's own stacking context (it sets z-index:1
  // on itself), so no z-index on this element could ever paint over
  // MobileHeader/MobileTabBar (z-index:20, siblings of .app-layout__content
  // rather than descendants). Same escape-hatch already used by
  // LoginModal/ShareDialog/LyricsSheet.
  return createPortal(
    <div className={`song-detail-mobile-player${isOpen ? ' song-detail-mobile-player--open' : ''}`}>
      <img src={song.cover} alt="" className="song-detail-mobile-player__bg" aria-hidden="true" />
      <div className="song-detail-mobile-player__scrim" aria-hidden="true" />

      <div className="song-detail-mobile-player__header">
        <button type="button" className="song-detail-mobile-player__back" onClick={onClose} aria-label="Back">
          <span className="song-detail-mobile-player__back-icon" style={maskStyle(icArrowLeft)} aria-hidden="true" />
        </button>
        <p className="song-detail-mobile-player__header-title">Now Playing</p>
        <span className="song-detail-mobile-player__header-spacer" aria-hidden="true" />
      </div>

      <div className="song-detail-mobile-player__art-wrap">
        <img
          src={song.cover}
          alt=""
          className={`song-detail-mobile-player__art${playing ? ' song-detail-mobile-player__art--spinning' : ''}`}
        />
      </div>

      <div className="song-detail-mobile-player__bottom">
        <div className="song-detail-mobile-player__meta-row">
          <div className="song-detail-mobile-player__meta">
            <p className="song-detail-mobile-player__title">{song.title}</p>
            {/* Same community-song convention as NowPlaying above — always
                that song's own creator, never the signed-in user. */}
            <button
              type="button"
              className="song-detail-mobile-player__user"
              onClick={() => (window.location.href = communityProfileHref(song.username))}
            >
              <span className="song-detail-mobile-player__avatar">
                <span className="song-detail-mobile-player__avatar-icon" style={maskStyle(icAccount)} aria-hidden="true" />
              </span>
              <span className="song-detail-mobile-player__username">{song.username}</span>
            </button>
          </div>

          <div className="song-detail-mobile-player__actions">
            <button
              type="button"
              className={`song-detail-mobile-player__icon-btn${liked ? ' song-detail-mobile-player__icon-btn--active' : ''}`}
              onClick={() => setLiked((current) => !current)}
              aria-label={liked ? 'Unlike' : 'Like'}
            >
              <span
                className="song-detail-mobile-player__icon"
                style={maskStyle(liked ? icFavoriteOn : icFavoriteOff)}
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              className="song-detail-mobile-player__icon-btn"
              onClick={() => shareOrOpenDialog(song.title, () => setShareOpen(true))}
              aria-label="Share"
            >
              <span className="song-detail-mobile-player__icon" style={maskStyle(icShare)} aria-hidden="true" />
            </button>
            <ShareDialog title={song.title} isOpen={shareOpen} onClose={() => setShareOpen(false)} />
            <button
              type="button"
              className="song-detail-mobile-player__icon-btn"
              onClick={() => setShowLyrics(true)}
              aria-label="Show lyrics"
            >
              <span className="song-detail-mobile-player__icon" style={maskStyle(icSingingMic)} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          className="song-detail-mobile-player__progress"
          ref={progressRef}
          onPointerDown={handleProgressPointerDown}
        >
          <div className="song-detail-mobile-player__progress-track" />
          <div className="song-detail-mobile-player__progress-fill" style={{ width: `${progressRatio * 100}%` }} />
          <div className="song-detail-mobile-player__progress-thumb" style={{ left: `${progressRatio * 100}%` }} />
        </div>
        <div className="song-detail-mobile-player__time">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="song-detail-mobile-player__transport">
          <button
            type="button"
            className="song-detail-mobile-player__transport-btn"
            onClick={onPrev}
            aria-label="Previous"
          >
            <span className="song-detail-mobile-player__transport-icon" style={maskStyle(icSkipBack)} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="song-detail-mobile-player__play"
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            <span className="song-detail-mobile-player__play-icon" style={maskStyle(playing ? icPause : icPlay)} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="song-detail-mobile-player__transport-btn"
            onClick={onNext}
            aria-label="Next"
          >
            <span className="song-detail-mobile-player__transport-icon" style={maskStyle(icSkipForward)} aria-hidden="true" />
          </button>
        </div>

        <button type="button" className="song-detail-mobile-player__cta">
          Create AI Song
          <span className="song-detail-mobile-player__cta-icon" style={maskStyle(icArrowRight)} aria-hidden="true" />
        </button>
      </div>

      <LyricsSheet
        isOpen={showLyrics}
        title={song.title}
        cover={song.cover}
        lyricLines={lyricLines}
        currentTime={currentTime}
        duration={duration}
        playing={playing}
        onTogglePlay={togglePlay}
        onClose={() => setShowLyrics(false)}
      />
    </div>,
    document.body,
  )
}

function SongDetailPage() {
  const params = new URLSearchParams(window.location.search)
  const requestedId = params.get('id')
  const initialId = SONGS.some((song) => song.id === requestedId) ? requestedId! : SONGS[0].id
  const requestedTab = params.get('tab')
  const initialTab = TABS.includes(requestedTab ?? '') ? requestedTab! : TABS[0]
  const requestedSource = params.get('from')
  const source =
    requestedSource === 'song-create' || requestedSource === 'history' || requestedSource === 'community-profile'
      ? requestedSource
      : 'home'
  const backHref =
    source === 'song-create'
      ? '/song-create'
      : source === 'history'
        ? '/history'
        : source === 'community-profile'
          ? '/community-profile?tab=songs'
          : '/home'

  const [activeTab, setActiveTab] = useState(initialTab)
  // Mobile-only (<768px) — an explicit ?id= deep link opens straight into
  // the full-screen player (see MobileNowPlaying); otherwise mobile starts
  // on the list, same as desktop always shows both.
  const [mobilePlayerOpen, setMobilePlayerOpen] = useState(() => Boolean(requestedId))

  const displayedSongs = useMemo(() => sortForTab(activeTab), [activeTab])
  // Only seed the shared player with the deep-linked song when mobile is
  // about to show the full-screen player for it — `mobilePlayerOpen` above
  // starts true from a deep link on ANY device (it just has no visible
  // effect on desktop, since MobileNowPlaying only renders below 768px),
  // so it alone isn't a safe gate here: desktop's narrow bottom bar (see
  // SongPlayBar) needs its own real device check, or a plain ?id= link
  // from Home would pop the bar open on desktop too.
  const player = useSongPlayer(
    displayedSongs,
    requestedId && window.matchMedia('(max-width: 767px)').matches ? initialId : undefined,
  )
  // MobileNowPlaying stays permanently mounted (toggled by CSS, not
  // conditional JSX, so it can transition in/out) and needs a real song
  // even before one's been picked — falls back to the first song in the
  // list purely for that display purpose; doesn't touch the player itself.
  const activeSong = player.activeSong ?? displayedSongs[0]

  // The mobile player is reached by pushing a history entry (see
  // selectSong below) so the phone's native back gesture/button returns to
  // the list instead of leaving the page entirely — same convention as
  // CommunityProfilePage's tab-switch history.replaceState.
  useEffect(() => {
    function handlePopState() {
      setMobilePlayerOpen(false)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Mobile keeps taking over the screen in place (see MobileNowPlaying).
  // Desktop no longer has its own Now Playing column — clicking a row
  // navigates straight to SongCreatePage's result-stage player instead,
  // the same template/route History-origin results already reuse.
  function selectSong(songId: string) {
    if (!window.matchMedia('(max-width: 767px)').matches) {
      window.location.href = `/song-create?stage=result&id=${songId}&from=song-detail`
      return
    }
    player.play(songId)
    if (window.matchMedia('(max-width: 767px)').matches) {
      setMobilePlayerOpen(true)
      const query = source === 'home' ? `id=${songId}` : `id=${songId}&from=${source}`
      window.history.pushState({ songDetailPlayer: true }, '', `/song-detail?${query}`)
    }
  }

  function closeMobilePlayer() {
    window.history.back()
  }

  // Album-art play icon (as opposed to the title, which still navigates via
  // selectSong) — mobile keeps its existing full-screen takeover; desktop
  // starts/toggles the narrow bottom playbar in place instead.
  function handleRowPlay(songId: string) {
    if (window.matchMedia('(max-width: 767px)').matches) {
      selectSong(songId)
      return
    }
    player.play(songId)
  }

  return (
    <AppLayout
      navbar={
        <DetailNavbar
          credits={390}
          backHref={backHref}
          mobileTitle="Top Picks Songs"
          tabsSlot={<Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />}
        />
      }
      showMobileHeader={false}
    >
      <audio {...player.audioProps} />

      <div
        className={`song-detail${mobilePlayerOpen ? ' song-detail--mobile-player-open' : ''}`}
        // Keeps the last row(s) from sitting behind the fixed bottom
        // playbar once it's open — the bar's own height plus a little
        // breathing room, not just its bare content height.
        style={player.isOpen ? { paddingBottom: 96 } : undefined}
      >
        <div className="song-detail__list">
          {displayedSongs.map((song) => (
            <TopSongListItem
              key={song.id}
              title={song.title}
              username={song.username}
              plays={0}
              likes={0}
              shares={0}
              coverImage={song.cover}
              isPlaying={song.id === player.activeSong?.id && player.playing}
              onSelect={() => selectSong(song.id)}
              onPlay={() => handleRowPlay(song.id)}
            />
          ))}
        </div>
      </div>

      {player.isOpen && <SongPlayBar player={player} />}

      <MobileNowPlaying
        song={activeSong}
        onPrev={player.goPrev}
        onNext={player.goNext}
        playing={player.playing}
        currentTime={player.currentTime}
        duration={player.duration}
        audioRef={player.audioRef}
        isOpen={mobilePlayerOpen}
        onClose={closeMobilePlayer}
      />
    </AppLayout>
  )
}

export default SongDetailPage
