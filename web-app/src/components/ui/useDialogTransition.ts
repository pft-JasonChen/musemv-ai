"use client";

import { useEffect, useState } from "react";

/**
 * Mount/fade bookkeeping for DP's overlay markup, extracted from `DpDialog` on
 * its second consumer (`MvSheet`, slice 3g-2) — the same rule `DpIcon` and
 * `useMediaQuery` followed. A third private copy is how two sources of truth
 * start.
 *
 * ── WHY THIS IS NOT `useMountTransition`, AND NOT ALWAYS-MOUNTED EITHER ─────
 *
 * DP fades these with its own `useMountTransition`, which WA deliberately did
 * not port; 3b's overlays instead stay mounted so their transition plays in
 * BOTH directions, with `inert` handling the a11y half. Neither pattern is
 * right for this markup, and copying either blindly would be wrong:
 *
 * · Always-mounted is the WRONG default here. DP's closed state is
 *   `opacity: 0; pointer-events: none` — invisible to eye and mouse, still in
 *   the tab order and the a11y tree. That is the exact defect G7 found on
 *   `.now-playing__lyrics-overlay`. A permanently-mounted `/mv/room` would put
 *   six sheets' worth of controls into the page's tab order.
 * · So the caller unmounts when closed, like WA's own `Modal`. `visible` is
 *   then set on the frame AFTER mount, because a node inserted with its final
 *   class never transitions — the browser has no previous value to animate
 *   from. Closing waits for the fade before unmounting, and the caller marks
 *   the card `inert` for that window so nothing is focusable on the way out.
 *
 * Returns `{ mounted, visible }`: render nothing unless `mounted`, and add the
 * `--visible` modifier only when `visible`.
 */
export function useDialogTransition(open: boolean, durationMs = 300) {
  // `closing` keeps the node mounted for the fade-out after `open` goes false.
  // The transition is detected DURING RENDER by comparing against a stored
  // previous value, not in an effect: calling `setState` synchronously in an
  // effect body causes the cascading re-render `react-hooks/set-state-in-effect`
  // rejects. This is React's documented "adjust state when a prop changes"
  // pattern — a set during render re-runs the component immediately, before
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

  useEffect(() => {
    if (!open) return;
    // Next frame, so there is a 0 -> 1 to transition FROM.
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!closing) return;
    // Matches `transition: opacity .3s` in DP's stylesheets. If they ever
    // disagree the dialog unmounts early — a clipped fade, not a stuck overlay,
    // so it fails in the harmless direction.
    const timer = window.setTimeout(() => setClosing(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [closing, durationMs]);

  return { mounted: open || closing, visible };
}

/** Close on Escape while `open`, matching WA's `Modal`. */
export function useEscapeToClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}
