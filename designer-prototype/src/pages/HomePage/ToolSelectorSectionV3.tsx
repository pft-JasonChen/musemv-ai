import icVideoAi from '../../assets/icons/ic_video_ai.svg'
import icSongAi from '../../assets/icons/ic_song_ai.svg'
// import icStoryAi from '../../assets/icons/ic_story_ai.svg' // re-enable with the AI Storybooks card below
import './ToolSelectorSectionV3.css'

function maskStyle(src: string) {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

// Real Home desktop Tool Selector (product owner picked this review-c
// treatment over the original and review-b) — Figma "Tool Selector Section"
// (node 1875:34099): a big heading above 3 cards (adds AI Storybooks next
// to Music Video/Song), sitting above the Hero Banner. Desktop-only —
// HomePage.tsx renders the original ToolSelectorSection on mobile instead,
// see that file for why. See ToolSelectorSectionV3.css for why the hover
// treatment doesn't grow the card (Figma's own "Active" variants do, but
// that was confirmed not to be the intended behavior).
function ToolSelectorSectionV3() {
  return (
    <section className="tool-selector-v3">
      <h1 className="tool-selector-v3__heading">What would you like to create today?</h1>

      <div className="tool-selector-v3__row">
        <a href="/mv-create" className="tool-selector-v3__card tool-selector-v3__card--mv">
          <div className="tool-selector-v3__icon-badge tool-selector-v3__icon-badge--mv">
            <span className="tool-selector-v3__icon" style={maskStyle(icVideoAi)} aria-hidden="true" />
          </div>
          <div className="tool-selector-v3__text">
            <p className="tool-selector-v3__title">AI Music Video</p>
            <p className="tool-selector-v3__description">Upload a selfie and let AI create your music video.</p>
          </div>
        </a>

        <a href="/song-create" className="tool-selector-v3__card tool-selector-v3__card--song">
          <div className="tool-selector-v3__icon-badge tool-selector-v3__icon-badge--song">
            <span className="tool-selector-v3__icon" style={maskStyle(icSongAi)} aria-hidden="true" />
          </div>
          <div className="tool-selector-v3__text">
            <p className="tool-selector-v3__title">AI Song</p>
            <p className="tool-selector-v3__description">Write your lyrics or idea and let AI create the song.</p>
          </div>
        </a>

        {/* AI Storybooks card hidden per product owner request until the
            feature itself ships — re-enable this block (Figma node
            1875:34099's 3rd card) once it does. */}
      </div>
    </section>
  )
}

export default ToolSelectorSectionV3
