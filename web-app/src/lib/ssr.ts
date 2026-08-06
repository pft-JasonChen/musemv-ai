"use client";

import { useEffect, useLayoutEffect, useState } from "react";

/** `useLayoutEffect` warns during SSR; fall back to `useEffect` there. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * DP's phone cutover, as a JS-readable constant. The authority is
 * `designer/AppLayout.css`'s `@media (max-width: 767px)`, which is what actually
 * swaps the sidebar for MobileHeader/MobileTabBar; this must stay in step with it.
 */
export const PHONE_QUERY = "(max-width: 767px)";

/**
 * ── THE R-2 PATTERN, EXTRACTED ───────────────────────────────────────────────
 *
 * "Does this media query match?", answered without a hydration failure.
 *
 * DP writes the same question as
 *   useState(() => typeof window !== 'undefined' ? matchMedia(q).matches : false)
 * which slice 2a MEASURED throwing React error 418 (`hydration failed`) at
 * 1000px. The `typeof window` guard stops it crashing under SSR, which is
 * exactly what makes it look safe; what it actually guarantees is that the
 * server render and the first client render disagree whenever the query matches.
 *
 * So: an SSR-safe constant initial value, and the real value read after mount.
 * `useLayoutEffect` rather than `useEffect` because callers switch DOM on the
 * result — correcting after paint would flash the wrong layout on every load.
 *
 * EXTRACTED HERE ON THE SECOND CONSUMER (slice 3b), same rule DpIcon followed:
 * `/explore/mvs` had a private copy inside `MvGrid`, `/song/play` needs the
 * phone cutover, and a third copy is how two sources of truth start. The
 * pre-flight for 3b calls for exactly this ("don't end up with two sources").
 *
 * Callers must treat `false` as "not known yet, assume the wide layout" — it is
 * the first-paint answer on a phone too, for one frame.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/**
 * "Has this component mounted on the client?" — the gate a `createPortal` needs.
 *
 * WHY A FLAG AND NOT A `typeof document` CHECK. `Modal` gets away with the plain
 * check because it is only ever asked to render while closed on the server, so
 * both sides agree on `null`. A portal that can be open on first render cannot:
 * React DOM Server emits nothing for a portal, so server and client disagree and
 * hydration patches it. Worse, DP's version does not check at all —
 * `createPortal(…, document.body)` during render FAILS `next build` outright,
 * which is the sharp edge the 3b pre-flight found (`SongDetailPage.tsx:337/468`).
 *
 * Layout effect, not `useEffect`, so the flag flips BEFORE the first paint — a
 * `?id=` deep link opens straight into the full-screen player instead of showing
 * one frame of the song list behind it.
 */
export function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useIsomorphicLayoutEffect(() => setMounted(true), []);
  return mounted;
}
