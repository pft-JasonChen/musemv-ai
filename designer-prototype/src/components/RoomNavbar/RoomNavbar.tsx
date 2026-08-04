import type { ReactNode } from 'react'
import Button from '../Button/Button'
import CreditBalance from '../CreditBalance/CreditBalance'
import UpgradeButton from '../UpgradeButton/UpgradeButton'
import { useAuth } from '../AuthProvider/AuthProvider'
import './RoomNavbar.css'

// Figma "Navbar" (node 1351:28872 and siblings) — used on "Feature Room"
// pages (e.g. Song Create). Unlike DetailNavbar, there's no Back link — just
// a bare page title plus the credit balance.

interface RoomNavbarProps {
  title: string
  credits: number
  tabsSlot?: ReactNode
}

function RoomNavbar({ title, credits, tabsSlot }: RoomNavbarProps) {
  const { isSignedIn, openSignIn } = useAuth()

  return (
    <header className="room-navbar">
      <div className="room-navbar__top">
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
