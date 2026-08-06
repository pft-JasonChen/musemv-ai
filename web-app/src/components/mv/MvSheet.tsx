"use client";
/* eslint-disable @next/next/no-img-element */

import { createPortal } from "react-dom";
import { PHONE_QUERY, useMediaQuery } from "@/lib/ssr";
import { useDialogTransition, useEscapeToClose } from "@/components/ui/useDialogTransition";

/**
 * The shell all five of `/mv/room`'s overlays share (slice 3g-2). DP writes it
 * out five times inside `MVCreatePage.tsx`; the boxes are identical:
 *
 *   .mv-sheet-overlay[--visible]   fixed, centred, `opacity` transition
 *     .mv-sheet-backdrop           click-to-close scrim
 *     .mv-sheet[ --variant ]       role="dialog", the card itself
 *       .mv-sheet__handle          mobile grab bar (desktop: display:none)
 *       .mv-sheet__header          close / title / confirm-or-spacer
 *       {children}                 each sheet's own content
 *       .mv-sheet__footer          Cancel / Confirm (mobile: display:none)
 *
 * `DpDialog` is the Credits equivalent and could not be reused: its header is
 * spacer/title/close and it has no handle and no footer. What the two DO share
 * — the mount/fade/`inert` dance — is now `useDialogTransition`, extracted here
 * rather than copied a second time.
 *
 * ── THE HEADER CONFIRM IS PHONE-ONLY ON PURPOSE ─────────────────────────────
 *
 * DP's responsive convention (`MVCreatePage.css` line 1516 onward): below 768px
 * the header is X-left / title / check-right and `.mv-sheet__footer` is
 * `display: none`; at 768px and up the check moves into a Cancel/Confirm footer
 * row and the header check gets `opacity: 0; pointer-events: none`.
 *
 * `display: none` drops the footer out of the tab order on phones, so that half
 * is safe. `opacity: 0` does NOT — a desktop user tabbing through the sheet
 * would land on an invisible "Confirm" before reaching the title. That is the
 * same class of defect G7 found on `.now-playing__lyrics-overlay`, so the check
 * is rendered only when the phone query actually matches, via `useMediaQuery`
 * (whose breakpoint constant is the same 767px cutover).
 *
 * Consequence to know: `useMediaQuery` reports `false` for the first frame, so
 * on a phone the header check appears one frame late. A missing control for one
 * frame is the harmless direction; a permanently focusable invisible one is not.
 */
export function MvSheet({
  open,
  onClose,
  onCancel,
  label,
  title,
  variant,
  confirm,
  children,
}: {
  open: boolean;
  onClose: () => void;
  /**
   * What the footer's Cancel does, when dismissing and cancelling are not the
   * same thing. Defaults to `onClose`.
   *
   * G7 finding 3g2-1: the Settings sheet commits every control on touch, so a
   * Cancel wired to `onClose` sat next to Confirm doing the identical thing —
   * a dead control the MIGRATION introduced (the pre-migration `Modal` had no
   * Cancel at all). Sheets that commit on Confirm can keep the default.
   */
  onCancel?: () => void;
  /** Accessible name for the dialog. */
  label: string;
  /** Header title. Omitted for the Mode sheet, whose header is a close button alone. */
  title?: string;
  /** Extra class on the card, e.g. "mv-song-picker". */
  variant?: string;
  /**
   * The confirming action. Omit for a sheet that commits on click (the song
   * picker) — DP then renders `.mv-sheet__header-spacer` and no footer.
   */
  confirm?: {
    onConfirm: () => void;
    /** Blocks the footer button and the phone header check alike (S2's 30s floor). */
    disabled?: boolean;
    /** Accessible name for the phone header check. DP uses "Confirm"/"Apply". */
    ariaLabel?: string;
  };
  children: React.ReactNode;
}) {
  const { mounted, visible } = useDialogTransition(open);
  const isPhone = useMediaQuery(PHONE_QUERY);
  useEscapeToClose(open, onClose);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className={`mv-sheet-overlay${visible ? " mv-sheet-overlay--visible" : ""}`}>
      <div className="mv-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className={`mv-sheet${variant ? ` ${variant}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        // Closing: still painted, already unreachable. React 19 types `inert` as
        // a boolean and serialises it to the HTML attribute itself.
        inert={!open}
      >
        <div className="mv-sheet__handle" aria-hidden="true" />
        <div className="mv-sheet__header">
          <button type="button" className="mv-sheet__close" onClick={onClose} aria-label="Close">
            {/* A REAL <img>, not `DpIcon`. `.mv-sheet__close-icon` sets width and
                height and nothing else — no mask, no background — so a mask span
                here has nothing to clip and paints an empty circle. Same trap as
                `.{block}__close-icon` in `DpDialog`. */}
            <img src="/assets/icons/ui/ic_close.svg" alt="" className="mv-sheet__close-icon" />
          </button>
          {title && <p className="mv-sheet__title">{title}</p>}
          {confirm
            ? isPhone && (
                <button
                  type="button"
                  className="mv-sheet__confirm"
                  onClick={confirm.onConfirm}
                  disabled={confirm.disabled}
                  aria-label={confirm.ariaLabel ?? "Confirm"}
                >
                  <img
                    src="/assets/icons/ui/ic_check.svg"
                    alt=""
                    className="mv-sheet__confirm-icon"
                  />
                </button>
              )
            : title && <div className="mv-sheet__header-spacer" aria-hidden="true" />}
        </div>

        {children}

        {confirm && (
          <div className="mv-sheet__footer">
            <button
              type="button"
              className="mv-sheet__footer-btn mv-sheet__footer-btn--cancel"
              onClick={onCancel ?? onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="mv-sheet__footer-btn mv-sheet__footer-btn--confirm"
              onClick={confirm.onConfirm}
              disabled={confirm.disabled}
            >
              Confirm
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
