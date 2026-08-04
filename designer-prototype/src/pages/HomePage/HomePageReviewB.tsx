import AppLayout from '../../layouts/AppLayout/AppLayout'
import ToolSelectorSectionAlt from './ToolSelectorSectionAlt'
import HeroBannerSection from './HeroBannerSection'
import NewMVsSection from './NewMVsSection'
import TopPicksSection from './TopPicksSection'
import NewSongsSection from './NewSongsSection'
import './HomePage.css'

// A/B review page (see CLAUDE.md's A/B convention) — same Home sections as
// HomePage, except the tool cards move above the Hero Banner and use
// ToolSelectorSectionAlt's bigger cards / "Create" hover CTA instead of
// ToolSelectorSection. Temporary: fold the winning version back into the
// real HomePage once picked, then delete this page.
function HomePageReviewB() {
  return (
    <AppLayout showBackground showFooter showMobileTabBar>
      <div className="home-page">
        <ToolSelectorSectionAlt />
        <HeroBannerSection />
        <NewMVsSection />
        <TopPicksSection />
        <NewSongsSection />
      </div>
    </AppLayout>
  )
}

export default HomePageReviewB
