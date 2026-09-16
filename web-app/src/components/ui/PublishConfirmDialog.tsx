"use client";

import { createPortal } from "react-dom";
import { useDialogTransition, useEscapeToClose } from "./useDialogTransition";

/**
 * Shared "Ready to Go Public?" confirmation — ported from DP's own shared
 * `PublishDialog` (Figma), used before every MV/Storyboard publish action
 * (History, MV Result, Community Profile's MV tab). Classes from
 * `src/styles/designer/PublishDialog.css`, verbatim.
 *
 * Designer request, 2026-08-11: these three screens previously each opened
 * WA's generic Tailwind `Modal` instead — close enough to read as "a dialog
 * confirming publish", but visibly wrong next to DP's actual chrome (no close
 * button, 28px card radius, a solid white Confirm pill rather than a themed
 * button). This is a straight port, not a redesign.
 *
 * NOT built on `DpDialog`: that shell always renders a `__header` with a
 * close-X once given a title, and a separate `-backdrop` div. DP's own
 * PublishDialog has neither — the overlay itself is the click-to-close
 * backdrop (`onMouseDown` on the overlay, stopped on the card) — so this
 * follows DP's markup directly instead, reusing only the mount/fade
 * bookkeeping (`useDialogTransition`/`useEscapeToClose`) both shells share.
 *
 * Product owner, 2026-09-16: Song publish now confirms first too, the same
 * dialog here — History's AI Song menu, `SongResultView`, and Creator
 * Profile's Song tab all reuse this component directly. DP's own split (song
 * publishes straight away, no dialog, matching a Toast instead) no longer
 * holds; each of those three call sites still skips the dialog for
 * UNpublishing, which stays an immediate toggle everywhere.
 */
export function PublishConfirmDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { mounted, visible } = useDialogTransition(open);
  useEscapeToClose(open, onCancel);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`publish-dialog-overlay${visible ? " publish-dialog-overlay--visible" : ""}`}
      onMouseDown={onCancel}
    >
      <section
        className="publish-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="publish-dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="publish-dialog-title">Ready to Go Public?</h2>
        <p>
          Once published, your creation is visible to the community and may be shared on our
          social channels.
        </p>
        <div className="publish-dialog__actions">
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="publish-dialog__confirm" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
