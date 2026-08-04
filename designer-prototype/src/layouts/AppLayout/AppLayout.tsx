import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Sidebar from '../../components/Sidebar/Sidebar'
import Navbar from '../../components/Navbar/Navbar'
import Footer from '../../components/Footer/Footer'
import MobileHeader from '../../components/MobileHeader/MobileHeader'
import MobileTabBar from '../../components/MobileTabBar/MobileTabBar'
import { MOBILE_LAYOUT } from '../../config/layoutMode'
import bgAnimation01 from '../../assets/backgrounds/colorflow-animation-tmp.mp4?url'
import bgAnimation02 from '../../assets/backgrounds/colorflow-animation-01-tmp.mp4?url'
import bgAnimation03 from '../../assets/backgrounds/colorflow-animation-02.mov?url'
import bgAnimation04 from '../../assets/backgrounds/colorflow-animation-03-tmp.mp4?url'
import bgAnimation05 from '../../assets/backgrounds/colorflow-animation-04-tmp.mp4?url'
import './AppLayout.css'

// 5 looping background animations, rotated once a minute with a crossfade —
// same activeIndex/displayedIndex/isFading pattern as HeroBannerSection.
const BACKGROUND_VIDEOS = [bgAnimation01, bgAnimation02, bgAnimation03, bgAnimation04, bgAnimation05]
const BACKGROUND_ROTATE_MS = 60000
const BACKGROUND_FADE_MS = 800

interface AppLayoutProps {
  children: ReactNode
  /** Overrides the default marketing Navbar — e.g. DetailNavbar on detail pages. */
  navbar?: ReactNode
  /** The looping colorflow background is Home-only — every other page keeps
   *  a plain dark background instead. */
  showBackground?: boolean
  /** The marketing Footer only belongs on Home and Blog — every other page
   *  (create flows, detail pages, account, etc.) omits it. */
  showFooter?: boolean
  /** The app-mobile bottom tab bar only belongs on Home and History — every
   *  other page relies on its own top-of-page back button instead (see
   *  DetailNavbar/RoomNavbar's back arrow). */
  showMobileTabBar?: boolean
}

function AppLayout({
  children,
  navbar,
  showBackground = false,
  showFooter = false,
  showMobileTabBar = false,
}: AppLayoutProps) {
  const isMobileApp = MOBILE_LAYOUT === 'app'

  const [activeIndex, setActiveIndex] = useState(0)
  const [displayedIndex, setDisplayedIndex] = useState(0)
  const [isFading, setIsFading] = useState(false)
  const activeIndexRef = useRef(activeIndex)
  const fadeTimeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    activeIndexRef.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    if (!showBackground) return
    const timer = window.setInterval(() => {
      const next = (activeIndexRef.current + 1) % BACKGROUND_VIDEOS.length
      setActiveIndex(next)
      setIsFading(true)
      window.clearTimeout(fadeTimeoutRef.current)
      fadeTimeoutRef.current = window.setTimeout(() => {
        setDisplayedIndex(next)
        setIsFading(false)
      }, BACKGROUND_FADE_MS)
    }, BACKGROUND_ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [showBackground])

  useEffect(() => () => window.clearTimeout(fadeTimeoutRef.current), [])

  return (
    <div className={`app-layout${isMobileApp ? ' app-layout--mobile-app' : ''}`}>
      {/* Navbar sits transparently on top of this decorative looping background,
          which spans the full page width (including behind Sidebar's glass
          panel), but only the top ~80% of the height — the scrim below
          fades it into the page background instead of a hard cutoff.
          Hidden below the app-mobile breakpoint — see AppLayout.css.
          Home-only (showBackground) — every other page stays plain dark. */}
      {showBackground && (
        <>
          <video
            key={BACKGROUND_VIDEOS[displayedIndex]}
            className={`app-layout__background${isFading ? ' app-layout__background--fading' : ''}`}
            src={BACKGROUND_VIDEOS[displayedIndex]}
            autoPlay
            loop
            muted
            playsInline
            aria-hidden="true"
          />
          {/* Figma: 70% black fill over the video so it doesn't overpower the page;
              fades to the solid page background color further down. */}
          <div className="app-layout__background-scrim" aria-hidden="true" />
        </>
      )}

      {/* Sidebar/Navbar stay mounted as the desktop-sync mobile fallback —
          MOBILE_LAYOUT in layoutMode.ts decides which set of chrome is
          visible below the app-mobile breakpoint. */}
      <Sidebar />

      <div className="app-layout__main">
        {navbar ?? <Navbar />}
        {isMobileApp && <MobileHeader />}
        <main className="app-layout__content">{children}</main>
        {showFooter && <Footer />}
        {isMobileApp && showMobileTabBar && <MobileTabBar />}
      </div>
    </div>
  )
}

export default AppLayout
