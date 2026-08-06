"use client";

import { createPortal } from "react-dom";
import { useDialogTransition, useEscapeToClose } from "./useDialogTransition";

/**
 * The shell DP's dialogs share — `CreditsDialog` and `UpgradeDialog` are the
 * same four boxes with a different block name:
 *
 *   .{block}-overlay[--visible]  fixed, centred, `opacity` transition
 *     .{block}-backdrop          click-to-close scrim
 *     .{block}                   role="dialog", the card itself
 *       .{block}__header         spacer / title / close
 *
 * Extracted on its second consumer rather than copied twice.
 *
 * The mount/fade/`inert` bookkeeping — and the reasoning for why it is neither
 * DP's `useMountTransition` nor 3b's always-mounted overlays — moved to
 * `useDialogTransition` when `MvSheet` (slice 3g-2) became its second consumer.
 *
 * Escape and backdrop clicks both close, matching `Modal`.
 */
export function DpDialog({
  open,
  onClose,
  /** BEM block name, e.g. "credits-dialog". */
  block,
  /** Accessible name for the dialog. */
  label,
  /** Rendered in the header bar; omit for a dialog with no title row. */
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  block: string;
  label: string;
  title?: string;
  children: React.ReactNode;
}) {
  const { mounted, visible } = useDialogTransition(open);
  useEscapeToClose(open, onClose);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className={`${block}-overlay${visible ? ` ${block}-overlay--visible` : ""}`}>
      <div className={`${block}-backdrop`} onClick={onClose} aria-hidden="true" />
      <div
        className={block}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        // Closing: still painted, already unreachable. React 19 types `inert` as
        // a boolean and serialises it to the HTML attribute itself.
        inert={!open}
      >
        {title && (
          <div className={`${block}__header`}>
            <span className={`${block}__header-spacer`} aria-hidden="true" />
            <p className={`${block}__title`}>{title}</p>
            <button
              type="button"
              className={`${block}__close`}
              onClick={onClose}
              aria-label="Close"
            >
              {/* A REAL <img>, not `DpIcon`. `.{block}__close-icon` sets width
                  and height and nothing else — no mask, no background — because
                  DP paints this one as an image and lets the SVG carry its own
                  colour. A mask span with no background paints nothing at all,
                  so this rendered as an empty circle until it was measured. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/icons/ui/ic_close.svg" alt="" className={`${block}__close-icon`} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
