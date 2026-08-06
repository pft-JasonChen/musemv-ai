import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useMountTransition } from '../../hooks/useMountTransition'
import icClose from '../../assets/icons/ic_close.svg'
import icPlay from '../../assets/icons/ic_play.svg'
import icPause from '../../assets/icons/ic_pause.svg'
import './LyricsSheet.css'

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

interface LyricsSheetProps {
  isOpen: boolean
  title: string
  cover: string
  lyricLines: string[]
  currentTime: number
  duration: number
  playing: boolean
  onTogglePlay: () => void
  onClose: () => void
}

// Figma "Song Result — Lyrics" (node 881:19546, mobile bottom sheet) — no
// separate desktop frame was given, so this reuses this app's existing
// pattern (LoginModal/ShareDialog) of the same sheet becoming a centered
// dialog above the mobile breakpoint instead of guessing a new desktop
// layout. Shared by every "show lyrics" entry point (Song Create Result,
// Song Detail's mobile Now Playing) since they all follow this exact
// design — synced-line highlighting matches SongDetailPage's Now Playing.
function LyricsSheet({ isOpen, title, cover, lyricLines, currentTime, duration, playing, onTogglePlay, onClose }: LyricsSheetProps) {
  const activeLineRef = useRef<HTMLParagraphElement>(null)
  const activeLineIndex = Math.min(
    lyricLines.length - 1,
    Math.floor((duration ? currentTime / duration : 0) * lyricLines.length),
  )
  const { shouldRender, visible } = useMountTransition(isOpen)

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [activeLineIndex])

  if (!shouldRender) return null

  return createPortal(
    <div className={`lyrics-sheet-overlay${visible ? ' lyrics-sheet-overlay--visible' : ''}`}>
      <div className="lyrics-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="lyrics-sheet" role="dialog" aria-label="Lyrics">
        <div className="lyrics-sheet__handle" aria-hidden="true" />

        <div className="lyrics-sheet__header">
          <button type="button" className="lyrics-sheet__close" onClick={onClose} aria-label="Close">
            <img src={icClose} alt="" className="lyrics-sheet__close-icon" />
          </button>
          <p className="lyrics-sheet__title">Lyrics</p>
          <div className="lyrics-sheet__header-spacer" aria-hidden="true" />
        </div>

        <div className="lyrics-sheet__song-row">
          <img src={cover} alt="" className="lyrics-sheet__song-art" />
          <div className="lyrics-sheet__song-info">
            <p className="lyrics-sheet__song-title">{title}</p>
            <p className="lyrics-sheet__song-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
          <button
            type="button"
            className="lyrics-sheet__play"
            onClick={onTogglePlay}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            <span className="lyrics-sheet__play-icon" style={maskStyle(playing ? icPause : icPlay)} aria-hidden="true" />
          </button>
        </div>

        <div className="lyrics-sheet__divider" />

        <div className="lyrics-sheet__lines">
          {lyricLines.map((line, index) => (
            <p
              key={index}
              ref={index === activeLineIndex ? activeLineRef : undefined}
              className={`lyrics-sheet__line${index === activeLineIndex ? ' lyrics-sheet__line--active' : ''}`}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default LyricsSheet
