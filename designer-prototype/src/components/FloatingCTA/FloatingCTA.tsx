import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import './FloatingCTA.css'

interface FloatingCTAProps {
  children: ReactNode
  alignToParent?: boolean
}

function FloatingCTA({ children, alignToParent = false }: FloatingCTAProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const element = root

    const parent = element.parentElement
    const appMain = element.closest('.app-layout__main')
    const footer = document.querySelector<HTMLElement>('.footer')
    let frame = 0

    function updatePosition() {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        if (alignToParent && parent) {
          const parentRect = parent.getBoundingClientRect()
          element.style.setProperty('--floating-cta-parent-left', `${parentRect.left}px`)
          element.style.setProperty('--floating-cta-parent-width', `${parentRect.width}px`)
        }

        const footerTop = footer?.getBoundingClientRect().top ?? window.innerHeight
        const footerOffset = Math.max(0, window.innerHeight - footerTop)
        element.style.setProperty('--floating-cta-footer-offset', `${footerOffset}px`)
      })
    }

    const resizeObserver = new ResizeObserver(updatePosition)
    if (parent) resizeObserver.observe(parent)
    if (appMain) resizeObserver.observe(appMain)
    if (footer) resizeObserver.observe(footer)

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, { passive: true })

    return () => {
      window.cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition)
    }
  }, [alignToParent])

  return (
    <>
      <div className="floating-cta__spacer" aria-hidden="true" />
      <div
        ref={rootRef}
        className={`floating-cta${alignToParent ? ' floating-cta--parent-aligned' : ''}`}
      >
        {children}
      </div>
    </>
  )
}

export default FloatingCTA
