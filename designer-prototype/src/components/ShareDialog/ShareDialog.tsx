import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useMountTransition } from '../../hooks/useMountTransition'
import icClose from '../../assets/icons/ic_close.svg'
import './ShareDialog.css'

// Always opens our own <ShareDialog> (with its Copy Link option) instead of
// ever handing off to the native Web Share API — the OS share sheet skips
// the copy-link affordance entirely, and every Share button in the app
// should behave the same way regardless of device. Kept as a named helper
// (rather than inlining `openDialog()` at every call site) so every Share
// button still funnels through one place.
export function shareOrOpenDialog(_title: string, openDialog: () => void) {
  openDialog()
}

interface ShareDialogProps {
  title: string
  isOpen: boolean
  onClose: () => void
}

function ShareDialog({ title, isOpen, onClose }: ShareDialogProps) {
  const [copied, setCopied] = useState(false)
  const { shouldRender, visible } = useMountTransition(isOpen)

  if (!shouldRender) return null

  const shareUrl = window.location.href

  function handleCopyLink() {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  // Portalled to <body> — ShareDialog is opened from Share buttons that
  // sometimes live inside a card/row that's itself wrapped in a link (e.g.
  // New Songs Section). Mounting in place would put this dialog markup
  // inside that outer <a>, which is fine today but is fragile to rely on.
  return createPortal(
    <div className={`share-dialog-overlay${visible ? ' share-dialog-overlay--visible' : ''}`}>
      <div className="share-dialog-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="share-dialog" role="dialog" aria-label="Share">
        <div className="share-dialog__handle" aria-hidden="true" />

        <div className="share-dialog__header">
          <span className="share-dialog__spacer" aria-hidden="true" />
          <p className="share-dialog__title">Share</p>
          <button type="button" className="share-dialog__close" onClick={onClose} aria-label="Close">
            <img src={icClose} alt="" className="share-dialog__close-icon" />
          </button>
        </div>

        <p className="share-dialog__subject">Shareable public link to &ldquo;{title}&rdquo;</p>

        <div className="share-dialog__link-row">
          <span className="share-dialog__link">{shareUrl}</span>
          <button type="button" className="share-dialog__copy" onClick={handleCopyLink}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default ShareDialog
