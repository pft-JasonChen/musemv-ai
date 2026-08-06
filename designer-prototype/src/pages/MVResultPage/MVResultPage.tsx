import { useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import AppLayout from '../../layouts/AppLayout/AppLayout'
import DetailNavbar from '../../components/DetailNavbar/DetailNavbar'
import ShareDialog, { shareOrOpenDialog } from '../../components/ShareDialog/ShareDialog'
import ToggleSwitch from '../../components/ToggleSwitch/ToggleSwitch'
import PublishDialog from '../../components/PublishDialog/PublishDialog'
import Toast from '../../components/Toast/Toast'
import { useAuth } from '../../components/AuthProvider/AuthProvider'
import { loadMvDraft } from '../../data/mvDraft'
import icDownload from '../../assets/icons/ic_download.svg'
import icShare from '../../assets/icons/ic_share.svg'
import icEdit from '../../assets/icons/ic_edit.svg'
import icVideoAi from '../../assets/icons/ic_video_ai.svg'
import icLikeOff from '../../assets/icons/ic_like_off.svg'
import icLikeOn from '../../assets/icons/ic_like_on.svg'
import icDislikeOff from '../../assets/icons/ic_dislike_off.svg'
import icDislikeOn from '../../assets/icons/ic_dislike_on.svg'
import icPublish from '../../assets/icons/ic_publish.svg'
import icPlay from '../../assets/icons/ic_play.svg'
import icPause from '../../assets/icons/ic_pause.svg'
import icExpand from '../../assets/icons/ic_expand.svg'
import './MVResultPage.css'

// Figma "MV Result_L" — portrait (node 1614:75834) and landscape (node
// 1605:73247) are the SAME frame, just with the aspect-ratio setting
// switched; that's exactly how this component picks a layout too, off
// draft.aspect saved by MVCreatePage rather than two separate components.
// "2026-06-06" and the Detail values are Figma's own mock content; the
// video itself reuses the MUSIC_VIDEOS entry picked in the mode-choice
// sheet (see src/data/mvDraft.ts), same convention as Song Create's result.

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function formatDate(): string {
  // Fixed mock date matching Figma rather than "today", since there's no
  // real creation timestamp to draw from.
  return '2026-06-06'
}

function MVResultPage() {
  const { requireSignIn } = useAuth()
  const draft = loadMvDraft()
  const isPortrait = draft.aspect === '9:16'

  const videoRef = useRef<HTMLVideoElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(true)
  const [liked, setLiked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const [publish, setPublish] = useState(false)
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [shareOpen, setShareOpen] = useState(false)

  // MV publish always confirms first (Figma "Ready to Go Public?") — unlike
  // Song, which just toasts (see SongCreatePage/CommunityProfilePage).
  function handlePublishToggle(next: boolean) {
    if (next) {
      setPublishDialogOpen(true)
      return
    }
    setPublish(false)
    setToastMessage('Unpublished success')
  }

  function confirmPublish() {
    setPublish(true)
    setPublishDialogOpen(false)
    setToastMessage('Published success')
  }

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play()
    else video.pause()
  }

  function seekFromClientX(clientX: number) {
    const track = progressRef.current
    const video = videoRef.current
    if (!track || !video || !video.duration) return
    const rect = track.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    video.currentTime = ratio * video.duration
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

  function toggleFullscreen() {
    containerRef.current?.requestFullscreen?.().catch(() => {})
  }

  const progressRatio = duration ? currentTime / duration : 0
  const fromHistory = new URLSearchParams(window.location.search).get('from') === 'history'
  const backHref = fromHistory ? '/history' : '/mv-create'
  const editHref = fromHistory ? '/mv-edit?from=history' : '/mv-edit'

  return (
    <AppLayout navbar={<DetailNavbar title="Result" credits={390} backHref={backHref} />}>
      <div className="mv-result">
        <div className="mv-result__panel">
          <div
            ref={containerRef}
            className={`mv-result__player${isPortrait ? ' mv-result__player--portrait' : ' mv-result__player--landscape'}`}
          >
            {isPortrait && (
              <>
                <img src={draft.resultVideo.cover} alt="" className="mv-result__bg" aria-hidden="true" />
                <div className="mv-result__bg-overlay" aria-hidden="true" />
              </>
            )}

            <video
              ref={videoRef}
              className="mv-result__video"
              src={draft.resultVideo.video}
              poster={draft.resultVideo.cover}
              autoPlay
              loop
              muted
              playsInline
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onClick={togglePlay}
            />

            <div className="mv-result__controls">
              <button type="button" className="mv-result__control-btn" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
                <span className="mv-result__control-icon" style={maskStyle(playing ? icPause : icPlay)} aria-hidden="true" />
              </button>
              <span className="mv-result__time">{formatTime(currentTime)}</span>
              <div className="mv-result__progress" ref={progressRef} onPointerDown={handleProgressPointerDown}>
                <div className="mv-result__progress-track" />
                <div className="mv-result__progress-fill" style={{ width: `${progressRatio * 100}%` }} />
                <div className="mv-result__progress-thumb" style={{ left: `${progressRatio * 100}%` }} />
              </div>
              <span className="mv-result__time">{formatTime(duration)}</span>
              <button type="button" className="mv-result__control-btn" onClick={toggleFullscreen} aria-label="Fullscreen">
                <span className="mv-result__control-icon" style={maskStyle(icExpand)} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="mv-result__side">
          <div className="mv-result__title-row">
            <div className="mv-result__title-group">
              <p className="mv-result__title">{draft.mvTitle}</p>
              <p className="mv-result__date">{formatDate()}</p>
            </div>
            <div className="mv-result__reactions">
              <button
                type="button"
                className={`mv-result__icon-btn${liked ? ' mv-result__icon-btn--selected' : ''}`}
                onClick={() => {
                  setLiked((current) => !current)
                  setDisliked(false)
                }}
                aria-label={liked ? 'Unlike' : 'Like'}
                aria-pressed={liked}
              >
                <span
                  className="mv-result__reaction-icon"
                  style={maskStyle(liked ? icLikeOn : icLikeOff)}
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                className={`mv-result__icon-btn${disliked ? ' mv-result__icon-btn--selected' : ''}`}
                onClick={() => {
                  setDisliked((current) => !current)
                  setLiked(false)
                }}
                aria-label={disliked ? 'Remove dislike' : 'Dislike'}
                aria-pressed={disliked}
              >
                <span
                  className="mv-result__reaction-icon"
                  style={maskStyle(disliked ? icDislikeOn : icDislikeOff)}
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>

          <div className="mv-result__section">
            <p className="mv-result__label">QUICK ACTIONS</p>
            <div className="mv-result__actions">
              <div className="mv-result__actions-row">
                <a href={draft.resultVideo.video} download className="mv-result__action">
                  <img src={icDownload} alt="" />
                  Download
                </a>
                <button type="button" className="mv-result__action" onClick={() => shareOrOpenDialog(draft.mvTitle, () => setShareOpen(true))}>
                  <img src={icShare} alt="" />
                  Share
                </button>
              </div>
              <div className="mv-result__actions-row">
                <a href={editHref} className="mv-result__action">
                  <img src={icEdit} alt="" />
                  Edit MV
                </a>
                <button
                  type="button"
                  className="mv-result__action"
                  onClick={() => requireSignIn(() => { window.location.href = '/mv-create' })}
                >
                  <img src={icVideoAi} alt="" />
                  Recreate
                </button>
              </div>
            </div>

            <div className="mv-result__publish">
              <span className="mv-result__publish-icon" style={maskStyle(icPublish)} aria-hidden="true" />
              <div className="mv-result__publish-text">
                <p className="mv-result__publish-title">Publish</p>
                <p className="mv-result__publish-state">{publish ? 'On' : 'Off'}</p>
              </div>
              <ToggleSwitch checked={publish} onChange={handlePublishToggle} />
            </div>
          </div>

          <div className="mv-result__section">
            <p className="mv-result__label">DETAIL</p>
            <div className="mv-result__divider" />
            <div className="mv-result__detail-row">
              <span className="mv-result__detail-key">Author</span>
              <span className="mv-result__detail-value">{draft.authorName}</span>
            </div>
            <div className="mv-result__divider" />
            <div className="mv-result__detail-row">
              <span className="mv-result__detail-key">MV Type</span>
              <span className="mv-result__detail-value">{draft.mvType}</span>
            </div>
            <div className="mv-result__divider" />
            <div className="mv-result__detail-row">
              <span className="mv-result__detail-key">Aspect Ratio</span>
              <span className="mv-result__detail-value">{draft.aspect}</span>
            </div>
            <div className="mv-result__divider" />
            <div className="mv-result__detail-row">
              <span className="mv-result__detail-key">Quality</span>
              <span className="mv-result__detail-value">{draft.quality === 'SD' ? 'Standard' : 'High'}</span>
            </div>
            <div className="mv-result__divider" />
            <div className="mv-result__detail-row">
              <span className="mv-result__detail-key">Subtitle</span>
              <span className="mv-result__detail-value">{draft.showSubtitle ? 'On' : 'Off'}</span>
            </div>
            <div className="mv-result__divider" />
            <div className="mv-result__detail-row">
              <span className="mv-result__detail-key">Watermark</span>
              <span className="mv-result__detail-value">{draft.showWatermark ? 'On' : 'Off'}</span>
            </div>
          </div>
        </div>
      </div>

      <ShareDialog title={draft.mvTitle} isOpen={shareOpen} onClose={() => setShareOpen(false)} />
      <PublishDialog
        isOpen={publishDialogOpen}
        onCancel={() => setPublishDialogOpen(false)}
        onConfirm={confirmPublish}
      />
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </AppLayout>
  )
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default MVResultPage
