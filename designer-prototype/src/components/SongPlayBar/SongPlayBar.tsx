import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import ShareDialog, { shareOrOpenDialog } from '../ShareDialog/ShareDialog'
import type { SongPlayer } from '../../hooks/useSongPlayer'
import icSkipBack from '../../assets/icons/ic_skip_back.svg'
import icSkipForward from '../../assets/icons/ic_skip_forward.svg'
import icPlay from '../../assets/icons/ic_play.svg'
import icPause from '../../assets/icons/ic_pause.svg'
import icShare from '../../assets/icons/ic_share.svg'
import icSpeakerOn from '../../assets/icons/ic_speaker_on.svg'
import icSpeakerOff from '../../assets/icons/ic_speaker_off.svg'
import icClose from '../../assets/icons/ic_close.svg'
import './SongPlayBar.css'

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Desktop-only narrow bottom playbar — starts from a row's album-art play
// icon rather than navigating away, so browsing can continue while a
// preview keeps playing. No Figma reference for this specific bar; laid
// out to match the existing MobileNowPlaying transport row conventions.
// Any page using useSongPlayer can drop this in — originally built inline
// in SongDetailPage, extracted so Home's Newly Released Songs can reuse it.
function SongPlayBar({ player }: { player: SongPlayer }) {
  const progressRef = useRef<HTMLDivElement>(null)
  const [shareOpen, setShareOpen] = useState(false)
  // Must stay fixed to the viewport while scrolling (a transformed ancestor
  // would turn position:fixed into scrolling-away instead) — that's why
  // this measures Sidebar's real rendered width via ResizeObserver and
  // offsets `left` by it, rather than constraining the bar inside
  // .app-layout__main via a containing-block trick). Sidebar's width is a
  // runtime toggle (collapsed/expanded), not a fixed breakpoint value, so
  // it can't just be hardcoded in CSS either.
  const [sidebarWidth, setSidebarWidth] = useState(0)

  useEffect(() => {
    const sidebar = document.querySelector('.sidebar')
    if (!sidebar) return
    // contentRect excludes padding/border — Sidebar has both, so this reads
    // the actual rendered (border-box) width directly off the element
    // instead, matching what a `left` offset needs.
    const observer = new ResizeObserver((entries) => setSidebarWidth(entries[0].target.getBoundingClientRect().width))
    observer.observe(sidebar)
    return () => observer.disconnect()
  }, [])

  const { activeSong, playing, currentTime, duration, muted, volume } = player

  if (!activeSong) return null

  function seekFromClientX(clientX: number) {
    const track = progressRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    player.seek(ratio)
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
    <div className="song-bar" style={{ left: sidebarWidth }}>
      <img src={activeSong.cover} alt="" className="song-bar__cover" />
      <div className="song-bar__meta">
        <p className="song-bar__title">{activeSong.title}</p>
        <p className="song-bar__username">{activeSong.username}</p>
      </div>

      <div className="song-bar__transport">
        <button type="button" className="song-bar__transport-btn" onClick={player.goPrev} aria-label="Previous">
          <span className="song-bar__transport-icon" style={maskStyle(icSkipBack)} aria-hidden="true" />
        </button>
        <button type="button" className="song-bar__play" onClick={player.togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
          <span className="song-bar__play-icon" style={maskStyle(playing ? icPause : icPlay)} aria-hidden="true" />
        </button>
        <button type="button" className="song-bar__transport-btn" onClick={player.goNext} aria-label="Next">
          <span className="song-bar__transport-icon" style={maskStyle(icSkipForward)} aria-hidden="true" />
        </button>
      </div>

      <span className="song-bar__time">{formatTime(currentTime)}</span>
      <div className="song-bar__progress" ref={progressRef} onPointerDown={handleProgressPointerDown}>
        <div className="song-bar__progress-track" />
        <div className="song-bar__progress-fill" style={{ width: `${progressRatio * 100}%` }} />
        <div className="song-bar__progress-thumb" style={{ left: `${progressRatio * 100}%` }} />
      </div>
      <span className="song-bar__time">{formatTime(duration)}</span>

      <button
        type="button"
        className="song-bar__icon-btn"
        onClick={() => shareOrOpenDialog(activeSong.title, () => setShareOpen(true))}
        aria-label="Share"
      >
        <span className="song-bar__icon" style={maskStyle(icShare)} aria-hidden="true" />
      </button>
      <div className="song-bar__volume">
        <div className="song-bar__volume-slider">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={muted ? 0 : volume}
            onChange={(event) => player.setVolume(Number(event.target.value))}
            aria-label="Volume"
          />
        </div>
        <button type="button" className="song-bar__icon-btn" onClick={player.toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
          <span
            className="song-bar__icon"
            style={maskStyle(muted || volume === 0 ? icSpeakerOff : icSpeakerOn)}
            aria-hidden="true"
          />
        </button>
      </div>
      <button type="button" className="song-bar__icon-btn" onClick={player.close} aria-label="Close">
        <span className="song-bar__icon" style={maskStyle(icClose)} aria-hidden="true" />
      </button>

      <ShareDialog title={activeSong.title} isOpen={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  )
}

export default SongPlayBar
