import { useState } from 'react'
import type { CSSProperties } from 'react'
import icCrown from '../../assets/icons/ic_crown.svg'
import UpgradeDialog from '../UpgradeDialog/UpgradeDialog'
import './UpgradeButton.css'

// Figma "Sub btn" (node 1459:10293) — the header's own Upgrade button,
// signed-in only. Distinct from the Sidebar's own bottom "Upgrade" button
// (Button/Tertiary, full-width) — this one is a small white pill sitting
// next to the header's credit balance. Both open the same UpgradeDialog
// (node 1797:33233).

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

function UpgradeButton() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <button type="button" className="upgrade-button" onClick={() => setDialogOpen(true)}>
        <span className="upgrade-button__icon" style={maskStyle(icCrown)} aria-hidden="true" />
        Upgrade
      </button>
      <UpgradeDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  )
}

export default UpgradeButton
