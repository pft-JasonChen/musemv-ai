import type { ReactNode, CSSProperties } from 'react'
import './Button.css'

export type ButtonSize = 'Large' | 'Medium' | 'Small'
export type ButtonVariant = 'Primary' | 'PrimaryPayg' | 'Secondary' | 'Tertiary' | 'Ghost'

interface ButtonProps {
  size?: ButtonSize
  variant?: ButtonVariant
  disabled?: boolean
  /** Icon asset URL shown before the label. Omit to hide. */
  leadingIcon?: string
  /** Icon asset URL shown after the label. Omit to hide. */
  trailingIcon?: string
  /** Icon asset URL for the credits cluster, only used when variant="PrimaryPayg" */
  creditsIcon?: string
  /** Credit count, only rendered when variant="PrimaryPayg" */
  credits?: number
  children: ReactNode
  onClick?: () => void
  className?: string
}

function MaskIcon({ src }: { src: string }) {
  // Monochrome icon assets are baked with a white fill, so they're applied as a
  // CSS mask (tinted via currentColor) instead of an <img>, letting one asset
  // match each variant's text color (black on Secondary, grey on Ghost, etc).
  // Vite inlines small SVGs as a data URI containing literal single quotes
  // (from the SVG's own attribute syntax), so the url() value must be
  // double-quoted here or the browser treats the whole declaration as invalid.
  const maskStyle: CSSProperties = {
    maskImage: `url("${src}")`,
    WebkitMaskImage: `url("${src}")`,
  }
  return <span className="button__icon button__icon--mask" style={maskStyle} aria-hidden="true" />
}

function ColorIcon({ src }: { src: string }) {
  // The credits icon has its own gradient/branded color (gold coin) that must
  // be preserved as-is, so it renders as a normal image instead of a tinted mask.
  return <img className="button__icon" src={src} alt="" />
}

function Button({
  size = 'Large',
  variant = 'Primary',
  disabled = false,
  leadingIcon,
  trailingIcon,
  creditsIcon,
  credits,
  children,
  onClick,
  className,
}: ButtonProps) {
  const variantClass = variant === 'PrimaryPayg' ? 'primary-payg' : variant.toLowerCase()

  const classes = ['button', `button--${size.toLowerCase()}`, `button--${variantClass}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button type="button" className={classes} disabled={disabled} onClick={onClick}>
      {leadingIcon && <MaskIcon src={leadingIcon} />}
      <span className="button__label">{children}</span>
      {trailingIcon && <MaskIcon src={trailingIcon} />}
      {variant === 'PrimaryPayg' && credits !== undefined && (
        <span className="button__credits">
          {creditsIcon && <ColorIcon src={creditsIcon} />}
          <span className="button__credits-count">{credits}</span>
        </span>
      )}
    </button>
  )
}

export default Button
