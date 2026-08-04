import type { CSSProperties } from 'react'
import icCrown from '../../assets/icons/ic_crown.svg'
import icAccount from '../../assets/icons/ic_account.svg'
import './MobileHeader.css'

// Figma "Header — Sticky" (node 369:7575), from the manager's app design —
// only shown below the app-mobile breakpoint, see AppLayout + layoutMode.ts.

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function MobileHeader() {
  return (
    <header className="mobile-header">
      <p className="mobile-header__title">YouCam Muse</p>
      <button type="button" className="mobile-header__subscribe" aria-label="Subscribe">
        <span className="mobile-header__subscribe-icon" style={maskStyle(icCrown)} aria-hidden="true" />
      </button>
      <button type="button" className="mobile-header__account" aria-label="Account">
        <span className="mobile-header__account-icon" style={maskStyle(icAccount)} aria-hidden="true" />
      </button>
    </header>
  )
}

export default MobileHeader
