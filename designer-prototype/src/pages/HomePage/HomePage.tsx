import AppLayout from '../../layouts/AppLayout/AppLayout'
import HeroBannerSection from './HeroBannerSection'
import ToolSelectorSection from './ToolSelectorSection'
import NewMVsSection from './NewMVsSection'
import TopPicksSection from './TopPicksSection'
import NewSongsSection from './NewSongsSection'
import './HomePage.css'

function HomePage() {
  return (
    <AppLayout showBackground showFooter showMobileTabBar>
      <div className="home-page">
        <HeroBannerSection />
        <ToolSelectorSection />
        <NewMVsSection />
        <TopPicksSection />
        <NewSongsSection />
      </div>
    </AppLayout>
  )
}

export default HomePage
