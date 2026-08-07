import { useEffect, useState } from 'react'
import AppLayout from '../../layouts/AppLayout/AppLayout'
import HeroBannerSection from './HeroBannerSection'
import ToolSelectorSection from './ToolSelectorSection'
import ToolSelectorSectionV3 from './ToolSelectorSectionV3'
import HeroBannerSectionV3 from './HeroBannerSectionV3'
import NewMVsSection from './NewMVsSection'
import TopPicksSection from './TopPicksSection'
import NewSongsSection from './NewSongsSection'
import './HomePage.css'

const MOBILE_QUERY = '(max-width: 767px)'

function HomePage() {
  // Product owner picked the review-c tool-selector/hero treatment for
  // desktop (ToolSelectorSectionV3 + HeroBannerSectionV3). Mobile keeps the
  // original Hero/ToolSelector design regardless of which desktop review
  // won — mobile was already finalized separately and never had its own
  // review-b/c treatment. Same isMobile-branch technique already used by
  // MVDetailPage's MvGrid for a structurally different (not just
  // CSS-hidden) mobile render.
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_QUERY).matches : false,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_QUERY)
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <AppLayout showBackground showFooter showMobileTabBar>
      <div className="home-page">
        {isMobile ? (
          <>
            <HeroBannerSection />
            <ToolSelectorSection />
          </>
        ) : (
          <>
            <ToolSelectorSectionV3 />
            <HeroBannerSectionV3 />
          </>
        )}
        <NewMVsSection />
        <TopPicksSection />
        <NewSongsSection />
      </div>
    </AppLayout>
  )
}

export default HomePage
