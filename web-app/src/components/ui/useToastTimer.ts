"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * A self-dismissing toast that STAYS while the pointer is on it.
 *
 * Product owner, 2026-10-22: "toasts disappear after a few seconds, but must
 * not disappear while the user is hovering them". Every toast in the app used
 * to hand-roll `setTimeout(() => setToast(null), N)`, which kept counting
 * under the cursor — fine for "Download started", not fine for the AI Song
 * language error, whose `( i )` the user has to hover to read the list.
 *
 * Leaving restarts the FULL duration rather than the remainder: a user who
 * hovered to read is done reading when they leave, and a toast that vanishes
 * 200ms after the pointer moves off reads as a glitch. Keyboard focus inside
 * the toast holds it the same way.
 *
 * Styling stays with each caller — spread `hold` onto the toast's own element.
 * The element must not be `pointer-events: none`, or it can never be hovered.
 */
export function useToastTimer<T = string>(durationMs: number) {
  const [toast, setToast] = useState<T | null>(null);
  const timer = useRef<number | undefined>(undefined);
  // Hover and focus are tracked apart: the toast re-arms only when BOTH have
  // left. One shared flag let a mouseleave re-arm it while focus was still on
  // the ( i ) inside, and the toast unmounted out from under the keyboard.
  const hovered = useRef(false);
  const focused = useRef(false);
  const held = () => hovered.current || focused.current;

  const arm = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      hovered.current = false;
      focused.current = false;
      setToast(null);
    }, durationMs);
  }, [durationMs]);

  const show = useCallback(
    (value: T) => {
      setToast(value);
      // A new message while the pointer is already on the toast stays put
      // until the pointer leaves, like the message it replaced.
      if (held()) window.clearTimeout(timer.current);
      else arm();
    },
    [arm],
  );

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current);
    hovered.current = false;
    focused.current = false;
    setToast(null);
  }, []);

  const hold = useMemo(() => {
    const set = (flag: typeof hovered, on: boolean) => {
      flag.current = on;
      if (on) window.clearTimeout(timer.current);
      else if (!held()) arm();
    };
    return {
      onMouseEnter: () => set(hovered, true),
      onMouseLeave: () => set(hovered, false),
      onFocus: () => set(focused, true),
      // Focus moving between two controls inside the toast is not leaving it.
      onBlur: (e: React.FocusEvent<HTMLElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) set(focused, false);
      },
    };
  }, [arm]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return {
    toast,
    show,
    dismiss,
    hold,
  };
}
