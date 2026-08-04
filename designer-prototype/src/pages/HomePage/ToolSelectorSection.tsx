import icVideoAi from '../../assets/icons/ic_video_ai.svg'
import icSongAi from '../../assets/icons/ic_song_ai.svg'
import icArrowRight from '../../assets/icons/ic_arrow_right.svg'
import './ToolSelectorSection.css'

// The whole tile navigates (not just the arrow badge), so each card is a
// real <a> — the arrow is now purely decorative (reusing IconButton's own
// visual classes directly, since a <button> can't legally nest inside an
// <a>), matching the "click area = whole tile" behavior everywhere else on
// this section.
function ToolSelectorSection() {
  return (
    <section className="tool-selector">
      <a href="/mv-create" className="tool-selector__card tool-selector__card--bright">
        <span className="tool-selector__glow" aria-hidden="true" />
        <div className="tool-selector__icon-badge tool-selector__icon-badge--mv">
          <span className="tool-selector__icon" style={maskStyle(icVideoAi)} aria-hidden="true" />
        </div>
        <div className="tool-selector__text">
          <p className="tool-selector__title">Music Video Creator</p>
          <p className="tool-selector__description">
            Upload your selfie, choose a style, and watch AI craft a stunning music video in minutes.
          </p>
        </div>
        <span
          className="icon-button icon-button--medium icon-button--secondary tool-selector__action"
          aria-hidden="true"
        >
          <span className="icon-button__icon" style={maskStyle(icArrowRight)} aria-hidden="true" />
        </span>
      </a>

      <a href="/song-create" className="tool-selector__card">
        <span className="tool-selector__glow" aria-hidden="true" />
        <div className="tool-selector__icon-badge tool-selector__icon-badge--song">
          <span className="tool-selector__icon" style={maskStyle(icSongAi)} aria-hidden="true" />
        </div>
        <div className="tool-selector__text">
          <p className="tool-selector__title">AI Song Composer</p>
          <p className="tool-selector__description">
            Write your lyrics, pick a style, and AI generates a full song ready to share or use in your MV.
          </p>
        </div>
        <span
          className="icon-button icon-button--medium icon-button--secondary tool-selector__action"
          aria-hidden="true"
        >
          <span className="icon-button__icon" style={maskStyle(icArrowRight)} aria-hidden="true" />
        </span>
      </a>
    </section>
  )
}

function maskStyle(src: string) {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

export default ToolSelectorSection
