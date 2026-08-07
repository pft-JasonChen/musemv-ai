import { useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import icCompass from '../../assets/icons/ic_compass_OL.svg'
import icHistory from '../../assets/icons/ic_history_OL.svg'
import icAdd from '../../assets/icons/ic_add.svg'
import icVideoAi from '../../assets/icons/ic_video_ai.svg'
import icSongAi from '../../assets/icons/ic_song_ai.svg'
import icChevronRight from '../../assets/icons/ic_chevron-right.svg'
import './MobileTabBar.css'

// Figma "Bar/TabBar" (node 369:7574), from the manager's app design — only
// shown below the app-mobile breakpoint, see AppLayout + layoutMode.ts.
//
// Only Explore/Create/History exist in this reference. Sidebar's other nav
// items (AI Music Video, AI Song, AI Storybook, Blog) have no place here yet
// — this is a known gap, not a decision, flagged for follow-up.

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function MobileTabBar() {
  const [createOpen, setCreateOpen] = useState(false)
  const isHistory = window.location.pathname.startsWith('/history')

  return (
    <>
      <nav className="mobile-tabbar">
        <a href="/home" className={`mobile-tabbar__item${!isHistory ? ' mobile-tabbar__item--active' : ''}`}>
          <span className="mobile-tabbar__icon" style={maskStyle(icCompass)} aria-hidden="true" />
          <span className="mobile-tabbar__label">Explore</span>
        </a>

        <button
          type="button"
          className="mobile-tabbar__create"
          onClick={() => setCreateOpen(true)}
          aria-label="Create"
        >
          <span className="mobile-tabbar__create-icon" style={maskStyle(icAdd)} aria-hidden="true" />
        </button>

        <a href="/history" className={`mobile-tabbar__item${isHistory ? ' mobile-tabbar__item--active' : ''}`}>
          <span className="mobile-tabbar__icon" style={maskStyle(icHistory)} aria-hidden="true" />
          <span className="mobile-tabbar__label">History</span>
        </a>
      </nav>

      {/* Figma "Explore — Create Sheet" (node 172:1878) — tapping the "+"
          tab opens this to choose which creator to jump into. */}
      {createOpen &&
        createPortal(
          <div className="mobile-tabbar-sheet-overlay" onClick={() => setCreateOpen(false)}>
            <div className="mobile-tabbar-sheet" role="dialog" aria-label="What would you like to create?">
              <div className="mobile-tabbar-sheet__handle" aria-hidden="true" />
              <p className="mobile-tabbar-sheet__title">What would you like to create?</p>

              <a href="/mv-create" className="mobile-tabbar-sheet__option">
                <span className="mobile-tabbar-sheet__badge mobile-tabbar-sheet__badge--mv">
                  <span className="mobile-tabbar-sheet__badge-icon" style={maskStyle(icVideoAi)} aria-hidden="true" />
                </span>
                <span className="mobile-tabbar-sheet__option-info">
                  <span className="mobile-tabbar-sheet__option-title">AI Music Video</span>
                  <span className="mobile-tabbar-sheet__option-subtitle">Selfie + music → cinematic MV</span>
                </span>
                <span className="mobile-tabbar-sheet__chevron" style={maskStyle(icChevronRight)} aria-hidden="true" />
              </a>

              <a href="/song-create" className="mobile-tabbar-sheet__option">
                <span className="mobile-tabbar-sheet__badge mobile-tabbar-sheet__badge--song">
                  <span className="mobile-tabbar-sheet__badge-icon" style={maskStyle(icSongAi)} aria-hidden="true" />
                </span>
                <span className="mobile-tabbar-sheet__option-info">
                  <span className="mobile-tabbar-sheet__option-title">AI Song</span>
                  <span className="mobile-tabbar-sheet__option-subtitle">Lyrics + style → original track</span>
                </span>
                <span className="mobile-tabbar-sheet__chevron" style={maskStyle(icChevronRight)} aria-hidden="true" />
              </a>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

export default MobileTabBar
