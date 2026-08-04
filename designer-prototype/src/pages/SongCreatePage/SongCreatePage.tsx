import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import AppLayout from '../../layouts/AppLayout/AppLayout'
import RoomNavbar from '../../components/RoomNavbar/RoomNavbar'
import DetailNavbar from '../../components/DetailNavbar/DetailNavbar'
import FloatingCTA from '../../components/FloatingCTA/FloatingCTA'
import { useAuth } from '../../components/AuthProvider/AuthProvider'
import Tabs from '../../components/Tabs/Tabs'
import Chip from '../../components/Chip/Chip'
import ToggleSwitch from '../../components/ToggleSwitch/ToggleSwitch'
import ListItem from '../../components/ListItem/ListItem'
import ShareDialog, { shareOrOpenDialog } from '../../components/ShareDialog/ShareDialog'
import LyricsSheet from '../../components/LyricsSheet/LyricsSheet'
import Toast from '../../components/Toast/Toast'
import { SONGS } from '../../data/songs'
import icLightbulb from '../../assets/icons/ic_lightbulb.svg'
import icSingingMic from '../../assets/icons/ic_singing_mic.svg'
import icInfo from '../../assets/icons/ic_info.svg'
import icCredit from '../../assets/icons/ic_credit.svg'
import icEditAi from '../../assets/icons/ic_edit_ai.svg'
import icRefresh from '../../assets/icons/ic_refresh.svg'
import icClose from '../../assets/icons/ic_close.svg'
import { useEnhance } from '../../hooks/useEnhance'
import icFavoriteOff from '../../assets/icons/ic_favorite_off.svg'
import icFavoriteOn from '../../assets/icons/ic_favorite_on.svg'
import icShare from '../../assets/icons/ic_share.svg'
import icPlay from '../../assets/icons/ic_play.svg'
import icPause from '../../assets/icons/ic_pause.svg'
import icSkipBack from '../../assets/icons/ic_skip_back.svg'
import icSkipForward from '../../assets/icons/ic_skip_forward.svg'
import icArrowRight from '../../assets/icons/ic_arrow_right.svg'
import icChevronRight from '../../assets/icons/ic_chevron-right.svg'
import icDownload from '../../assets/icons/ic_download.svg'
import icSpeakerOn from '../../assets/icons/ic_speaker_on.svg'
import icSpeakerOff from '../../assets/icons/ic_speaker_off.svg'
import icPublish from '../../assets/icons/ic_publish.svg'
import './SongCreatePage.css'

// Figma "AI Song — Feature Room" (Simple/Custom states, nodes 1351:28869,
// 1357:30377, 1367:31860, 1367:33182). Flow reference (tab switching,
// Instrumental behavior, mock idea/lyrics generation, loading/result screens)
// is scottwu630/ycmuse-prototype's muse-prototype-v1.html — no real AI/API
// call, per project scope.

type SongMode = 'Simple' | 'Custom'

const GENRES = ['Pop', 'R&B', 'Electronic', 'Hip-Hop', 'Acoustic', 'Jazz', 'Classical', 'Lo-fi']
const MOODS = ['Uplifting', 'Melancholic', 'Romantic', 'Energetic', 'Calm', 'Dark']
const VOCALS = ['Male', 'Female']
const SHOW_SONG_LENGTH = false

// Canned mock text for the "Idea"/"Lyrics" generate buttons — no real AI call.
const IDEA_SUGGESTIONS = [
  'A bittersweet love song about leaving a city you called home, with a melancholic yet hopeful vibe...',
  'An upbeat anthem about chasing your dreams against all odds, with soaring synths and a driving beat.',
  'A dreamy acoustic ballad about long summer nights with someone you love.',
]

const LYRICS_SUGGESTIONS = [
  '[verse]\nCity lights fading in the rearview\nEvery street corner holds a memory of you\n[chorus]\nI\'m leaving but I\'m taking you with me\nIn every song I\'ll ever sing',
  '[verse]\nGolden hour on an empty highway\nWindows down, radio playing our song\n[chorus]\nWe were young and we were reckless\nAnd I would not trade it for the world',
]

// "Enhance" polishes whatever's already been typed — mock canned rewrite,
// no real AI call, same as the Idea/Lyrics generate buttons above.
const ENHANCED_SUGGESTIONS = [
  'In the stillness of midnight, as raindrops dance upon the pavement, a story unfolds — a bittersweet tale of leaving a city you called home, melancholic yet hopeful.',
  'An unstoppable anthem of chasing dreams against all odds — soaring synths, a driving beat, and a chorus built for shouting along.',
]

// Same catalog as everywhere else in the app — no fabricated song data.
const MY_CREATIONS = SONGS.slice(0, 7)

// Figma "Create Song — Processing" (node 49:92) — bar heights taken as-is
// from the design, animated into an equalizer pulse instead of the static
// export (this is a loading state; a still waveform reads as broken, not
// "composing").
const WAVE_BAR_HEIGHTS = [
  20, 35, 15, 48, 22, 55, 18, 40, 28, 60, 25, 52, 30, 45, 20, 38, 26, 50, 15, 42, 24, 36, 18,
]

// Rotating status line under the progress bar — mirrors Figma's "Producing
// the track..." plus the same flavor of step text from the flow reference
// (scottwu630/ycmuse-prototype's #screen-song-creating).
const PROCESSING_STATUS_MESSAGES = ['Setting the tempo...', 'Producing the track...', 'Mixing vocals...', 'Adding finishing touches...']

// Mock "processing" duration before handing off to the Result screen — no
// real job to poll, so this is just a fixed wait with a progress bar
// animated to match.
const PROCESSING_DURATION_MS = 4000

// Not official lyrics — same per-song generated lyrics used on Song Detail
// (src/data/songs.ts), so this "result" song's lyrics sheet has real content
// to show instead of a placeholder.
const FALLBACK_LYRICS = ['♪ No lyrics available for this one yet ♪']

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function formatSongLength(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds} seconds`
  const minutes = Math.round(totalSeconds / 60)
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function SongProcessing({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const [statusIndex, setStatusIndex] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const progressTimer = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / PROCESSING_DURATION_MS) * 100)
      setProgress(pct)
      if (pct >= 100) {
        window.clearInterval(progressTimer)
        onComplete()
      }
    }, 100)
    const statusTimer = window.setInterval(() => {
      setStatusIndex((current) => (current + 1) % PROCESSING_STATUS_MESSAGES.length)
    }, 1000)
    return () => {
      window.clearInterval(progressTimer)
      window.clearInterval(statusTimer)
    }
  }, [onComplete])

  return (
    <div className="song-processing">
      <div className="song-processing__wave" aria-hidden="true">
        {WAVE_BAR_HEIGHTS.map((height, index) => (
          <span
            key={index}
            className="song-processing__wave-bar"
            style={{ '--peak-height': `${height}px`, animationDelay: `${index * 0.06}s` } as CSSProperties}
          />
        ))}
      </div>

      <div className="song-processing__message">
        <p className="song-processing__title">Composing Your Song</p>
        <p className="song-processing__subtitle">
          AI is generating your original track.
          <br />
          This usually takes about a minute.
        </p>
      </div>

      <div className="song-processing__progress">
        <div className="song-processing__progress-track">
          <div className="song-processing__progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="song-processing__status">{PROCESSING_STATUS_MESSAGES[statusIndex]}</p>
      </div>

      <a href="/history" className="song-processing__view-later">
        View Later
      </a>
    </div>
  )
}

// Figma "Song Result" (node 50:84, mobile) + desktop reference (node
// 1611:23120, "AI Song — Feature Room" with the Community column swapped
// for the finished player). No real generation exists, so this "result" is
// one real song picked from src/data/songs.ts (see SongCreatePage's
// handleCreate) — real cover/audio/lyrics, not a fabricated track.
//
// Simplifications from the mobile Figma frame: no blurred full-bleed
// background and no custom back/home nav bar — both would duplicate this
// app's existing RoomNavbar/MobileHeader chrome, which stays visible here
// the same way it did through the Processing stage.
function SongResult({ song, onRecreate }: { song: (typeof SONGS)[number]; onRecreate: () => void }) {
  const [playlist] = useState(() => [song, ...MY_CREATIONS.filter((creation) => creation.id !== song.id)])
  const [activeSongIndex, setActiveSongIndex] = useState(0)
  const activeSong = playlist[activeSongIndex]
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(true)
  const [liked, setLiked] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showLyrics, setShowLyrics] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [publish, setPublish] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Song publish never confirms first — just toasts (unlike MV, which shows
  // PublishDialog's "Ready to Go Public?" — see MVResultPage).
  function handlePublishToggle(next: boolean) {
    setPublish(next)
    setToastMessage(next ? 'Published success' : 'Unpublished success')
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    setCurrentTime(0)
    setDuration(0)
    setLiked(false)
    audio.currentTime = 0
    audio.load()
    audio.play().catch(() => {})
  }, [activeSong.id])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play()
    else audio.pause()
  }

  function toggleMute() {
    const audio = audioRef.current
    if (!audio) return
    const nextMuted = !muted
    audio.muted = nextMuted
    setMuted(nextMuted)
  }

  function handleVolumeChange(nextVolume: number) {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = nextVolume
    audio.muted = nextVolume === 0
    setVolume(nextVolume)
    setMuted(nextVolume === 0)
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

  function selectSong(index: number) {
    if (index === activeSongIndex) {
      const audio = audioRef.current
      if (!audio) return
      audio.currentTime = 0
      audio.play().catch(() => {})
      return
    }
    setActiveSongIndex(index)
  }

  const progressRatio = duration ? currentTime / duration : 0

  const lyricLines = activeSong.lyricLines.length ? activeSong.lyricLines : FALLBACK_LYRICS
  const activeLineIndex = Math.min(
    lyricLines.length - 1,
    Math.floor((duration ? currentTime / duration : 0) * lyricLines.length),
  )
  const activeLineRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    activeLineRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [activeLineIndex])

  return (
    <div className="song-result-page">
      <div className="song-result">
        {/* Figma "Song Result_L" (node 1614:76597, desktop) — the panel's
            blurred background reuses the same cover image, not a separate
            asset, simplified to a plain fill + center-crop rather than
            Figma's oversized/offset source layer. Desktop-only (≥1024px):
            the mobile Result frame (node 50:84) has no such panel/backdrop,
            so mobile keeps its existing plain background untouched. */}
        <img src={activeSong.cover} alt="" className="song-result__bg" aria-hidden="true" />
        <div className="song-result__bg-overlay" aria-hidden="true" />

        <div className="song-result__content">
          <audio
            ref={audioRef}
            src={activeSong.audio}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          />

          <div className="song-result__player">
            <div className={`song-result__art${playing ? ' song-result__art--playing' : ''}`}>
              <img src={activeSong.cover} alt="" />
            </div>

            <div className="song-result__controller">
              <div className="song-result__meta-row">
                <div className="song-result__meta">
                  <p className="song-result__title">{activeSong.title}</p>
                </div>

                <div className="song-result__actions">
                  <button
                    type="button"
                    className={`song-result__icon-btn${liked ? ' song-result__icon-btn--active' : ''}`}
                    onClick={() => setLiked((current) => !current)}
                    aria-label={liked ? 'Unlike' : 'Like'}
                  >
                    <span className="song-result__icon" style={maskStyle(liked ? icFavoriteOn : icFavoriteOff)} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="song-result__icon-btn"
                    onClick={() => shareOrOpenDialog(activeSong.title, () => setShareOpen(true))}
                    aria-label="Share"
                  >
                    <span className="song-result__icon" style={maskStyle(icShare)} aria-hidden="true" />
                  </button>
                  <a
                    href={activeSong.audio}
                    download
                    className="song-result__icon-btn song-result__icon-btn--desktop"
                    aria-label="Download"
                  >
                    <span className="song-result__icon" style={maskStyle(icDownload)} aria-hidden="true" />
                  </a>
                  <div className="song-result__volume song-result__icon-btn--desktop">
                    <div className="song-result__volume-slider">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={muted ? 0 : volume}
                        onChange={(event) => handleVolumeChange(Number(event.target.value))}
                        aria-label="Volume"
                      />
                    </div>
                    <button
                      type="button"
                      className="song-result__icon-btn"
                      onClick={toggleMute}
                      aria-label={muted ? 'Unmute' : 'Mute'}
                    >
                      <span
                        className="song-result__icon"
                        style={maskStyle(muted || volume === 0 ? icSpeakerOff : icSpeakerOn)}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                  {/* Mobile only — desktop shows lyrics inline instead of behind
                      a toggle (see .song-result__side-panel below). */}
                  <button
                    type="button"
                    className="song-result__icon-btn song-result__icon-btn--lyrics"
                    onClick={() => setShowLyrics(true)}
                    aria-label="Lyrics"
                  >
                    <span className="song-result__icon" style={maskStyle(icSingingMic)} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="song-result__progress" ref={progressRef} onPointerDown={handleProgressPointerDown}>
                <div className="song-result__progress-track" />
                <div className="song-result__progress-fill" style={{ width: `${progressRatio * 100}%` }} />
                <div className="song-result__progress-thumb" style={{ left: `${progressRatio * 100}%` }} />
              </div>
              <div className="song-result__time">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              <div className="song-result__transport">
                <button
                  type="button"
                  className="song-result__transport-btn"
                  disabled={activeSongIndex === 0}
                  onClick={() => selectSong(activeSongIndex - 1)}
                  aria-label="Previous"
                >
                  <span className="song-result__transport-icon" style={maskStyle(icSkipBack)} aria-hidden="true" />
                </button>
                <button type="button" className="song-result__play" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
                  <span className="song-result__play-icon" style={maskStyle(playing ? icPause : icPlay)} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="song-result__transport-btn"
                  disabled={activeSongIndex === playlist.length - 1}
                  onClick={() => selectSong(activeSongIndex + 1)}
                  aria-label="Next"
                >
                  <span className="song-result__transport-icon" style={maskStyle(icSkipForward)} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>

          {/* Desktop only (≥1024px) — lyrics sit inline beside the player
              instead of behind the mic button's popup, matching Figma's
              two-column "Song Panel". Mobile keeps the popup sheet below. */}
          <div className="song-result__side-panel">
            <div className="song-result__lyrics-inline">
              <div className="song-result__lyrics-inline-lines">
                {lyricLines.map((line, index) => (
                  <p
                    key={index}
                    ref={index === activeLineIndex ? activeLineRef : undefined}
                    className={`song-result__lyrics-inline-line${index === activeLineIndex ? ' song-result__lyrics-inline-line--active' : ''}`}
                  >
                    {line}
                  </p>
                ))}
              </div>
              <div className="song-result__lyrics-inline-fade" aria-hidden="true" />
            </div>

            <div className="song-result__ctas">
              <a href="/mv-detail" className="song-result__cta-primary">
                Use in Music Video
                <span className="song-result__cta-primary-icon" style={maskStyle(icArrowRight)} aria-hidden="true" />
              </a>
              <button type="button" className="song-result__cta-secondary" onClick={onRecreate}>
                Recreate
              </button>
            </div>

            <div className="song-result__publish">
              <span className="song-result__publish-icon" style={maskStyle(icPublish)} aria-hidden="true" />
              <div className="song-result__publish-text">
                <p className="song-result__publish-title">Publish</p>
                <p className="song-result__publish-state">{publish ? 'On' : 'Off'}</p>
              </div>
              <ToggleSwitch checked={publish} onChange={handlePublishToggle} />
            </div>
          </div>
        </div>
      </div>

      {/* Figma "Song Result_L" moves My Creations out of the sticky side
          column (form stage only, see SongCreatePage.tsx) into a full-width
          section below the player instead. No mobile frame was given for
          this section specifically — showing it single-column on mobile
          too, rather than dropping it, is this build's own reasonable
          default (flagged for confirmation). */}
      <div className="song-result__creations">
        <p className="song-result__creations-title">My Creations</p>
        <div className="song-result__creations-grid">
          {playlist.map((creation, index) => (
            <button
              key={creation.id}
              type="button"
              className={`song-result__creations-item${index === activeSongIndex ? ' song-result__creations-item--active' : ''}`}
              onClick={() => selectSong(index)}
            >
              <ListItem
                title={creation.title}
                coverImage={creation.cover}
                plays={0}
                likes={0}
                shares={0}
                isPlaying={index === activeSongIndex && playing}
              />
            </button>
          ))}
        </div>
      </div>

      <LyricsSheet
        isOpen={showLyrics}
        title={activeSong.title}
        cover={activeSong.cover}
        lyricLines={lyricLines}
        currentTime={currentTime}
        duration={duration}
        playing={playing}
        onTogglePlay={togglePlay}
        onClose={() => setShowLyrics(false)}
      />

      <ShareDialog title={activeSong.title} isOpen={shareOpen} onClose={() => setShareOpen(false)} />
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  )
}

function SongCreatePage() {
  const { requireSignIn, isSignedIn } = useAuth()
  const params = new URLSearchParams(window.location.search)
  const requestedResultSong = params.get('stage') === 'result'
    ? SONGS.find((song) => song.id === params.get('id')) ?? null
    : null
  const isHistoryResult = params.get('from') === 'history' && requestedResultSong !== null
  const [stage, setStage] = useState<'form' | 'processing' | 'result'>(requestedResultSong ? 'result' : 'form')
  const [resultSong, setResultSong] = useState<(typeof SONGS)[number] | null>(requestedResultSong)
  const [mode, setMode] = useState<SongMode>('Simple')

  const { isEnhancing, enhance } = useEnhance()

  // Simple panel state
  const [instrumentalSimple, setInstrumentalSimple] = useState(false)
  const [ideaText, setIdeaText] = useState('')

  // Custom panel state
  const [instrumentalCustom, setInstrumentalCustom] = useState(false)
  const [lyricsText, setLyricsText] = useState('')
  const [instrumentalText, setInstrumentalText] = useState('')
  const [genre, setGenre] = useState('Pop')
  const [mood, setMood] = useState('Uplifting')
  const [vocal, setVocal] = useState<string | null>(null)
  const [songLength, setSongLength] = useState(60)
  const [songTitle, setSongTitle] = useState('')
  const [showLyricsTooltip, setShowLyricsTooltip] = useState(false)

  const canCreate = mode === 'Custom' || ideaText.trim().length > 0

  const createSongButton = (
    <button
      type="button"
      className={`song-create__cta${canCreate ? ' song-create__cta--active' : ''}`}
      disabled={!canCreate}
      onClick={() => requireSignIn(() => setStage('processing'))}
    >
      <span>Create Song</span>
      <span className="song-create__cta-credits">
        <img src={icCredit} alt="" className="song-create__cta-credit-icon" />
        10
      </span>
    </button>
  )

  return (
    <AppLayout
      navbar={
        isHistoryResult
          ? <DetailNavbar title="AI Song" credits={390} backHref="/history" />
          : <RoomNavbar title="AI Song" credits={390} />
      }
    >
      <div className="song-create">
        <div className={`song-create__panel${stage !== 'form' ? ' song-create__panel--full' : ''}`}>
          {stage === 'processing' ? (
            <SongProcessing
              onComplete={() => {
                setResultSong(pickRandom(SONGS))
                setStage('result')
              }}
            />
          ) : stage === 'result' && resultSong ? (
            <SongResult song={resultSong} onRecreate={() => setStage('form')} />
          ) : (
            <>
          <Tabs tabs={['Simple', 'Custom']} active={mode} onChange={(tab) => setMode(tab as SongMode)} />

          {mode === 'Simple' ? (
            <div className="song-create__section">
              <div className="song-create__row-header">
                <p className="song-create__label">DESCRIBE YOUR SONG</p>
                <ToggleSwitch label="Instrumental" checked={instrumentalSimple} onChange={setInstrumentalSimple} />
              </div>

              <div className={`song-create__input-box${isEnhancing('idea') ? ' song-create__input-box--processing' : ''}`}>
                <textarea
                  className="song-create__textarea"
                  placeholder="e.g. A bittersweet love song about leaving a city you called home, with a melancholic yet hopeful vibe..."
                  maxLength={2500}
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  disabled={isEnhancing('idea')}
                />
                <div className="song-create__input-footer">
                  <button
                    type="button"
                    className="song-create__idea-btn"
                    onClick={() => setIdeaText(pickRandom(IDEA_SUGGESTIONS))}
                    disabled={isEnhancing('idea')}
                  >
                    <span className="song-create__idea-icon" style={maskStyle(icLightbulb)} aria-hidden="true" />
                    Idea
                  </button>
                  <div className="song-create__footer-right">
                    {ideaText.length > 0 && (
                      <button
                        type="button"
                        className="song-create__enhance-btn"
                        onClick={() => enhance('idea', () => setIdeaText(pickRandom(ENHANCED_SUGGESTIONS)))}
                        disabled={isEnhancing('idea')}
                        aria-label="Enhance"
                      >
                        <span
                          className={`song-create__enhance-icon${isEnhancing('idea') ? ' song-create__enhance-icon--spinning' : ''}`}
                          style={maskStyle(isEnhancing('idea') ? icRefresh : icEditAi)}
                          aria-hidden="true"
                        />
                        Enhance
                      </button>
                    )}
                    <span className="song-create__char-count">{ideaText.length}/2500</span>
                    {ideaText.length > 0 && (
                      <button
                        type="button"
                        className="song-create__clear-btn"
                        onClick={() => setIdeaText('')}
                        disabled={isEnhancing('idea')}
                        aria-label="Clear"
                      >
                        <span className="song-create__clear-icon" style={maskStyle(icClose)} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="song-create__section">
              <div className="song-create__row-header">
                <div className="song-create__label-group">
                  <p className="song-create__label">LYRICS</p>
                  <button
                    type="button"
                    className="song-create__info-btn"
                    onClick={() => setShowLyricsTooltip((open) => !open)}
                    aria-label="Supported languages"
                  >
                    <span className="song-create__info-icon" style={maskStyle(icInfo)} aria-hidden="true" />
                  </button>
                  {showLyricsTooltip && (
                    <div className="song-create__tooltip">
                      <p className="song-create__tooltip-title">Supported Languages</p>
                      <p className="song-create__tooltip-body">
                        English, Japanese, German, Portuguese, Italian, French, Spanish, Turkish, Chinese, Korean, and Hindi
                      </p>
                    </div>
                  )}
                </div>
                <ToggleSwitch label="Instrumental" checked={instrumentalCustom} onChange={setInstrumentalCustom} />
              </div>

              <div className={`song-create__input-box${isEnhancing('lyrics') ? ' song-create__input-box--processing' : ''}`}>
                {instrumentalCustom ? (
                  <>
                    <textarea
                      className="song-create__textarea"
                      placeholder={'Describe the mood or vibe of your instrumental…\n\nNo lyrics needed — AI will create a pure instrumental track.'}
                      maxLength={2500}
                      value={instrumentalText}
                      onChange={(e) => setInstrumentalText(e.target.value)}
                    />
                    <div className="song-create__input-footer">
                      <div className="song-create__input-actions">
                        <button
                          type="button"
                          className="song-create__idea-btn"
                          onClick={() => setInstrumentalText(pickRandom(IDEA_SUGGESTIONS))}
                        >
                          <span className="song-create__idea-icon" style={maskStyle(icLightbulb)} aria-hidden="true" />
                          Idea
                        </button>
                      </div>
                      <div className="song-create__footer-right">
                        <span className="song-create__char-count">{instrumentalText.length}/2500</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                  <textarea
                    className="song-create__textarea"
                    placeholder="Write your lyrics here... Or leave blank — AI will generate them based on your chosen style and mood."
                    maxLength={2500}
                    value={lyricsText}
                    onChange={(e) => setLyricsText(e.target.value)}
                    disabled={isEnhancing('lyrics')}
                  />
                  <div className="song-create__input-footer">
                    <div className="song-create__input-actions">
                      <button
                        type="button"
                        className="song-create__idea-btn"
                        onClick={() => setLyricsText(pickRandom(IDEA_SUGGESTIONS))}
                        disabled={isEnhancing('lyrics')}
                      >
                        <span className="song-create__idea-icon" style={maskStyle(icLightbulb)} aria-hidden="true" />
                        Idea
                      </button>
                      <button
                        type="button"
                        className="song-create__idea-btn"
                        onClick={() => setLyricsText(pickRandom(LYRICS_SUGGESTIONS))}
                        disabled={isEnhancing('lyrics')}
                      >
                        <span className="song-create__idea-icon" style={maskStyle(icSingingMic)} aria-hidden="true" />
                        Lyrics
                      </button>
                    </div>
                    <div className="song-create__footer-right">
                      {lyricsText.length > 0 && (
                        <button
                          type="button"
                          className="song-create__enhance-btn"
                          onClick={() => enhance('lyrics', () => setLyricsText(pickRandom(ENHANCED_SUGGESTIONS)))}
                          disabled={isEnhancing('lyrics')}
                          aria-label="Enhance"
                        >
                          <span
                            className={`song-create__enhance-icon${isEnhancing('lyrics') ? ' song-create__enhance-icon--spinning' : ''}`}
                            style={maskStyle(isEnhancing('lyrics') ? icRefresh : icEditAi)}
                            aria-hidden="true"
                          />
                          Enhance
                        </button>
                      )}
                      <span className="song-create__char-count">{lyricsText.length}/2500</span>
                      {lyricsText.length > 0 && (
                        <button
                          type="button"
                          className="song-create__clear-btn"
                          onClick={() => setLyricsText('')}
                          disabled={isEnhancing('lyrics')}
                          aria-label="Clear"
                        >
                          <span className="song-create__clear-icon" style={maskStyle(icClose)} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                  </>
                )}
              </div>

              <div className="song-create__style">
                <p className="song-create__label">STYLE</p>

                <div className="song-create__chip-group">
                  <p className="song-create__chip-label">GENRE</p>
                  <div className="song-create__chips">
                    {GENRES.map((item) => (
                      <Chip key={item} label={item} selected={genre === item} onClick={() => setGenre(item)} />
                    ))}
                  </div>
                </div>

                <div className="song-create__chip-group">
                  <p className="song-create__chip-label">MOOD</p>
                  <div className="song-create__chips">
                    {MOODS.map((item) => (
                      <Chip key={item} label={item} selected={mood === item} onClick={() => setMood(item)} />
                    ))}
                  </div>
                </div>

                <div className="song-create__chip-group">
                  <p className="song-create__chip-label">
                    VOCAL <span className="song-create__chip-label-optional">(Optional)</span>
                  </p>
                  <div className="song-create__chips">
                    {VOCALS.map((item) => (
                      <Chip
                        key={item}
                        label={item}
                        selected={vocal === item}
                        onClick={() => setVocal((current) => (current === item ? null : item))}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {SHOW_SONG_LENGTH && (
                <div className="song-create__length">
                  <p className="song-create__label">SONG LENGTH</p>
                  <div className="song-create__length-card">
                    <div className="song-create__length-scale">
                      <span>30s</span>
                      <span>1 min</span>
                      <span>2 min</span>
                      <span>3 min</span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={180}
                      step={15}
                      value={songLength}
                      onChange={(e) => setSongLength(Number(e.target.value))}
                      className="song-create__length-slider"
                    />
                    <p className="song-create__length-value">{formatSongLength(songLength)}</p>
                  </div>
                </div>
              )}

              <div className="song-create__title-field">
                <p className="song-create__label">
                  SONG TITLE <span className="song-create__chip-label-optional">(Optional)</span>
                </p>
                <div className="song-create__title-input-box">
                  <input
                    type="text"
                    className="song-create__title-input"
                    placeholder="e.g. Midnight Drive, Golden Hour..."
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                  />
                </div>
                <p className="song-create__title-hint">Leave blank — AI will suggest a title based on your lyrics and style.</p>
              </div>
            </div>
          )}

          {mode === 'Simple' ? createSongButton : <FloatingCTA alignToParent>{createSongButton}</FloatingCTA>}
            </>
          )}
        </div>

        {/* Only the form stage uses this two-column layout — processing has
            no side content at all, and the result stage moves "My
            Creations" into SongResult itself as a full-width section below
            the player instead (Figma "Song Result_L", node 1614:76597). */}
        {stage === 'form' && (
          <div className="song-create__side">
            <div className="song-create__side-header">
              <p className="song-create__side-title">{isSignedIn ? 'My Creations' : 'Trending Songs'}</p>
              {!isSignedIn && (
                <a href="/song-detail?from=song-create" className="song-create__side-see-all">
                  See all
                  <span className="song-create__side-see-all-icon" style={maskStyle(icChevronRight)} aria-hidden="true" />
                </a>
              )}
            </div>
            <div className="song-create__side-list">
              {MY_CREATIONS.map((song) => (
                <a key={song.id} href={`/song-detail?id=${song.id}&from=song-create`} className="song-create__side-item">
                  <ListItem title={song.title} coverImage={song.cover} username="ScottWu" plays={0} likes={0} shares={0} />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

export default SongCreatePage
