import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useMountTransition } from '../../hooks/useMountTransition'
import icClose from '../../assets/icons/ic_close.svg'
import icCredit from '../../assets/icons/ic_credit.svg'
import icVideoAi from '../../assets/icons/ic_video_ai.svg'
import icDownload from '../../assets/icons/ic_download.svg'
import icFlash from '../../assets/icons/ic_flash.svg'
import icShieldCheck from '../../assets/icons/ic_shield_check.svg'
import icClock from '../../assets/icons/ic_clock.svg'
import icStar from '../../assets/icons/ic_star.svg'
import './UpgradeDialog.css'

// Figma "Popup iAP - Pricing" (node 1797:33233 / 1797:33240) — no separate
// mobile frame with different content was given (the hidden "Popup iAP"
// variant nearby is the same 3 plans, just stacked/scrollable instead of a
// row — see CSS), so this reuses this app's existing centered-dialog
// convention for both.

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

interface Plan {
  key: string
  name: string
  proBadge?: string
  tag?: { label: string; tone: 'green' | 'purple' }
  description: string
  price: string
  credits: string
  creditsLabel: string
  cta: 'default' | 'gradient' | 'white'
  featured?: boolean
}

const FEATURES = [
  { icon: icVideoAi, label: 'MV without Watermark' },
  { icon: icDownload, label: 'Enable Download MV & Song' },
  { icon: icFlash, label: 'Priority AI Generation' },
  { icon: icShieldCheck, label: 'Commercial License' },
]

const PLANS: Plan[] = [
  {
    key: 'weekly',
    name: 'Weekly',
    tag: { label: 'MOST POPULAR', tone: 'green' },
    description: 'Everything you need to start creating.',
    price: '$9.99',
    credits: '200',
    creditsLabel: 'Weekly Credits',
    cta: 'default',
  },
  {
    key: 'weekly-pro',
    name: 'Weekly',
    proBadge: 'PRO',
    tag: { label: 'BEST VALUE', tone: 'purple' },
    description: '5x the credits, create more freely.',
    price: '$29.99',
    credits: '1,000',
    creditsLabel: 'Weekly Credits',
    cta: 'gradient',
    featured: true,
  },
  {
    key: 'yearly',
    name: 'Yearly',
    description: 'Every feature unlocked, all year.',
    price: '$59.99',
    credits: '2,000',
    creditsLabel: 'Yearly Credits',
    cta: 'white',
  },
]

const YEARLY_EXTRA_FEATURES = [
  { icon: icStar, label: 'First Access to New Features' },
  { icon: icClock, label: 'Credits Expire Yearly' },
]

const DEFAULT_EXPIRY_FEATURE = { icon: icClock, label: 'Credits Expire Weekly' }

interface UpgradeDialogProps {
  isOpen: boolean
  onClose: () => void
}

function UpgradeDialog({ isOpen, onClose }: UpgradeDialogProps) {
  const { shouldRender, visible } = useMountTransition(isOpen)
  if (!shouldRender) return null

  return createPortal(
    <div className={`upgrade-dialog-overlay${visible ? ' upgrade-dialog-overlay--visible' : ''}`}>
      <div className="upgrade-dialog-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="upgrade-dialog" role="dialog" aria-modal="true" aria-label="Upgrade Your Plan">
        <div className="upgrade-dialog__header">
          <span className="upgrade-dialog__header-spacer" aria-hidden="true" />
          <p className="upgrade-dialog__title">Upgrade Your Plan</p>
          <button type="button" className="upgrade-dialog__close" onClick={onClose} aria-label="Close">
            <img src={icClose} alt="" className="upgrade-dialog__close-icon" />
          </button>
        </div>

        <div className="upgrade-dialog__cards">
          {PLANS.map((plan) => (
            <div
              key={plan.key}
              className={`upgrade-dialog__card${plan.featured ? ' upgrade-dialog__card--featured' : ''}`}
            >
              <div className="upgrade-dialog__card-top">
                <div className="upgrade-dialog__plan-row">
                  <div className="upgrade-dialog__plan-name-group">
                    <p className="upgrade-dialog__plan-name">{plan.name}</p>
                    {plan.proBadge && <span className="upgrade-dialog__pro-badge">{plan.proBadge}</span>}
                  </div>
                  {plan.tag && (
                    <span className={`upgrade-dialog__tag upgrade-dialog__tag--${plan.tag.tone}`}>
                      {plan.tag.label}
                    </span>
                  )}
                </div>
                <p className="upgrade-dialog__plan-desc">{plan.description}</p>
                <p className="upgrade-dialog__price">
                  {plan.price}
                  <span className="upgrade-dialog__price-period"> / week</span>
                </p>
              </div>

              <button type="button" className={`upgrade-dialog__cta upgrade-dialog__cta--${plan.cta}`}>
                Subscribe
              </button>

              <div className="upgrade-dialog__details">
                <p className="upgrade-dialog__credits">
                  <img src={icCredit} alt="" className="upgrade-dialog__credits-icon" />
                  <span className="upgrade-dialog__credits-number">{plan.credits}</span>
                  <span className="upgrade-dialog__credits-label">{plan.creditsLabel}</span>
                </p>
                <div className="upgrade-dialog__divider" />
                <ul className="upgrade-dialog__features">
                  {FEATURES.map((feature) => (
                    <li key={feature.label} className="upgrade-dialog__feature">
                      <span className="upgrade-dialog__feature-icon-box">
                        <span className="upgrade-dialog__feature-icon" style={maskStyle(feature.icon)} aria-hidden="true" />
                      </span>
                      {feature.label}
                    </li>
                  ))}
                  {plan.key === 'yearly'
                    ? YEARLY_EXTRA_FEATURES.map((feature) => (
                        <li key={feature.label} className="upgrade-dialog__feature">
                          <span className="upgrade-dialog__feature-icon-box">
                            <span className="upgrade-dialog__feature-icon" style={maskStyle(feature.icon)} aria-hidden="true" />
                          </span>
                          {feature.label}
                        </li>
                      ))
                    : (
                        <li className="upgrade-dialog__feature">
                          <span className="upgrade-dialog__feature-icon-box">
                            <span
                              className="upgrade-dialog__feature-icon"
                              style={maskStyle(DEFAULT_EXPIRY_FEATURE.icon)}
                              aria-hidden="true"
                            />
                          </span>
                          {DEFAULT_EXPIRY_FEATURE.label}
                        </li>
                      )}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="upgrade-dialog__footer">
          <a href="#">Terms of Use</a>
          <span aria-hidden="true">|</span>
          <a href="#">Privacy Policy</a>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default UpgradeDialog
