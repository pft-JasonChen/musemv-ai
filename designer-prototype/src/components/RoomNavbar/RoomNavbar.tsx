import type { ReactNode } from 'react'
import Button from '../Button/Button'
import CreditBalance from '../CreditBalance/CreditBalance'
import UpgradeButton from '../UpgradeButton/UpgradeButton'
import { useAuth } from '../AuthProvider/AuthProvider'
import icArrowLeft from '../../assets/icons/ic_arrow_left.svg'
import './RoomNavbar.css'

// Figma "Navbar" (node 1351:28872 and siblings) — used on "Feature Room"
// pages (e.g. Song Create). Unlike DetailNavbar, there's no Back link — just
// a bare page title plus the credit balance.

interface RoomNavbarProps {
  title: string
  credits: number
  tabsSlot?: ReactNode
  /** Feature Room pages have no back button on desktop (Figma-deliberate —
   *  this navbar is bare title + credits, navigation happens via the
   *  persistent Sidebar instead) but need one on app-mobile, which has no
   *  Sidebar to fall back on. Pass the same destination the page's desktop
   *  `from=`/source logic would use; omit for pages reached directly via
   *  the app-mobile tab bar (History), which stay excluded like Home. */
  mobileBackHref?: string
}

function maskStyle(src: string) {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function RoomNavbar({ title, credits, tabsSlot, mobileBackHref }: RoomNavbarProps) {
  const { isSignedIn, openSignIn } = useAuth()

  return (
    <header className={`room-navbar${mobileBackHref ? ' room-navbar--mobile-back' : ''}`}>
      <div className="room-navbar__top">
        {mobileBackHref && (
          <a href={mobileBackHref} className="room-navbar__mobile-back" aria-label="Back">
            <span className="room-navbar__mobile-back-icon" style={maskStyle(icArrowLeft)} aria-hidden="true" />
          </a>
        )}
        <p className="room-navbar__title">{title}</p>
        {isSignedIn ? (
          <div className="room-navbar__actions">
            <CreditBalance credits={credits} />
            <UpgradeButton />
          </div>
        ) : (
          <Button size="Medium" variant="Tertiary" onClick={openSignIn} className="room-navbar__login">
            Login
          </Button>
        )}
      </div>

      {tabsSlot && <div className="room-navbar__tabs">{tabsSlot}</div>}
    </header>
  )
}

export default RoomNavbar
