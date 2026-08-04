import type { CSSProperties } from 'react'
import icChevronRight from '../../assets/icons/ic_chevron-right.svg'
import './SectionHeader.css'

interface SectionHeaderProps {
  title: string
  /** Shorter title shown in the app-mobile layout (see layoutMode.ts) — Figma's
   *  mobile screen abbreviates some headings (e.g. "New Music Videos" → "New
   *  MVs"). Defaults to `title` when the mobile screen uses the same text. */
  mobileTitle?: string
  /** Omit the "See all" link — used on the page a "See all" link leads to. */
  showSeeAll?: boolean
  /** Where "See all" links to. Defaults to "#" (not wired to a page yet). */
  seeAllHref?: string
}

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function SectionHeader({ title, mobileTitle = title, showSeeAll = true, seeAllHref = '#' }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <p className="section-header__title section-header__title--desktop">{title}</p>
      <p className="section-header__title section-header__title--mobile">{mobileTitle}</p>
      {showSeeAll && (
        <a href={seeAllHref} className="section-header__see-all">
          See all
          <span className="section-header__see-all-icon" style={maskStyle(icChevronRight)} aria-hidden="true" />
        </a>
      )}
    </div>
  )
}

export default SectionHeader
