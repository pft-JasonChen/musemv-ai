"use client";

import { useRef } from "react";

/**
 * A draggable progress/seek control that is also operable by keyboard.
 *
 * WHY THIS EXISTS AS A COMPONENT
 *   DP draws its seek bars as a bare `<div>` with an `onPointerDown` handler —
 *   no role, no tabIndex, no key handling. That is pointer-only, and G7's a11y
 *   audit logged it against the song player as a Serious WCAG 2.1.1 failure
 *   (`TODO.md` #5): every transport button works from the keyboard, but a
 *   keyboard user cannot scrub at all. `/watch` needs the same control, so it
 *   is built once, accessibly, instead of copying the defect to a second
 *   screen. The song player can adopt this and close #5.
 *
 * The BEM class names are passed in rather than baked in, because the two
 * screens wear different DP stylesheets over the same behaviour.
 */
export function SeekBar({
  value,
  max,
  onSeek,
  label,
  className,
  trackClassName,
  fillClassName,
  thumbClassName,
}: {
  /** Current position, in the same unit as `max` (seconds). */
  value: number;
  /** Total duration. A zero/unknown duration renders an inert empty bar. */
  max: number;
  onSeek: (next: number) => void;
  label: string;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  thumbClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  function seekFromClientX(clientX: number) {
    const el = ref.current;
    if (!el || max <= 0) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0) return;
    const next = ((clientX - rect.left) / rect.width) * max;
    onSeek(Math.min(max, Math.max(0, next)));
  }

  function onPointerDown(e: React.PointerEvent) {
    seekFromClientX(e.clientX);
    // Listeners go on window so a drag that leaves the bar still tracks, and
    // both are removed together on pointerup.
    const move = (ev: PointerEvent) => seekFromClientX(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (max <= 0) return;
    // 5s nudge / 10% page step — the conventional media-scrubber mapping.
    const step = 5;
    const page = max / 10;
    const map: Record<string, number> = {
      ArrowLeft: value - step,
      ArrowRight: value + step,
      ArrowDown: value - step,
      ArrowUp: value + step,
      PageDown: value - page,
      PageUp: value + page,
      Home: 0,
      End: max,
    };
    const next = map[e.key];
    if (next === undefined) return;
    e.preventDefault();
    onSeek(Math.min(max, Math.max(0, next)));
  }

  return (
    <div
      ref={ref}
      className={className}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(max)}
      aria-valuenow={Math.round(value)}
      aria-valuetext={`${Math.round(value)} of ${Math.round(max)} seconds`}
    >
      <div className={trackClassName} />
      <div className={fillClassName} style={{ width: `${ratio * 100}%` }} />
      <div className={thumbClassName} style={{ left: `${ratio * 100}%` }} />
    </div>
  );
}
