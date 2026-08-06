import icVideoAi from '../../assets/icons/ic_video_ai.svg'
import icSongAi from '../../assets/icons/ic_song_ai.svg'
import './ToolSelectorSectionAlt.css'

function maskStyle(src: string) {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

// A/B alternative to ToolSelectorSection — Figma "Tracks Cards Row" default
// (node 1835:33139) + hover (node 1835:33929) states. Sits ABOVE the Hero
// Banner instead of below it (see HomePageReviewB), bigger icon badges
// (64px vs 56px), and the hover reveal is a "Create" text pill instead of
// the original's arrow icon button. Kept as a separate component/page per
// CLAUDE.md's A/B convention — only merge into the real ToolSelectorSection
// once a version is picked.
function ToolSelectorSectionAlt() {
  return (
    <section className="tool-selector-alt">
      <a href="/mv-create" className="tool-selector-alt__card tool-selector-alt__card--mv">
        <div className="tool-selector-alt__icon-badge tool-selector-alt__icon-badge--mv">
          <span className="tool-selector-alt__icon" style={maskStyle(icVideoAi)} aria-hidden="true" />
        </div>
        <div className="tool-selector-alt__text">
          <p className="tool-selector-alt__title">AI Music Video Creator</p>
          <p className="tool-selector-alt__description">
            Upload your selfie, choose a style, and watch AI craft a stunning music video in minutes.
          </p>
        </div>
        <span className="tool-selector-alt__cta" aria-hidden="true">
          Create
        </span>
      </a>

      <a href="/song-create" className="tool-selector-alt__card tool-selector-alt__card--song">
        <div className="tool-selector-alt__icon-badge tool-selector-alt__icon-badge--song">
          <span className="tool-selector-alt__icon" style={maskStyle(icSongAi)} aria-hidden="true" />
        </div>
        <div className="tool-selector-alt__text">
          <p className="tool-selector-alt__title">AI Song Composer</p>
          <p className="tool-selector-alt__description">
            Write your lyrics, pick a style, and AI generates a full song ready to share or use in your MV.
          </p>
        </div>
        <span className="tool-selector-alt__cta" aria-hidden="true">
          Create
        </span>
      </a>
    </section>
  )
}

export default ToolSelectorSectionAlt
