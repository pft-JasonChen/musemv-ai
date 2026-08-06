import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useMountTransition, useLastValue } from '../../hooks/useMountTransition'
import './Toast.css'

// Figma "History — Option Menu — Song — Toast" (node 464:13600) — the
// simple pill toast used for Song publish/unpublish (no confirmation
// popup — that's MV-only, see PublishDialog) and reused anywhere else a
// quiet one-line status message is needed.
interface ToastProps {
  message: string | null
  onDismiss: () => void
  duration?: number
}

function Toast({ message, onDismiss, duration = 2200 }: ToastProps) {
  const { shouldRender, visible } = useMountTransition(!!message, 250)
  const stableMessage = useLastValue(message)

  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(onDismiss, duration)
    return () => window.clearTimeout(timer)
    // onDismiss intentionally excluded — callers pass a fresh closure each
    // render, which would otherwise restart this timer every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, duration])

  if (!shouldRender) return null

  return createPortal(
    <div className={`toast${visible ? ' toast--visible' : ''}`} role="status">
      {stableMessage}
    </div>,
    document.body,
  )
}

export default Toast
