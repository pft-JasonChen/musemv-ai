"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Shared behavior for a hover-revealed volume-slider popup on a mute button —
 * product owner, 2026-09-16, requested on every Song/MV playing/result screen
 * and the Share page, across desktop, tablet AND mobile. Extracted up front
 * rather than duplicated at each of the ten call sites (the scroll-row rail
 * pattern elsewhere in this codebase duplicates freely, but that pattern
 * differs in LAYOUT per screen; this one is identical stateful behavior
 * everywhere it appears, and a bug fixed in one copy but not the other nine
 * is exactly the failure mode worth avoiding here).
 *
 * ── WHY THIS NEEDS JS AT ALL, WHEN THE POPUP IS PURE CSS ────────────────────
 *
 * A desktop mouse gets the popup for free from `:hover`/`:focus-within` on the
 * wrapper — no JS involved, and unaffected by anything below. Touch has no
 * hover to reveal it passively, so the product owner's answer for touch is a
 * two-tap model: the FIRST tap on the mute button only reveals the popup
 * (`open` becomes true, added as a CSS modifier class alongside the `:hover`
 * selector); mute/unmute only fires once the popup is already open, so the
 * caller's own `toggle()` runs on the SECOND tap. `matchMedia("(hover:
 * none)")` is what tells the two paths apart — deliberately capability-based,
 * not viewport-width-based, so it covers phone AND tablet in one check
 * without caring where either breakpoint actually falls.
 *
 * `wrapRef` is the click-outside boundary that closes an open popup, the same
 * job any other popup/menu in this app already does for itself — taken as a
 * PARAMETER, owned by the caller's own `useRef`, rather than created here and
 * returned. `react-hooks/refs` (the newer, compiler-aligned lint rule this
 * project runs) flags a ref read from a PLAIN OBJECT a hook returns as an
 * unsafe render-time ref access, even though `ref={x.wrapRef}` is completely
 * normal usage on its own — the rule cannot see across that boundary. Taking
 * the ref as an argument instead sidesteps it: the ref stays a local variable
 * at the call site the whole time, which is the one shape the rule
 * recognizes as safe.
 */
export function useVolumePopup(wrapRef: RefObject<HTMLElement | null>) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, wrapRef]);

  /** Wire to the mute button's `onClick`, passing the real mute/unmute
   *  action as `toggle`. */
  function handleMuteClick(toggle: () => void) {
    const touchOnly =
      typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;
    if (touchOnly && !open) {
      setOpen(true);
      return;
    }
    toggle();
    if (touchOnly) setOpen(false);
  }

  return { open, handleMuteClick };
}
