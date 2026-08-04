import type { CSSProperties } from 'react'
import './IconButton.css'

export type IconButtonSize = 'Large' | 'Medium' | 'Small' | 'XSmall'
export type IconButtonVariant = 'Primary' | 'Secondary' | 'Tertiary' | 'Ghost'

interface IconButtonProps {
  size?: IconButtonSize
  variant?: IconButtonVariant
  disabled?: boolean
  /** Icon asset URL. Rendered as a CSS mask so it can be tinted per variant/state. */
  icon: string
  /** Accessible name — required since the button has no visible text. */
  label: string
  onClick?: () => void
  className?: string
}

function IconButton({
  size = 'Large',
  variant = 'Primary',
  disabled = false,
  icon,
  label,
  onClick,
  className,
}: IconButtonProps) {
  const classes = [
    'icon-button',
    `icon-button--${size.toLowerCase()}`,
    `icon-button--${variant.toLowerCase()}`,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // Vite inlines small SVGs as a data URI containing literal single quotes,
  // so the url() value must be double-quoted or the browser drops it as invalid.
  const maskStyle: CSSProperties = {
    maskImage: `url("${icon}")`,
    WebkitMaskImage: `url("${icon}")`,
  }

  return (
    <button type="button" className={classes} disabled={disabled} aria-label={label} onClick={onClick}>
      <span className="icon-button__icon" style={maskStyle} aria-hidden="true" />
    </button>
  )
}

export default IconButton
