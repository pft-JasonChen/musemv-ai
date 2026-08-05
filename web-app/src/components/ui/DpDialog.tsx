"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
 * ── WHY THIS IS NOT `useMountTransition`, AND NOT ALWAYS-MOUNTED EITHER ─────
 *
 * DP fades these with `useMountTransition`, which WA deliberately did not port:
 * 3b's overlays needed to stay mounted so their transition played in BOTH
 * directions, and `inert` handled the a11y half. That reasoning does not carry
 * over here, and copying either pattern blindly would be wrong:
 *
 * · Always-mounted is the WRONG default for THIS markup. The closed state is
 *   `opacity: 0; pointer-events: none` — invisible to eye and mouse, still in
 *   the tab order and the a11y tree. That is the exact defect G7 found on
 *   `.now-playing__lyrics-overlay`. A permanently-mounted Buy Credits dialog
 *   would put six pack buttons in every page's tab order.
 * · So this unmounts when closed, like WA's own `Modal`. The `--visible` class
 *   is then added on the frame AFTER mount, because a node that is inserted
 *   with its final class never transitions — the browser has no previous value
 *   to animate from. Closing waits for the fade before unmounting, with the
 *   card marked `inert` for that window so nothing is focusable while it is on
 *   its way out.
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
  // `closing` keeps the node mounted for the fade-out after `open` goes false.
  // The transition is detected DURING RENDER by comparing against a stored
  // previous value, not in an effect: calling `setState` synchronously in an
  // effect body causes the cascading re-render `react-hooks/set-state-in-effect`
  // rejects. This is React's documented "adjust state when a prop changes"
  // pattern — a set during render re-runs this component immediately, before
  // anything is committed, so no extra paint happens.
  const [closing, setClosing] = useState(false);
  const [visible, setVisible] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) {
      setClosing(true);
      setVisible(false);
    }
  }

  const mounted = open || closing;

  useEffect(() => {
    if (!open) return;
    // Next frame, so there is a 0 -> 1 to transition FROM. A node inserted with
    // its final class never animates — the browser has no previous value.
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!closing) return;
    // Matches `transition: opacity .3s` in both stylesheets. If they ever
    // disagree the dialog unmounts early — a clipped fade, not a stuck overlay,
    // so it fails in the harmless direction.
    const timer = window.setTimeout(() => setClosing(false), 300);
    return () => window.clearTimeout(timer);
  }, [closing]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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
