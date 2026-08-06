import { createPortal } from 'react-dom'
import { useMountTransition } from '../../hooks/useMountTransition'
import './PublishDialog.css'

// Shared "Ready to Go Public?" confirmation — every MV-related publish
// action (History, MV Result, Community Profile's MV tab) shows this before
// actually publishing. Song publish skips this entirely and just shows a
// Toast instead (see Toast component) — no confirmation needed there.
interface PublishDialogProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void
}

function PublishDialog({ isOpen, onCancel, onConfirm }: PublishDialogProps) {
  const { shouldRender, visible } = useMountTransition(isOpen)
  if (!shouldRender) return null

  return createPortal(
    <div
      className={`publish-dialog-overlay${visible ? ' publish-dialog-overlay--visible' : ''}`}
      role="presentation"
      onMouseDown={onCancel}
    >
      <section
        className="publish-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 id="publish-dialog-title">Ready to Go Public?</h2>
        <p>Once published, your creation is visible to the community and may be shared on our social channels.</p>
        <div className="publish-dialog__actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="button" className="publish-dialog__confirm" onClick={onConfirm}>Confirm</button>
        </div>
      </section>
    </div>,
    document.body,
  )
}

export default PublishDialog
