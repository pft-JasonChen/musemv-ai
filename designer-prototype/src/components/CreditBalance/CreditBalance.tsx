import { useState } from 'react'
import type { CSSProperties } from 'react'
import icCredit from '../../assets/icons/ic_credit.svg'
import icAdd from '../../assets/icons/ic_add.svg'
import CreditsDialog from '../CreditsDialog/CreditsDialog'
import './CreditBalance.css'

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

// Self-contained trigger + dialog, same convention as UpgradeButton — the
// header credit chip opens the Buy Credits popup (Figma node 1783:42703)
// directly, rather than threading dialog state up through every navbar.
function CreditBalance({ credits }: { credits: number }) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <button type="button" className="credit-balance" onClick={() => setDialogOpen(true)}>
        <img src={icCredit} alt="" />
        <span>{credits}</span>
        <span className="credit-balance__add" style={maskStyle(icAdd)} aria-hidden="true" />
      </button>
      <CreditsDialog isOpen={dialogOpen} onClose={() => setDialogOpen(false)} balance={credits} />
    </>
  )
}

export default CreditBalance
