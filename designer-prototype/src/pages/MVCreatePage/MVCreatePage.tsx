import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import AppLayout from '../../layouts/AppLayout/AppLayout'
import RoomNavbar from '../../components/RoomNavbar/RoomNavbar'
import FloatingCTA from '../../components/FloatingCTA/FloatingCTA'
import { useAuth } from '../../components/AuthProvider/AuthProvider'
import ToggleSwitch from '../../components/ToggleSwitch/ToggleSwitch'
import ListItem from '../../components/ListItem/ListItem'
import { SONGS } from '../../data/songs'
import { MUSIC_VIDEOS } from '../../data/musicVideos'
import { saveMvDraft } from '../../data/mvDraft'
import type { MvDraft } from '../../data/mvDraft'
import icVideo from '../../assets/icons/ic_video.svg'
import icEditAi from '../../assets/icons/ic_edit_ai.svg'
import icClose from '../../assets/icons/ic_close.svg'
import icSongList from '../../assets/icons/ic_song_list.svg'
import icUpload from '../../assets/icons/ic_upload.svg'
import icPlay from '../../assets/icons/ic_play.svg'
import icPause from '../../assets/icons/ic_pause.svg'
import icEdit from '../../assets/icons/ic_edit.svg'
import icAdd from '../../assets/icons/ic_add.svg'
import icChevronRight from '../../assets/icons/ic_chevron-right.svg'
import icArrowRight from '../../assets/icons/ic_arrow_right.svg'
import icClock from '../../assets/icons/ic_clock.svg'
import icCredit from '../../assets/icons/ic_credit.svg'
import icScript from '../../assets/icons/ic_script.svg'
import icVideoAi from '../../assets/icons/ic_video_ai.svg'
import icCheck from '../../assets/icons/ic_check.svg'
import icRefresh from '../../assets/icons/ic_refresh.svg'
import icRectangleVer from '../../assets/icons/ic_rectangle_ver.svg'
import icRectangleHor from '../../assets/icons/ic_rectangle_hor.svg'
import icSd from '../../assets/icons/ic_sd.svg'
import icHd from '../../assets/icons/ic_hd.svg'
import { useEnhance } from '../../hooks/useEnhance'
import { useMountTransition, useLastValue } from '../../hooks/useMountTransition'
import sample1 from '../../assets/covers/Avatar/Sample_P1.png'
import sample2 from '../../assets/covers/Avatar/Sample_P2.png'
import sample3 from '../../assets/covers/Avatar/Sample_P3.png'
import sample4 from '../../assets/covers/Avatar/Sample_P4.png'
import sample5 from '../../assets/covers/Avatar/Sample_P5.png'
import sample6 from '../../assets/covers/Avatar/Sample_P6.png'
import sample7 from '../../assets/covers/Avatar/Sample_P7.png'
import sample8 from '../../assets/covers/Avatar/Sample_P8.png'
import styleVideoSinging from '../../assets/create-mv/type/feature_intro_ai_mv_singing_480x640.mp4?url'
import styleVideoStorytelling from '../../assets/create-mv/type/feature_intro_ai_mv_storytelling_480x640.mp4?url'
import styleVideoHybrid from '../../assets/create-mv/type/feature_intro_ai_mv_hybrid_480x640.mp4?url'
import templateVintage from '../../assets/hero/hero_01_Vintage Car-tmp-tmp.mp4?url'
import templateSplash from '../../assets/hero/hero_02_Splash-tmp-tmp.mp4?url'
import templateUrban from '../../assets/hero/hero_03_Urban Fashion-tmp-tmp.mp4?url'
import templateMidnight from '../../assets/hero/hero_04_midnight_static-tmp-tmp.mp4?url'
import templatePastel from '../../assets/hero/hero_05_pastel_film_converted.mp4?url'
import templateAlice from '../../assets/hero/hero_06_alice_in_wonderland.mp4?url'
import templateJpop from '../../assets/hero/hero_07_jpop.mp4?url'
import templatePaper from '../../assets/hero/hero_08_paper_wonderland_converted.mp4?url'
import faceDetectionGroup from '../../assets/faces/demo-detection/group.jpg'
import './MVCreatePage.css'

// Figma "AI MV — Feature Room" (nodes 1330:24550, 1344:25723). Flow/behavior
// reference (song picker, photo upload, settings sheet, mode choice) is
// scottwu630/ycmuse-prototype muse-prototype-v1.html's #screen-mv-room +
// #settings-sheet + #mv-mode-sheet — no real AI/API call, per project scope.
//
// Scope for this pass: the Feature Room form itself, through to the "how
// would you like to create" mode choice. The reference HTML continues into
// a storyboard-review step and a render/result screen (#screen-mv-thinking,
// #screen-mv-storyboard, #screen-mv-creating, #screen-mv-result) — those
// aren't built yet, matching how Song Create's Processing/Result stages
// were added in later, separate passes rather than all at once.
//
// Multi-face photo selection follows Figma nodes 280:3091 and 280:3131.
// Detection is intentionally deterministic mock state for this UI prototype:
// one supplied group photo, percentage-based face boxes, and CSS crops.

type SongSource = 'library' | 'import' | null

interface ChosenSong {
  title: string
  cover: string
  audio: string
  duration: string
}

interface StyleOption {
  key: string
  label: string
  video: string
}

const MV_STYLES: StyleOption[] = [
  { key: 'singing', label: 'Singing', video: styleVideoSinging },
  { key: 'storytelling', label: 'Storytelling', video: styleVideoStorytelling },
  { key: 'hybrid', label: 'Hybrid', video: styleVideoHybrid },
]

const SAMPLE_PHOTOS = [sample1, sample2, sample3, sample4, sample5, sample6, sample7, sample8]

const DETECTED_FACES = [
  { label: 'Face 1', position: '26% 18%', box: { left: '22.5%', top: '15%', width: '14%', height: '31%' } },
  { label: 'Face 2', position: '40% 30%', box: { left: '36.5%', top: '25%', width: '12%', height: '29%' } },
  { label: 'Face 3', position: '57% 16%', box: { left: '49%', top: '14%', width: '14%', height: '31%' } },
  { label: 'Face 4', position: '74% 30%', box: { left: '63%', top: '25%', width: '14%', height: '30%' } },
]

const ENHANCED_SUGGESTIONS = [
  'A slow-burn cinematic story: two strangers keep crossing paths under neon signs, the city breathing in time with the song, until a final glance says everything words couldn\'t.',
  'A sun-drenched performance piece — camera sweeping through a live studio session, energy building shot by shot until it explodes on the final chorus.',
]

// Reuses the same audio/cover catalog as Song Create/Song Detail — no
// fabricated song data. Figma "Choose Song" (node 297:5181) splits the
// picker into "My Songs"/"Sample Songs" tabs; this catalog has no such
// distinction of its own, so it's split arbitrarily in two to fill both tabs.
const MY_SONGS = SONGS.slice(0, 3)
const SAMPLE_SONGS = SONGS.slice(3, 8)

// Same MV catalog as Home/MV Detail — "My Creations" shows the user's own
// videos, so this reuses MUSIC_VIDEOS rather than SONGS despite the Figma
// mock text showing song-like titles (looks like reused placeholder copy
// from the Song page, not a deliberate content choice for this one).
const MY_CREATIONS = MUSIC_VIDEOS.slice(0, 7)

interface VideoTemplate {
  key: string
  label: string
  video: string
  description: string
}

// Figma "Select a Template" (node 346:5071), expanded for desktop with the
// eight matching hero preview videos already provided by the project.
const VIDEO_TEMPLATES: VideoTemplate[] = [
  {
    key: 'vintage-drive',
    label: 'Vintage Drive',
    video: templateVintage,
    description: 'A nostalgic vintage drive with warm film tones, classic styling, and cinematic road-trip energy.',
  },
  {
    key: 'splash-zone',
    label: 'Splash Zone',
    video: templateSplash,
    description: 'A high-energy visual filled with water, motion, and punchy transitions that follow the beat.',
  },
  {
    key: 'urban-runway',
    label: 'Urban Runway',
    video: templateUrban,
    description: 'A bold urban fashion film with confident movement, graphic city textures, and runway-inspired framing.',
  },
  {
    key: 'j-pop',
    label: 'J-Pop',
    video: templateJpop,
    description: 'A vibrant J-Pop music video with neon stage lighting, dynamic camera moves, and high-energy choreography.',
  },
  {
    key: 'midnight-static',
    label: 'Midnight Static',
    video: templateMidnight,
    description: 'A moody, static-noise-drenched night scene with flickering lights and a melancholic atmosphere.',
  },
  {
    key: 'paper-wonderland',
    label: 'Paper Wonderland',
    video: templatePaper,
    description: 'A whimsical paper-craft wonderland brought to life with soft pastel textures and gentle motion.',
  },
  {
    key: 'pastel-film',
    label: 'Pastel Film',
    video: templatePastel,
    description: 'A dreamy pastel-toned film look with soft grain, warm light leaks, and a nostalgic indie feel.',
  },
  {
    key: 'alice-in-wonderland',
    label: 'Alice in Wonderland',
    video: templateAlice,
    description: 'A surreal Wonderland-inspired story full of oversized props, curious characters, and vivid color.',
  },
]

// Figma "Trim Audio" (node 90:1452) waveform's own 45 bar heights, reused
// verbatim as mock waveform data (no real audio-analysis exists to derive
// real ones from).
const TRIM_WAVEFORM_HEIGHTS = [
  6, 16, 10, 26, 14, 36, 8, 28, 16, 38, 12, 32, 21, 42, 16, 34, 12, 26, 18, 22, 14, 18, 8, 20, 6, 16, 10, 26, 14, 36, 8,
  28, 16, 38, 12, 32, 21, 6, 16, 34, 12, 26, 18, 22, 14,
]
const TRIM_MIN_GAP = 0.08

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function songToChosen(song: (typeof SONGS)[number]): ChosenSong {
  return { title: song.title, cover: song.cover, audio: song.audio, duration: '' }
}

// Figma "Settings" (chip row, node 1330:25599) — chevron opens this sheet.
// Mobile bottom sheet / desktop centered dialog, same convention as
// LoginModal (no separate desktop frame was given for the sheet itself).
interface SettingsSheetProps {
  visible: boolean
  aspect: '9:16' | '16:9'
  onAspectChange: (value: '9:16' | '16:9') => void
  quality: 'SD' | 'HD'
  onQualityChange: (value: 'SD' | 'HD') => void
  mvTitle: string
  onMvTitleChange: (value: string) => void
  author: string
  onAuthorChange: (value: string) => void
  showSubtitle: boolean
  onShowSubtitleChange: (value: boolean) => void
  showWatermark: boolean
  onShowWatermarkChange: (value: boolean) => void
  onClose: () => void
}

function SettingsSheet({
  visible,
  aspect,
  onAspectChange,
  quality,
  onQualityChange,
  mvTitle,
  onMvTitleChange,
  author,
  onAuthorChange,
  showSubtitle,
  onShowSubtitleChange,
  showWatermark,
  onShowWatermarkChange,
  onClose,
}: SettingsSheetProps) {
  return createPortal(
    <div className={`mv-sheet-overlay${visible ? ' mv-sheet-overlay--visible' : ''}`}>
      <div className="mv-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="mv-sheet" role="dialog" aria-label="Settings">
        <div className="mv-sheet__handle" aria-hidden="true" />
        <div className="mv-sheet__header">
          <button type="button" className="mv-sheet__close" onClick={onClose} aria-label="Close">
            <img src={icClose} alt="" className="mv-sheet__close-icon" />
          </button>
          <p className="mv-sheet__title">Settings</p>
          <button type="button" className="mv-sheet__confirm" onClick={onClose} aria-label="Apply">
            <img src={icCheck} alt="" className="mv-sheet__confirm-icon" />
          </button>
        </div>

        <div className="mv-sheet__body">
          <div className="mv-settings__group">
            <p className="mv-settings__label">ASPECT RATIO</p>
            <div className="mv-settings__seg">
              <button
                type="button"
                className={`mv-settings__seg-opt${aspect === '9:16' ? ' mv-settings__seg-opt--active' : ''}`}
                onClick={() => onAspectChange('9:16')}
              >
                <span className="mv-settings__seg-icon" style={maskStyle(icRectangleVer)} aria-hidden="true" />
                9:16
              </button>
              <button
                type="button"
                className={`mv-settings__seg-opt${aspect === '16:9' ? ' mv-settings__seg-opt--active' : ''}`}
                onClick={() => onAspectChange('16:9')}
              >
                <span className="mv-settings__seg-icon" style={maskStyle(icRectangleHor)} aria-hidden="true" />
                16:9
              </button>
            </div>
          </div>

          <div className="mv-settings__group">
            <p className="mv-settings__label">QUALITY</p>
            <div className="mv-settings__seg">
              <button
                type="button"
                className={`mv-settings__seg-opt${quality === 'SD' ? ' mv-settings__seg-opt--active' : ''}`}
                onClick={() => onQualityChange('SD')}
              >
                <span className="mv-settings__seg-icon" style={maskStyle(icSd)} aria-hidden="true" />
                Standard
              </button>
              <button
                type="button"
                className={`mv-settings__seg-opt${quality === 'HD' ? ' mv-settings__seg-opt--active' : ''}`}
                onClick={() => onQualityChange('HD')}
              >
                <span className="mv-settings__seg-icon" style={maskStyle(icHd)} aria-hidden="true" />
                High
              </button>
            </div>
          </div>

          <div className="mv-settings__group">
            <p className="mv-settings__label">MV TITLE</p>
            <input
              type="text"
              className="mv-settings__input"
              placeholder="Enter MV song name"
              value={mvTitle}
              onChange={(e) => onMvTitleChange(e.target.value)}
            />
          </div>

          <div className="mv-settings__group">
            <p className="mv-settings__label">AUTHOR NAME</p>
            <input
              type="text"
              className="mv-settings__input"
              placeholder="Enter author name"
              value={author}
              onChange={(e) => onAuthorChange(e.target.value)}
            />
          </div>

          <div className="mv-settings__row">
            <div className="mv-settings__row-text">
              <p className="mv-settings__row-title">Show Subtitle</p>
              <p className="mv-settings__row-desc">Subtitles will appear in the video</p>
            </div>
            <ToggleSwitch checked={showSubtitle} onChange={onShowSubtitleChange} />
          </div>

          <div className="mv-settings__row">
            <div className="mv-settings__row-text">
              <p className="mv-settings__row-title">Show Watermark</p>
              <p className="mv-settings__row-desc">The YouCam Muse logo will appear.</p>
            </div>
            <ToggleSwitch checked={showWatermark} onChange={onShowWatermarkChange} />
          </div>
        </div>

        <div className="mv-sheet__footer">
          <button type="button" className="mv-sheet__footer-btn mv-sheet__footer-btn--cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="mv-sheet__footer-btn mv-sheet__footer-btn--confirm" onClick={onClose}>
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// Figma "Choose Song" (node 297:5181, 297:4973) — My Songs/Sample Songs
// tabs; each row only reveals its "Use" pill once active (desktop: hovered,
// mobile: tapped — there's no hover on touch, so tapping the row itself
// stands in for it), instead of showing it permanently on every row.
// Clicking a row also actually plays that song's audio (one at a time via a
// single shared <audio> element) and swaps its thumbnail's icon to pause.
interface SongPickerSheetProps {
  visible: boolean
  onPick: (song: (typeof SONGS)[number]) => void
  onClose: () => void
}

function SongPickerSheet({ visible, onPick, onClose }: SongPickerSheetProps) {
  const [tab, setTab] = useState<'my' | 'sample'>('my')
  const [activeSongId, setActiveSongId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [durations, setDurations] = useState<Record<string, number>>({})
  const audioRef = useRef<HTMLAudioElement>(null)
  const songs = tab === 'my' ? MY_SONGS : SAMPLE_SONGS

  function switchTab(next: 'my' | 'sample') {
    setTab(next)
    setActiveSongId(null)
    setCurrentTime(0)
    audioRef.current?.pause()
  }

  function handleRowClick(song: (typeof SONGS)[number]) {
    const audio = audioRef.current
    if (!audio) return
    if (activeSongId === song.id) {
      if (audio.paused) audio.play()
      else audio.pause()
    } else {
      setActiveSongId(song.id)
      setCurrentTime(0)
      audio.src = song.audio
      audio.play()
    }
  }

  return createPortal(
    <div className={`mv-sheet-overlay${visible ? ' mv-sheet-overlay--visible' : ''}`}>
      <div className="mv-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="mv-sheet mv-song-picker" role="dialog" aria-label="Choose Song">
        <div className="mv-sheet__handle" aria-hidden="true" />
        <div className="mv-sheet__header">
          <button type="button" className="mv-sheet__close" onClick={onClose} aria-label="Close">
            <img src={icClose} alt="" className="mv-sheet__close-icon" />
          </button>
          <p className="mv-sheet__title">Choose Song</p>
          <div className="mv-sheet__header-spacer" aria-hidden="true" />
        </div>

        <div className="mv-song-picker__tabs">
          <button
            type="button"
            className={`mv-song-picker__tab${tab === 'my' ? ' mv-song-picker__tab--active' : ''}`}
            onClick={() => switchTab('my')}
          >
            My Songs
          </button>
          <button
            type="button"
            className={`mv-song-picker__tab${tab === 'sample' ? ' mv-song-picker__tab--active' : ''}`}
            onClick={() => switchTab('sample')}
          >
            Sample Songs
          </button>
        </div>

        <audio
          ref={audioRef}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            if (!activeSongId) return
            const duration = e.currentTarget.duration
            setDurations((current) => ({ ...current, [activeSongId]: duration }))
          }}
        />

        <div className="mv-sheet__body mv-sheet__body--list">
          {songs.map((song) => {
            const active = activeSongId === song.id
            const duration = durations[song.id] ?? 0
            return (
              <div
                key={song.id}
                className={`mv-song-picker__row${active ? ' mv-song-picker__row--active' : ''}`}
                onClick={() => handleRowClick(song)}
              >
                <span className="mv-song-picker__art">
                  <img src={song.cover} alt="" />
                  <span className="mv-song-picker__art-scrim" aria-hidden="true" />
                  <span
                    className="mv-song-picker__art-icon"
                    style={maskStyle(active && isPlaying ? icPause : icPlay)}
                    aria-hidden="true"
                  />
                </span>
                <audio
                  className="mv-song-picker__metadata"
                  src={song.audio}
                  preload="metadata"
                  onLoadedMetadata={(e) => {
                    const duration = e.currentTarget.duration
                    setDurations((current) => ({ ...current, [song.id]: duration }))
                  }}
                />
                <span className="mv-song-picker__info">
                  <span className="mv-song-picker__title">{song.title}</span>
                  <span className="mv-song-picker__duration">
                    {active && isPlaying ? (
                      <>
                        <span className="mv-song-picker__duration-current">{formatTime(currentTime)}</span>
                        <span> / {formatTime(duration)}</span>
                      </>
                    ) : (
                      formatTime(duration)
                    )}
                  </span>
                </span>
                <button
                  type="button"
                  className="mv-song-picker__use"
                  onClick={(e) => {
                    e.stopPropagation()
                    audioRef.current?.pause()
                    onPick(song)
                  }}
                >
                  Use
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>,
    document.body,
  )
}

// Figma "Select a Template" (node 346:5071) — mobile bottom sheet used
// directly; desktop reuses the same centered-dialog convention as the
// other sheets on this page (SongPickerSheet, SettingsSheet, ModeSheet),
// since Figma has no dedicated desktop frame for it either.
interface TemplateSheetProps {
  visible: boolean
  selectedKey: string
  onSelect: (key: string) => void
  onApply: () => void
  onClose: () => void
}

function TemplateSheet({ visible, selectedKey, onSelect, onApply, onClose }: TemplateSheetProps) {
  const selected = VIDEO_TEMPLATES.find((template) => template.key === selectedKey) ?? VIDEO_TEMPLATES[0]

  return createPortal(
    <div className={`mv-sheet-overlay${visible ? ' mv-sheet-overlay--visible' : ''}`}>
      <div className="mv-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="mv-sheet mv-template-sheet" role="dialog" aria-label="Select a Template">
        <div className="mv-sheet__handle" aria-hidden="true" />
        <div className="mv-sheet__header">
          <button type="button" className="mv-sheet__close" onClick={onClose} aria-label="Close">
            <img src={icClose} alt="" className="mv-sheet__close-icon" />
          </button>
          <p className="mv-sheet__title">Select a Template</p>
          <button type="button" className="mv-sheet__confirm" onClick={onApply} aria-label="Apply">
            <img src={icCheck} alt="" className="mv-sheet__confirm-icon" />
          </button>
        </div>

        <div className="mv-template-sheet__preview">
          <video key={selected.key} src={selected.video} muted loop autoPlay playsInline />
        </div>

        <div className="mv-template-sheet__list">
          {VIDEO_TEMPLATES.map((template) => (
            <button
              key={template.key}
              type="button"
              className={`mv-template-sheet__item${template.key === selectedKey ? ' mv-template-sheet__item--active' : ''}`}
              onClick={() => onSelect(template.key)}
            >
              <video
                src={template.video}
                className="mv-template-sheet__thumb"
                muted
                loop
                autoPlay
                playsInline
              />
              <span className="mv-template-sheet__label">{template.label}</span>
            </button>
          ))}
        </div>

        <div className="mv-sheet__footer">
          <button type="button" className="mv-sheet__footer-btn mv-sheet__footer-btn--cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="mv-sheet__footer-btn mv-sheet__footer-btn--confirm" onClick={onApply}>
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// Figma "Trim Audio" (node 90:1452) — opens after picking "Use" on a song in
// SongPickerSheet, mobile design used directly. Confirming here is what
// actually commits the song choice (no real audio-trimming exists, this is
// visual/interaction fidelity only — the drag handles move, but nothing is
// actually cut).
interface TrimAudioSheetProps {
  visible: boolean
  song: (typeof SONGS)[number]
  onConfirm: () => void
  onClose: () => void
}

function TrimAudioSheet({ visible, song, onConfirm, onClose }: TrimAudioSheetProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [trimStart, setTrimStart] = useState(0.2)
  const [trimEnd, setTrimEnd] = useState(0.75)
  const trimStartRef = useRef(trimStart)
  const trimEndRef = useRef(trimEnd)
  trimStartRef.current = trimStart
  trimEndRef.current = trimEnd

  function toggleSongPlay() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play()
    else audio.pause()
  }

  function handleHandlePointerDown(edge: 'start' | 'end') {
    return (event: ReactPointerEvent) => {
      event.stopPropagation()

      function updateFromClientX(clientX: number) {
        const track = trackRef.current
        if (!track) return
        const rect = track.getBoundingClientRect()
        const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
        if (edge === 'start') {
          setTrimStart(Math.min(ratio, trimEndRef.current - TRIM_MIN_GAP))
        } else {
          setTrimEnd(Math.max(ratio, trimStartRef.current + TRIM_MIN_GAP))
        }
      }

      updateFromClientX(event.clientX)
      function handleMove(moveEvent: PointerEvent) {
        updateFromClientX(moveEvent.clientX)
      }
      function handleUp() {
        window.removeEventListener('pointermove', handleMove)
        window.removeEventListener('pointerup', handleUp)
      }
      window.addEventListener('pointermove', handleMove)
      window.addEventListener('pointerup', handleUp)
    }
  }

  return createPortal(
    <div className={`mv-sheet-overlay${visible ? ' mv-sheet-overlay--visible' : ''}`}>
      <div className="mv-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="mv-sheet mv-trim-sheet" role="dialog" aria-label="Trim Audio">
        <div className="mv-sheet__handle" aria-hidden="true" />
        <div className="mv-sheet__header">
          <button type="button" className="mv-sheet__close" onClick={onClose} aria-label="Close">
            <img src={icClose} alt="" className="mv-sheet__close-icon" />
          </button>
          <p className="mv-sheet__title">Trim Audio</p>
          <button type="button" className="mv-sheet__confirm" onClick={onConfirm} aria-label="Confirm">
            <img src={icCheck} alt="" className="mv-sheet__confirm-icon" />
          </button>
        </div>

        <div className="mv-trim-sheet__intro">
          <p className="mv-trim-sheet__title">Trim Audio</p>
          <p className="mv-trim-sheet__desc">Only trim the audio to the parts you like the best.</p>
        </div>

        <audio
          ref={audioRef}
          src={song.audio}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        />

        <div className="mv-trim-sheet__song">
          <button type="button" className="mv-trim-sheet__song-art" onClick={toggleSongPlay}>
            <img src={song.cover} alt="" />
            <span className="mv-trim-sheet__song-art-scrim" aria-hidden="true" />
            <span
              className="mv-trim-sheet__song-art-icon"
              style={maskStyle(playing ? icPause : icPlay)}
              aria-hidden="true"
            />
          </button>
          <div className="mv-trim-sheet__song-info">
            <p className="mv-trim-sheet__song-title">{song.title}</p>
            <p className="mv-trim-sheet__song-duration">{formatTime(duration)}</p>
          </div>
        </div>

        <div className="mv-trim-sheet__trimmer">
          <div className="mv-trim-sheet__time-row">
            <span>{formatTime(trimStart * duration)}</span>
            <span>{formatTime(trimEnd * duration)}</span>
          </div>
          <div className="mv-trim-sheet__waveform" ref={trackRef}>
            <div className="mv-trim-sheet__bars" aria-hidden="true">
              {TRIM_WAVEFORM_HEIGHTS.map((height, index) => (
                <span key={index} className="mv-trim-sheet__bar" style={{ height: `${height}px` }} />
              ))}
            </div>
            <div
              className="mv-trim-sheet__selection"
              style={{ left: `${trimStart * 100}%`, width: `${(trimEnd - trimStart) * 100}%` }}
              aria-hidden="true"
            />
            <button
              type="button"
              className="mv-trim-sheet__handle mv-trim-sheet__handle--start"
              style={{ left: `${trimStart * 100}%` }}
              onPointerDown={handleHandlePointerDown('start')}
              aria-label="Trim start"
            />
            <button
              type="button"
              className="mv-trim-sheet__handle mv-trim-sheet__handle--end"
              style={{ left: `${trimEnd * 100}%` }}
              onPointerDown={handleHandlePointerDown('end')}
              aria-label="Trim end"
            />
          </div>
        </div>

        <div className="mv-sheet__footer">
          <button type="button" className="mv-sheet__footer-btn mv-sheet__footer-btn--cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="mv-sheet__footer-btn mv-sheet__footer-btn--confirm" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

// Figma "How Would You Like to Create" (node 53:53) — mobile frame used
// directly; desktop has no frame of its own, so this reuses the same
// centered-dialog convention as the other sheets on this page.
interface ModeSheetProps {
  visible: boolean
  draftBase: Omit<MvDraft, 'resultVideo'>
  onClose: () => void
}

function ModeSheet({ visible, draftBase, onClose }: ModeSheetProps) {
  function pickMode() {
    const resultVideo = pickRandom(MUSIC_VIDEOS)
    saveMvDraft({
      ...draftBase,
      resultVideo: { title: resultVideo.title, cover: resultVideo.cover, video: resultVideo.video },
    })
  }

  function chooseStoryboard() {
    pickMode()
    window.location.href = '/mv-storyboard'
  }

  function chooseDirect() {
    // No processing/thinking screen for this path yet (see the note at the
    // top of this file) — goes straight to the same Result page the
    // Storyboard path ends up at.
    pickMode()
    window.location.href = '/mv-result'
  }

  return createPortal(
    <div className={`mv-sheet-overlay${visible ? ' mv-sheet-overlay--visible' : ''}`}>
      <div className="mv-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="mv-sheet mv-mode-sheet" role="dialog" aria-label="How would you like to create?">
        <div className="mv-sheet__handle" aria-hidden="true" />
        <div className="mv-sheet__header">
          <button type="button" className="mv-sheet__close" onClick={onClose} aria-label="Close">
            <img src={icClose} alt="" className="mv-sheet__close-icon" />
          </button>
        </div>

        <div className="mv-mode-sheet__intro">
          <p className="mv-mode-sheet__headline">How would you like to create?</p>
          <p className="mv-mode-sheet__sub">Choose your creative workflow. You can always adjust later.</p>
        </div>

        <button type="button" className="mv-mode-card mv-mode-card--featured" onClick={chooseStoryboard}>
          <div className="mv-mode-card__top">
            <span className="mv-mode-card__icon" style={maskStyle(icScript)} aria-hidden="true" />
            <span className="mv-mode-card__badge">Recommended</span>
          </div>
          <p className="mv-mode-card__title">Create Storyboard First</p>
          <p className="mv-mode-card__desc">Review scenes before rendering.</p>
          <div className="mv-mode-card__tags">
            <span className="mv-mode-card__tag">
              <img src={icClock} alt="" className="mv-mode-card__tag-icon" /> ~1 min
            </span>
            <span className="mv-mode-card__tag mv-mode-card__tag--credit">
              <img src={icCredit} alt="" className="mv-mode-card__tag-icon" /> 20 Credits
            </span>
          </div>
        </button>

        <button type="button" className="mv-mode-card" onClick={chooseDirect}>
          <div className="mv-mode-card__top">
            <span className="mv-mode-card__icon" style={maskStyle(icVideoAi)} aria-hidden="true" />
          </div>
          <p className="mv-mode-card__title">Create MV Directly</p>
          <p className="mv-mode-card__desc">Generate your MV instantly.</p>
          <div className="mv-mode-card__tags">
            <span className="mv-mode-card__tag">
              <img src={icClock} alt="" className="mv-mode-card__tag-icon" /> ~2 min
            </span>
            <span className="mv-mode-card__tag mv-mode-card__tag--credit">
              <img src={icCredit} alt="" className="mv-mode-card__tag-icon" /> 200 Credits
            </span>
          </div>
        </button>
      </div>
    </div>,
    document.body,
  )
}

interface FacePickerProps {
  open: boolean
  slot: number
  onClose: () => void
  onConfirm: (slot: number, faceIndex: number) => void
}

// Figma "Select a Face" processing / detected states (nodes 280:3091,
// 280:3131). Mobile uses the supplied bottom sheet; desktop adapts the same
// hierarchy into the project's established centered-dialog convention.
function FacePicker({ open, slot, onClose, onConfirm }: FacePickerProps) {
  const [analyzing, setAnalyzing] = useState(true)
  const [selectedFace, setSelectedFace] = useState(0)
  const transition = useMountTransition(open)

  useEffect(() => {
    if (!open) return
    setAnalyzing(true)
    setSelectedFace(0)
    const timer = window.setTimeout(() => setAnalyzing(false), 1400)
    return () => window.clearTimeout(timer)
  }, [open])

  if (!transition.shouldRender) return null

  return createPortal(
    <div className={`face-picker-overlay${transition.visible ? ' face-picker-overlay--visible' : ''}`}>
      <button type="button" className="face-picker__backdrop" onClick={onClose} aria-label="Close face selector" />
      <section className="face-picker" role="dialog" aria-modal="true" aria-labelledby="face-picker-title">
        <div className="face-picker__handle" aria-hidden="true" />
        <header className="face-picker__header">
          <button type="button" className="face-picker__icon-button" onClick={onClose} aria-label="Close">
            <span className="face-picker__icon" style={maskStyle(icClose)} aria-hidden="true" />
          </button>
          <div className="face-picker__heading">
            <h2 id="face-picker-title" className="face-picker__title">Select a Face</h2>
            <p className="face-picker__subtitle">{analyzing ? 'Analyzing photo…' : '4 faces detected. Tap to select'}</p>
          </div>
          <button
            type="button"
            className={`face-picker__icon-button face-picker__done${analyzing ? '' : ' face-picker__done--ready'}`}
            onClick={() => onConfirm(slot, selectedFace)}
            disabled={analyzing}
            aria-label="Use selected face"
          >
            <span className="face-picker__icon" style={maskStyle(icCheck)} aria-hidden="true" />
          </button>
        </header>

        <div className="face-picker__body">
          <div className="face-picker__preview">
            <img src={faceDetectionGroup} alt="Four friends at a skate park" />
            <span className={`face-picker__scan${analyzing ? ' face-picker__scan--active' : ''}`} aria-hidden="true" />
            {DETECTED_FACES.map((face, index) => (
              <span
                key={face.label}
                className={`face-picker__face-box${!analyzing ? ' face-picker__face-box--visible' : ''}${selectedFace === index ? ' face-picker__face-box--selected' : ''}`}
                style={face.box}
                aria-hidden="true"
              />
            ))}
          </div>

          <p className="face-picker__label">CHOOSE ONE FACE</p>
          <div className="face-picker__faces">
            {DETECTED_FACES.map((face, index) => (
              <button
                key={face.label}
                type="button"
                className={`face-picker__face${selectedFace === index ? ' face-picker__face--selected' : ''}`}
                onClick={() => setSelectedFace(index)}
                disabled={analyzing}
              >
                <span
                  className="face-picker__crop"
                  style={{ backgroundImage: `url("${faceDetectionGroup}")`, backgroundPosition: face.position }}
                  aria-hidden="true"
                />
                <span className="face-picker__face-label">{face.label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="face-picker__confirm"
            onClick={() => onConfirm(slot, selectedFace)}
            disabled={analyzing}
          >
            Use This Face
          </button>
        </div>
      </section>
    </div>,
    document.body,
  )
}

function MVCreatePage() {
  const { requireSignIn, isSignedIn } = useAuth()
  const [selectedStyle, setSelectedStyle] = useState(0)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  const [song, setSong] = useState<ChosenSong | null>(null)
  const [songSource, setSongSource] = useState<SongSource>(null)
  const [songPlaying, setSongPlaying] = useState(false)
  const [songCurrentTime, setSongCurrentTime] = useState(0)
  const [songDuration, setSongDuration] = useState(0)
  const songAudioRef = useRef<HTMLAudioElement>(null)

  const [ideaText, setIdeaText] = useState('')
  const { isEnhancing, enhance } = useEnhance()

  const [photos, setPhotos] = useState<(string | null)[]>([null, null])
  const [photoNames, setPhotoNames] = useState<string[]>(['', ''])
  const [editingPhotoSlot, setEditingPhotoSlot] = useState<number | null>(null)
  const [facePickerSlot, setFacePickerSlot] = useState<number | null>(null)
  const importAudioInputRef = useRef<HTMLInputElement>(null)

  const [aspect, setAspect] = useState<'9:16' | '16:9'>('9:16')
  const [quality, setQuality] = useState<'SD' | 'HD'>('SD')
  const [mvTitle, setMvTitle] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [showSubtitle, setShowSubtitle] = useState(true)
  const [showWatermark, setShowWatermark] = useState(false)

  const [songPickerOpen, setSongPickerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [modeSheetOpen, setModeSheetOpen] = useState(false)
  const [templateSheetOpen, setTemplateSheetOpen] = useState(false)
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(VIDEO_TEMPLATES[0].key)
  const [trimSong, setTrimSong] = useState<(typeof SONGS)[number] | null>(null)

  const songPickerTransition = useMountTransition(songPickerOpen)
  const trimTransition = useMountTransition(!!trimSong)
  const stableTrimSong = useLastValue(trimSong)
  const templateSheetTransition = useMountTransition(templateSheetOpen)
  const settingsTransition = useMountTransition(settingsOpen)
  const modeSheetTransition = useMountTransition(modeSheetOpen)

  const canCreate = song !== null && ideaText.trim().length > 0

  function handlePickLibrarySong(picked: (typeof SONGS)[number]) {
    setSong(songToChosen(picked))
    setSongSource('library')
    setSongCurrentTime(0)
    setSongDuration(0)
    setSongPickerOpen(false)
  }

  // Choose Song's "Use" doesn't commit the song directly — Figma routes it
  // through a Trim Audio step first (node 90:1452); only confirming there
  // actually picks the song.
  function handleUseSong(picked: (typeof SONGS)[number]) {
    setSongPickerOpen(false)
    setTrimSong(picked)
  }

  function confirmTrim() {
    if (trimSong) handlePickLibrarySong(trimSong)
    setTrimSong(null)
  }

  function applyTemplate() {
    const template = VIDEO_TEMPLATES.find((t) => t.key === selectedTemplateKey) ?? VIDEO_TEMPLATES[0]
    setIdeaText(template.description)
    setTemplateSheetOpen(false)
  }

  function handleImportAudioFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setSong({ title: file.name, cover: '', audio: URL.createObjectURL(file), duration: '' })
    setSongSource('import')
    setSongCurrentTime(0)
    setSongDuration(0)
    event.target.value = ''
  }

  function clearSong() {
    setSong(null)
    setSongSource(null)
    setSongPlaying(false)
    setSongCurrentTime(0)
    setSongDuration(0)
  }

  function toggleSongPlay() {
    const audio = songAudioRef.current
    if (!audio) return
    if (audio.paused) audio.play()
    else audio.pause()
  }

  function handleUseSamplePhoto(slot: number, sample: string) {
    setPhotos((current) => current.map((p, i) => (i === slot ? sample : p)))
    setPhotoNames((current) => current.map((n, i) => (i === slot ? '' : n)))
  }

  function removePhoto(slot: number) {
    setPhotos((current) => current.map((p, i) => (i === slot ? null : p)))
    setPhotoNames((current) => current.map((n, i) => (i === slot ? '' : n)))
    setEditingPhotoSlot((current) => (current === slot ? null : current))
  }

  function setPhotoNameAt(slot: number, value: string) {
    setPhotoNames((current) => current.map((n, i) => (i === slot ? value : n)))
  }

  function confirmDetectedFace(slot: number, faceIndex: number) {
    setPhotos((current) => current.map((photo, index) => (index === slot ? faceDetectionGroup : photo)))
    setPhotoNames((current) => current.map((name, index) => (index === slot ? `Face ${faceIndex + 1}` : name)))
    setFacePickerSlot(null)
  }

  // Default static — only the hovered (desktop) or actively-pressed (mobile,
  // no hover) style card's preview clip plays, one at a time.
  function playStyleVideo(index: number) {
    videoRefs.current.forEach((video, i) => {
      if (!video) return
      if (i === index) {
        video.currentTime = 0
        video.play().catch(() => {})
      } else if (!video.paused) {
        video.pause()
        video.currentTime = 0
      }
    })
  }

  function stopStyleVideo(index: number) {
    const video = videoRefs.current[index]
    if (!video) return
    video.pause()
    video.currentTime = 0
  }

  return (
    <AppLayout navbar={<RoomNavbar title="AI Music Video" credits={390} />}>
      <div className="mv-create">
        <div className="mv-create__panel">
          <div className="mv-create__section">
            <p className="mv-create__label">SELECT MV TYPE</p>
            <div className="mv-create__styles">
              {MV_STYLES.map((style, index) => (
                <button
                  key={style.key}
                  type="button"
                  className={`mv-create__style-card${index === selectedStyle ? ' mv-create__style-card--active' : ''}`}
                  onClick={() => setSelectedStyle(index)}
                  onMouseEnter={() => playStyleVideo(index)}
                  onMouseLeave={() => stopStyleVideo(index)}
                  onTouchStart={() => playStyleVideo(index)}
                  onTouchEnd={() => stopStyleVideo(index)}
                  onTouchCancel={() => stopStyleVideo(index)}
                >
                  <video
                    ref={(el) => {
                      videoRefs.current[index] = el
                    }}
                    className="mv-create__style-video"
                    src={style.video}
                    muted
                    loop
                    playsInline
                    preload="auto"
                    aria-hidden="true"
                  />
                  <div className="mv-create__style-scrim" aria-hidden="true" />
                  <p className="mv-create__style-name">{style.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mv-create__section">
            <p className="mv-create__label">
              CHOOSE A SONG <span className="mv-create__label-optional">(Required)</span>
            </p>

            {!song ? (
              <div className="mv-create__song-options">
                <button type="button" className="mv-create__song-option" onClick={() => setSongPickerOpen(true)}>
                  <img src={icSongList} alt="" className="mv-create__song-option-icon" />
                  <span>Song Library</span>
                </button>
                <button
                  type="button"
                  className="mv-create__song-option"
                  onClick={() => importAudioInputRef.current?.click()}
                >
                  <img src={icUpload} alt="" className="mv-create__song-option-icon" />
                  <span>Import Audio</span>
                </button>
              </div>
            ) : (
              <div className="mv-create__song-added">
                <div className="mv-create__song-added-header">
                  <button
                    type="button"
                    className="mv-create__song-added-label"
                    onClick={() => setSongPickerOpen(true)}
                  >
                    {songSource === 'import' ? 'Imported Audio' : 'Song Library'}
                  </button>
                  <button type="button" className="mv-create__song-clear" onClick={clearSong} aria-label="Remove song">
                    <span className="mv-create__song-clear-icon" style={maskStyle(icClose)} aria-hidden="true" />
                  </button>
                </div>
                <div className="mv-create__song-divider" />
                <div className="mv-create__song-row">
                  <audio
                    ref={songAudioRef}
                    src={song.audio}
                    onPlay={() => setSongPlaying(true)}
                    onPause={() => setSongPlaying(false)}
                    onTimeUpdate={(e) => setSongCurrentTime(e.currentTarget.currentTime)}
                    onLoadedMetadata={(e) => setSongDuration(e.currentTarget.duration)}
                  />
                  <button type="button" className="mv-create__song-art" onClick={toggleSongPlay}>
                    {song.cover && <img src={song.cover} alt="" />}
                    <span className="mv-create__song-art-scrim" aria-hidden="true" />
                    <span
                      className="mv-create__song-art-icon"
                      style={maskStyle(songPlaying ? icPause : icPlay)}
                      aria-hidden="true"
                    />
                  </button>
                  <div className="mv-create__song-info">
                    <p className="mv-create__song-title">{song.title}</p>
                    <p className="mv-create__song-duration">
                      {songPlaying ? (
                        <>
                          <span className="mv-create__song-duration-current">{formatTime(songCurrentTime)}</span>
                          <span> / {formatTime(songDuration)}</span>
                        </>
                      ) : (
                        formatTime(songDuration)
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="mv-create__song-edit"
                    onClick={() => setSongPickerOpen(true)}
                    aria-label="Change song"
                  >
                    <span className="mv-create__song-edit-icon" style={maskStyle(icEdit)} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mv-create__section">
            <p className="mv-create__label">
              DESCRIBE YOUR VIDEO IDEA <span className="mv-create__label-optional">(Required)</span>
            </p>
            <div className={`mv-create__input-box${isEnhancing('idea') ? ' mv-create__input-box--processing' : ''}`}>
              <textarea
                className="mv-create__textarea"
                placeholder="Describe your video to help AI create a more compelling story."
                maxLength={2500}
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                disabled={isEnhancing('idea')}
              />
              <div className="mv-create__input-footer">
                <div className="mv-create__input-actions">
                  <button
                    type="button"
                    className="mv-create__idea-btn"
                    onClick={() => setTemplateSheetOpen(true)}
                    disabled={isEnhancing('idea')}
                  >
                    <span className="mv-create__idea-icon" style={maskStyle(icVideo)} aria-hidden="true" />
                    Templates
                  </button>
                </div>
                <div className="mv-create__footer-right">
                  {ideaText.length > 0 && (
                    <button
                      type="button"
                      className="mv-create__enhance-btn"
                      onClick={() => enhance('idea', () => setIdeaText(pickRandom(ENHANCED_SUGGESTIONS)))}
                      disabled={isEnhancing('idea')}
                      aria-label="Enhance"
                    >
                      <span
                        className={`mv-create__enhance-icon${isEnhancing('idea') ? ' mv-create__enhance-icon--spinning' : ''}`}
                        style={maskStyle(isEnhancing('idea') ? icRefresh : icEditAi)}
                        aria-hidden="true"
                      />
                      Enhance
                    </button>
                  )}
                  <span className="mv-create__char-count">{ideaText.length}/2500</span>
                  {ideaText.length > 0 && (
                    <button
                      type="button"
                      className="mv-create__clear-btn"
                      onClick={() => setIdeaText('')}
                      disabled={isEnhancing('idea')}
                      aria-label="Clear"
                    >
                      <span className="mv-create__clear-icon" style={maskStyle(icClose)} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mv-create__section">
            <p className="mv-create__label">UPLOAD CHARACTER PHOTO</p>
            <div className="mv-create__photos">
              {[0, 1].map((slot) => (
                <div key={slot} className="mv-create__photo-slot">
                  {photos[slot] ? (
                    <div className="mv-create__photo-filled">
                      <img src={photos[slot] ?? undefined} alt="" className="mv-create__photo-preview" />
                      <div className="mv-create__photo-top">
                        <button
                          type="button"
                          className="mv-create__photo-circle-btn"
                          onClick={() => removePhoto(slot)}
                          aria-label="Remove photo"
                        >
                          <span className="mv-create__photo-circle-icon" style={maskStyle(icClose)} aria-hidden="true" />
                        </button>
                      </div>
                      <div className="mv-create__photo-bottom">
                        {editingPhotoSlot === slot ? (
                          <input
                            type="text"
                            className="mv-create__photo-name-input"
                            placeholder="Name"
                            value={photoNames[slot]}
                            autoFocus
                            onChange={(e) => setPhotoNameAt(slot, e.target.value)}
                            onBlur={() => setEditingPhotoSlot(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') setEditingPhotoSlot(null)
                            }}
                          />
                        ) : (
                          <p className="mv-create__photo-name">{photoNames[slot] || 'Name'}</p>
                        )}
                        <button
                          type="button"
                          className="mv-create__photo-circle-btn"
                          onClick={() => setEditingPhotoSlot(slot)}
                          aria-label="Edit name"
                        >
                          <span className="mv-create__photo-circle-icon" style={maskStyle(icEdit)} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={`mv-create__photo-add mv-create__photo-add--${slot === 0 ? 'primary' : 'tertiary'}`}
                      onClick={() => setFacePickerSlot(slot)}
                    >
                      <span className="mv-create__photo-add-circle">
                        <span className="mv-create__photo-add-icon" style={maskStyle(icAdd)} aria-hidden="true" />
                      </span>
                      <span className="mv-create__photo-add-text">
                        {slot === 0 ? '1st face photo' : '2nd face photo'}
                        <br />
                        <span className="mv-create__photo-add-optional">(Optional)</span>
                      </span>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="mv-create__sample-label">Sample Photos</p>
            <div className="mv-create__samples">
              {SAMPLE_PHOTOS.map((sample, index) => (
                <button
                  key={index}
                  type="button"
                  className="mv-create__sample"
                  onClick={() => handleUseSamplePhoto(photos[0] ? 1 : 0, sample)}
                >
                  <img src={sample} alt="" />
                </button>
              ))}
            </div>
          </div>

          <div className="mv-create__section">
            <p className="mv-create__label">SETTINGS</p>
            <button type="button" className="mv-create__settings" onClick={() => setSettingsOpen(true)}>
              <div className="mv-create__settings-chips">
                <span className="mv-create__settings-chip">{aspect}</span>
                <span className="mv-create__settings-chip">{quality}</span>
                <span className={`mv-create__settings-chip${mvTitle ? '' : ' mv-create__settings-chip--dim'}`}>Title</span>
                <span className={`mv-create__settings-chip${authorName ? '' : ' mv-create__settings-chip--dim'}`}>Author</span>
                <span className={`mv-create__settings-chip${showSubtitle ? '' : ' mv-create__settings-chip--dim'}`}>Subtitle</span>
                <span className={`mv-create__settings-chip${showWatermark ? '' : ' mv-create__settings-chip--dim'}`}>Watermark</span>
              </div>
              <span className="mv-create__settings-chevron" style={maskStyle(icChevronRight)} aria-hidden="true" />
            </button>
          </div>

          <FloatingCTA alignToParent>
            <button
              type="button"
              className={`mv-create__cta${canCreate ? ' mv-create__cta--active' : ''}`}
              disabled={!canCreate}
              onClick={() => requireSignIn(() => setModeSheetOpen(true))}
            >
              <span>Create Music Video</span>
              <span className="mv-create__cta-icon" style={maskStyle(icArrowRight)} aria-hidden="true" />
            </button>
          </FloatingCTA>
        </div>

        <div className="mv-create__side">
          <div className="mv-create__side-header">
            <p className="mv-create__side-title">{isSignedIn ? 'My Creations' : 'Trending MVs'}</p>
            {!isSignedIn && (
              <a href="/mv-detail?from=mv-create" className="mv-create__side-see-all">
                See all
                <span className="mv-create__side-see-all-icon" style={maskStyle(icChevronRight)} aria-hidden="true" />
              </a>
            )}
          </div>
          <div className="mv-create__side-list">
            {MY_CREATIONS.map((mv) => (
              <a key={mv.id} href={`/mv-detail?id=${mv.id}&from=mv-create`} className="mv-create__side-item">
                <ListItem
                  title={mv.title}
                  coverImage={mv.cover}
                  username={isSignedIn ? 'ScottWu' : mv.username}
                  plays={0}
                  likes={mv.likes}
                  shares={0}
                />
              </a>
            ))}
          </div>
        </div>
      </div>

      <input
        ref={importAudioInputRef}
        type="file"
        accept="audio/*"
        className="mv-create__file-input"
        onChange={handleImportAudioFile}
      />

      <FacePicker
        open={facePickerSlot !== null}
        slot={facePickerSlot ?? 0}
        onClose={() => setFacePickerSlot(null)}
        onConfirm={confirmDetectedFace}
      />

      {songPickerTransition.shouldRender && (
        <SongPickerSheet
          visible={songPickerTransition.visible}
          onPick={handleUseSong}
          onClose={() => setSongPickerOpen(false)}
        />
      )}

      {trimTransition.shouldRender && stableTrimSong && (
        <TrimAudioSheet
          visible={trimTransition.visible}
          song={stableTrimSong}
          onConfirm={confirmTrim}
          onClose={() => setTrimSong(null)}
        />
      )}

      {templateSheetTransition.shouldRender && (
        <TemplateSheet
          visible={templateSheetTransition.visible}
          selectedKey={selectedTemplateKey}
          onSelect={setSelectedTemplateKey}
          onApply={applyTemplate}
          onClose={() => setTemplateSheetOpen(false)}
        />
      )}

      {settingsTransition.shouldRender && (
        <SettingsSheet
          visible={settingsTransition.visible}
          aspect={aspect}
          onAspectChange={setAspect}
          quality={quality}
          onQualityChange={setQuality}
          mvTitle={mvTitle}
          onMvTitleChange={setMvTitle}
          author={authorName}
          onAuthorChange={setAuthorName}
          showSubtitle={showSubtitle}
          onShowSubtitleChange={setShowSubtitle}
          showWatermark={showWatermark}
          onShowWatermarkChange={setShowWatermark}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {modeSheetTransition.shouldRender && (
        <ModeSheet
          visible={modeSheetTransition.visible}
          draftBase={{
            songTitle: song?.title ?? 'Down the Memory Lane',
            songCover: song?.cover || MUSIC_VIDEOS[0]?.cover || '',
            mvTitle: mvTitle || 'Starlight In Your Eyes',
            authorName: authorName || 'Isabella Rose Thompson',
            mvType: MV_STYLES[selectedStyle].label,
            aspect,
            quality,
            showSubtitle,
            showWatermark,
            characterPhoto: sample1,
          }}
          onClose={() => setModeSheetOpen(false)}
        />
      )}
    </AppLayout>
  )
}

export default MVCreatePage
