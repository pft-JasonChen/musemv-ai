import { useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useMountTransition } from '../../hooks/useMountTransition'
import icClose from '../../assets/icons/ic_close.svg'
import icCredit from '../../assets/icons/ic_credit.svg'
import icCredits from '../../assets/icons/ic_credits.svg'
import './CreditsDialog.css'

// Figma "IAP — Buy Credits - List_L" (node 1783:42703) — the popup opened
// from both the header's credit balance chip and the Credits page's own
// "Buy More" button. Packs are selectable (tap one to switch which pack
// "Buy Now" would purchase); no real payment happens, per project scope.

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

interface Tag {
  label: string
  tone: 'pink' | 'purple' | 'green'
}

interface Pack {
  key: string
  credits: string
  price: string
  originalPrice?: string
  tags: Tag[]
  featured?: boolean
}

const PACKS: Pack[] = [
  { key: '8000', credits: '8,000', price: '$191.99', originalPrice: '$239.99', tags: [{ label: '20% OFF', tone: 'pink' }] },
  { key: '5000', credits: '5,000', price: '$119.99', originalPrice: '$149.99', tags: [{ label: '20% OFF', tone: 'pink' }] },
  {
    key: '2000',
    credits: '2,000',
    price: '$47.99',
    originalPrice: '$59.99',
    tags: [
      { label: 'BEST VALUE', tone: 'purple' },
      { label: '20% OFF', tone: 'pink' },
    ],
    featured: true,
  },
  { key: '1000', credits: '1,000', price: '$39.99', tags: [{ label: 'POPULAR', tone: 'green' }] },
  { key: '600', credits: '600', price: '$29.99', tags: [] },
  { key: '300', credits: '300', price: '$14.99', tags: [] },
]

interface CreditsDialogProps {
  isOpen: boolean
  onClose: () => void
  balance?: number
}

function CreditsDialog({ isOpen, onClose, balance = 360 }: CreditsDialogProps) {
  const { shouldRender, visible } = useMountTransition(isOpen)
  const [selectedKey, setSelectedKey] = useState(PACKS.find((pack) => pack.featured)?.key ?? PACKS[0].key)

  if (!shouldRender) return null

  return createPortal(
    <div className={`credits-dialog-overlay${visible ? ' credits-dialog-overlay--visible' : ''}`}>
      <div className="credits-dialog-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="credits-dialog" role="dialog" aria-modal="true" aria-label="Buy Credits">
        <div className="credits-dialog__header">
          <span className="credits-dialog__header-spacer" aria-hidden="true" />
          <p className="credits-dialog__title">Buy Credits</p>
          <button type="button" className="credits-dialog__close" onClick={onClose} aria-label="Close">
            <img src={icClose} alt="" className="credits-dialog__close-icon" />
          </button>
        </div>

        <div className="credits-dialog__balance">
          <p className="credits-dialog__balance-label">YOUR BALANCE</p>
          <div className="credits-dialog__balance-row">
            <div className="credits-dialog__balance-amount">
              <img src={icCredit} alt="" className="credits-dialog__balance-icon" />
              <span className="credits-dialog__balance-number">{balance}</span>
              <span className="credits-dialog__balance-unit">Credits</span>
            </div>
            <button type="button" className="credits-dialog__recover">
              Recover
            </button>
          </div>
        </div>

        <div className="credits-dialog__scroll">
          <p className="credits-dialog__section-label">Buy Credit Pack</p>

          <div className="credits-dialog__packs">
            {PACKS.map((pack) => (
              <div className="credits-dialog__pack-slot" key={pack.key}>
                {pack.tags.length > 0 && (
                  <div className="credits-dialog__pack-tags">
                    {pack.tags.map((tag) => (
                      <span key={tag.label} className={`credits-dialog__tag credits-dialog__tag--${tag.tone}`}>
                        {tag.label}
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  className={`credits-dialog__pack${selectedKey === pack.key ? ' credits-dialog__pack--selected' : ''}`}
                  onClick={() => setSelectedKey(pack.key)}
                  aria-pressed={selectedKey === pack.key}
                >
                  <div className="credits-dialog__pack-info">
                    <p className="credits-dialog__pack-label">Add Credit</p>
                    <div className="credits-dialog__pack-credits">
                      <span className="credits-dialog__pack-credits-icon" style={maskStyle(icCredits)} aria-hidden="true" />
                      <span>{pack.credits}</span>
                    </div>
                  </div>
                  <div className="credits-dialog__pack-price">
                    {pack.originalPrice && <span className="credits-dialog__pack-original">{pack.originalPrice}</span>}
                    <span className="credits-dialog__pack-current">{pack.price}</span>
                  </div>
                </button>
              </div>
            ))}
          </div>

          <p className="credits-dialog__disclaimer">
            Credits never expire but are non-refundable and lost upon account deletion. Prices vary by region.
          </p>
        </div>

        <button type="button" className="credits-dialog__cta">
          Buy Now
        </button>

        <div className="credits-dialog__footer">
          <a href="#">Terms of Use</a>
          <span aria-hidden="true">|</span>
          <a href="#">Privacy Policy</a>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default CreditsDialog
