import type { CSSProperties } from 'react'
import icCheck from '../../assets/icons/ic_check.svg'
import icClose from '../../assets/icons/ic_close.svg'
import icStar from '../../assets/icons/ic_star.svg'
import './Badge.css'

export type BadgeStatus = 'Purple' | 'Gold' | 'Done' | 'Failed' | 'Processing' | 'Hot' | 'New' | 'Sale' | 'Popular'

interface BadgeProps {
  status: BadgeStatus
  className?: string
}

const LABELS: Record<BadgeStatus, string> = {
  Purple: 'FEATURED',
  Gold: 'FEATURED',
  Done: 'Done',
  Failed: 'Failed',
  Processing: 'Generating...',
  Hot: 'HOT',
  New: 'NEW',
  Sale: '20% OFF',
  Popular: 'POPULAR',
}

function maskStyle(src: string): CSSProperties {
  return { maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }
}

// Figma "Badge" (node 79:667).
function Badge({ status, className = '' }: BadgeProps) {
  const icon = status === 'Done' ? icCheck : status === 'Failed' ? icClose : ['Purple', 'Gold', 'Processing'].includes(status) ? icStar : null

  return (
    <span className={`badge badge--${status.toLowerCase()} ${className}`.trim()}>
      {icon && <span className="badge__icon" style={maskStyle(icon)} aria-hidden="true" />}
      <span>{LABELS[status]}</span>
    </span>
  )
}

export default Badge
