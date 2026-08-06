import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import AppLayout from '../../layouts/AppLayout/AppLayout'
import DetailNavbar from '../../components/DetailNavbar/DetailNavbar'
import FloatingCTA from '../../components/FloatingCTA/FloatingCTA'
import { useAuth } from '../../components/AuthProvider/AuthProvider'
import { loadMvDraft, MOCK_LYRICS, MOCK_SCENES, MOCK_STORY, MOCK_VISUAL_STYLE } from '../../data/mvDraft'
import { SONGS } from '../../data/songs'
import icEditAi from '../../assets/icons/ic_edit_ai.svg'
import icRefresh from '../../assets/icons/ic_refresh.svg'
import icChevronRight from '../../assets/icons/ic_chevron-right.svg'
import { useEnhance } from '../../hooks/useEnhance'
import icExpand from '../../assets/icons/ic_expand.svg'
import icPlay from '../../assets/icons/ic_play.svg'
import icPause from '../../assets/icons/ic_pause.svg'
import icArrowRight from '../../assets/icons/ic_arrow_right.svg'
import icScript from '../../assets/icons/ic_script.svg'
import icClose from '../../assets/icons/ic_close.svg'
import icDownload from '../../assets/icons/ic_download.svg'
import storyboardClip1 from '../../assets/covers/storyboard-clips/clip_1.jpg'
import './MVStoryboardPage.css'

// Figma "Edit Storyboard_L" (node 1344:26880). Flow/behavior reference is
// muse-prototype-v1.html's #screen-mv-storyboard — no real AI/API call, per
// project scope. Character image/song/lyrics come from the draft saved by
// MVCreatePage's mode-choice sheet (see src/data/mvDraft.ts); the 4 scenes
// and lyrics themselves are fixed mock content (Figma's own "Starlight In
// Your Eyes" mock), not derived from what the user actually typed.
//
// Visual Style and the 4 Scene cards use the same editable Input Box with
// char count + Enhance pattern; Story remains a plain read-only summary.

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

const STORYBOARD_PROCESSING_DURATION_MS = 3000

// Figma "Create Storyboard — Processing" (node 48:93), mobile design used
// directly; desktop reuses Song Create's Processing pattern (SongCreatePage
// .song-processing) of keeping this exact centered column and simply
// letting the page's two-column shell collapse to one full-width column
// while it's showing (see `.mv-storyboard--processing` in the stylesheet),
// rather than redesigning it into a side-by-side layout.
function MVStoryboardProcessing({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const timer = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / STORYBOARD_PROCESSING_DURATION_MS) * 100)
      setProgress(pct)
      if (pct >= 100) {
        window.clearInterval(timer)
        onComplete()
      }
    }, 100)
    return () => window.clearInterval(timer)
  }, [onComplete])

  return (
    <div className="mv-storyboard-processing">
      <div className="mv-storyboard-processing__card">
        <span className="mv-storyboard-processing__icon" style={maskStyle(icScript)} aria-hidden="true" />
        <p className="mv-storyboard-processing__percent">{Math.round(progress)}%</p>
        <p className="mv-storyboard-processing__caption">Finalizing storyboard...</p>
      </div>

      <div className="mv-storyboard-processing__message">
        <p className="mv-storyboard-processing__title">Crafting Your Storyboard</p>
        <p className="mv-storyboard-processing__subtitle">
          AI is analyzing your audio and description to build the perfect cinematic sequence.
        </p>
      </div>

      <div className="mv-storyboard-processing__progress">
        <div className="mv-storyboard-processing__progress-track">
          <div className="mv-storyboard-processing__progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="mv-storyboard-processing__eta-label">Estimated time remaining</p>
        <p className="mv-storyboard-processing__eta-value">~1 minute</p>
      </div>

      <a href="/history" className="mv-storyboard-processing__view-later">
        View Later
      </a>
    </div>
  )
}

function MVStoryboardPage() {
  const { requireSignIn } = useAuth()
  const draft = loadMvDraft()
  const requestedStage = new URLSearchParams(window.location.search).get('stage')
  const [stage, setStage] = useState<'processing' | 'edit'>(requestedStage === 'edit' ? 'edit' : 'processing')
  // Imported-audio titles won't have a matching catalog entry — fall back
  // to the first song rather than leaving the preview silent.
  const songAudio = SONGS.find((song) => song.title === draft.songTitle)?.audio ?? SONGS[0]?.audio

  const [visualStyle, setVisualStyle] = useState(MOCK_VISUAL_STYLE)
  const [scenes, setScenes] = useState(MOCK_SCENES.map((scene) => scene.text))
  const { isEnhancing, enhance } = useEnhance()
  const [storylineExpanded, setStorylineExpanded] = useState(true)
  const [songPlaying, setSongPlaying] = useState(false)
  const [songCurrentTime, setSongCurrentTime] = useState(0)
  const [songDuration, setSongDuration] = useState(0)
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const songAudioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (!imagePreviewOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setImagePreviewOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [imagePreviewOpen])

  function updateScene(index: number, value: string) {
    setScenes((current) => current.map((text, i) => (i === index ? value : text)))
  }

  function toggleSongPlay() {
    const audio = songAudioRef.current
    if (!audio) return
    if (audio.paused) audio.play()
    else audio.pause()
  }

  const fromHistory = new URLSearchParams(window.location.search).get('from') === 'history'
  const backHref = fromHistory ? '/history' : '/mv-create'
  const resultHref = fromHistory ? '/mv-result?from=history' : '/mv-result'

  return (
    <AppLayout navbar={<DetailNavbar title="Edit Storyboard" credits={390} backHref={backHref} />}>
      <div className={`mv-storyboard${stage === 'processing' ? ' mv-storyboard--processing' : ''}`}>
        {stage === 'processing' ? (
          <MVStoryboardProcessing onComplete={() => setStage('edit')} />
        ) : (
          <>
        <div className="mv-storyboard__panel">
          <div className="mv-storyboard__section mv-storyboard__section--visual-style">
            <p className="mv-storyboard__label">VISUAL STYLE</p>
            <div
              className={`mv-storyboard__input-box${isEnhancing('visual-style') ? ' mv-storyboard__input-box--processing' : ''}`}
            >
              <textarea
                className="mv-storyboard__textarea"
                maxLength={2500}
                value={visualStyle}
                onChange={(e) => setVisualStyle(e.target.value)}
                disabled={isEnhancing('visual-style')}
              />
              <div className="mv-storyboard__input-footer">
                <button
                  type="button"
                  className="mv-storyboard__enhance-btn"
                  onClick={() =>
                    enhance('visual-style', () =>
                      setVisualStyle(`${visualStyle} Refined with cinematic lighting and cohesive visual details.`),
                    )
                  }
                  disabled={isEnhancing('visual-style')}
                  aria-label="Enhance"
                >
                  <span
                    className={`mv-storyboard__enhance-icon${isEnhancing('visual-style') ? ' mv-storyboard__enhance-icon--spinning' : ''}`}
                    style={maskStyle(isEnhancing('visual-style') ? icRefresh : icEditAi)}
                    aria-hidden="true"
                  />
                  Enhance
                </button>
                <span className="mv-storyboard__char-count">{visualStyle.length}/2500</span>
              </div>
            </div>
          </div>

          <div className="mv-storyboard__section mv-storyboard__section--story">
            <p className="mv-storyboard__label">STORY</p>
            <div className="mv-storyboard__display-card mv-storyboard__display-card--flat">
              <p className="mv-storyboard__display-text mv-storyboard__display-text--muted">{MOCK_STORY}</p>
            </div>
          </div>

          <div className="mv-storyboard__section mv-storyboard__section--story-line">
            <button
              type="button"
              className="mv-storyboard__storyline-header"
              onClick={() => setStorylineExpanded((current) => !current)}
            >
              <p className="mv-storyboard__label">STORY LINE</p>
              <span
                className={`mv-storyboard__storyline-chevron${storylineExpanded ? ' mv-storyboard__storyline-chevron--open' : ''}`}
                style={maskStyle(icChevronRight)}
                aria-hidden="true"
              />
            </button>

            {storylineExpanded && (
              <div className="mv-storyboard__scenes">
                {MOCK_SCENES.map((scene, index) => (
                  <div key={scene.title} className="mv-storyboard__scene">
                    <div className="mv-storyboard__scene-header">
                      <p className="mv-storyboard__scene-title">{scene.title}</p>
                      <p className="mv-storyboard__scene-time">{scene.timestamp}</p>
                    </div>
                    <div
                      className={`mv-storyboard__input-box${isEnhancing(`scene-${index}`) ? ' mv-storyboard__input-box--processing' : ''}`}
                    >
                      <textarea
                        className="mv-storyboard__textarea"
                        maxLength={2500}
                        value={scenes[index]}
                        onChange={(e) => updateScene(index, e.target.value)}
                        disabled={isEnhancing(`scene-${index}`)}
                      />
                      <div className="mv-storyboard__input-footer">
                        <button
                          type="button"
                          className="mv-storyboard__enhance-btn"
                          onClick={() =>
                            enhance(`scene-${index}`, () =>
                              updateScene(index, `${scenes[index]} The light catches every detail.`),
                            )
                          }
                          disabled={isEnhancing(`scene-${index}`)}
                          aria-label="Enhance"
                        >
                          <span
                            className={`mv-storyboard__enhance-icon${isEnhancing(`scene-${index}`) ? ' mv-storyboard__enhance-icon--spinning' : ''}`}
                            style={maskStyle(isEnhancing(`scene-${index}`) ? icRefresh : icEditAi)}
                            aria-hidden="true"
                          />
                          Enhance
                        </button>
                        <span className="mv-storyboard__char-count">{scenes[index].length}/2500</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <FloatingCTA alignToParent>
            <button
              type="button"
              className="mv-storyboard__cta"
              onClick={() => requireSignIn(() => {
                window.location.href = resultHref
              })}
            >
              <span>Create MV</span>
              <span className="mv-storyboard__cta-icon" style={maskStyle(icArrowRight)} aria-hidden="true" />
            </button>
          </FloatingCTA>
        </div>

        <div className="mv-storyboard__side">
          <div className="mv-storyboard__section mv-storyboard__section--char-image">
            <p className="mv-storyboard__label">CHARACTER IMAGE</p>
            <div className="mv-storyboard__char-image">
              <img src={storyboardClip1} alt="Storyboard character" className="mv-storyboard__char-photo" />
              <a
                href={storyboardClip1}
                download="clip_1.jpg"
                className="mv-storyboard__char-download"
                aria-label="Download character image"
              >
                <img src={icDownload} alt="" />
              </a>
              <button
                type="button"
                className="mv-storyboard__char-expand"
                onClick={() => setImagePreviewOpen(true)}
                aria-label="Expand character image"
              >
                <img src={icExpand} alt="" />
              </button>
            </div>
          </div>

          <div className="mv-storyboard__section mv-storyboard__section--mv-song">
            <p className="mv-storyboard__label">MV SONG</p>
            <div className="mv-storyboard__song">
              <audio
                ref={songAudioRef}
                src={songAudio}
                onPlay={() => setSongPlaying(true)}
                onPause={() => setSongPlaying(false)}
                onLoadedMetadata={(event) => setSongDuration(event.currentTarget.duration)}
                onDurationChange={(event) => setSongDuration(event.currentTarget.duration)}
                onTimeUpdate={(event) => setSongCurrentTime(event.currentTarget.currentTime)}
                onEnded={() => {
                  setSongPlaying(false)
                  setSongCurrentTime(0)
                }}
              />
              <button type="button" className="mv-storyboard__song-art" onClick={toggleSongPlay}>
                <img src={draft.songCover} alt="" />
                <span className="mv-storyboard__song-art-scrim" aria-hidden="true" />
                <span
                  className="mv-storyboard__song-art-icon"
                  style={maskStyle(songPlaying ? icPause : icPlay)}
                  aria-hidden="true"
                />
              </button>
              <div className="mv-storyboard__song-info">
                <p className="mv-storyboard__song-title">{draft.songTitle}</p>
                <p className="mv-storyboard__song-duration">
                  {songPlaying ? (
                    <>
                      <span className="mv-storyboard__song-current-time">{formatTime(songCurrentTime)}</span>
                      <span>{` / ${formatTime(songDuration)}`}</span>
                    </>
                  ) : (
                    formatTime(songDuration)
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="mv-storyboard__section mv-storyboard__section--lyrics">
            <p className="mv-storyboard__label">LYRICS</p>
            <div className="mv-storyboard__lyrics">
              {MOCK_LYRICS.map((line) => (
                <div key={line.time} className="mv-storyboard__lyrics-line">
                  <span className="mv-storyboard__lyrics-time">{line.time}</span>
                  <span className="mv-storyboard__lyrics-text">{line.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {imagePreviewOpen && (
        <div
          className="mv-storyboard__image-preview-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Character image preview"
          onClick={() => setImagePreviewOpen(false)}
        >
          <div className="mv-storyboard__image-preview" onClick={(event) => event.stopPropagation()}>
            <img src={storyboardClip1} alt="Storyboard character enlarged" />
            <button
              type="button"
              className="mv-storyboard__image-preview-close"
              onClick={() => setImagePreviewOpen(false)}
              aria-label="Close image preview"
            >
              <img src={icClose} alt="" />
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

export default MVStoryboardPage
