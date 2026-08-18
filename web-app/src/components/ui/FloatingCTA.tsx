"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// `useLayoutEffect` warns during SSR; fall back to `useEffect` there. Same
// local-copy convention as `SongPlayBar.tsx`'s own — `src/lib/ssr.ts` only
// exports `useMediaQuery`/`useIsMounted`/`PHONE_QUERY`, not this helper.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * DP's `FloatingCTA` — the bottom-docked primary action on the create screens.
 *
 * It is not pure CSS: the bar is `position: fixed`, so to line up with a column
 * rather than the viewport it measures its parent and publishes the geometry as
 * custom properties the stylesheet consumes. That measuring effect is ported as
 * DP wrote it, minus one thing.
 *
 * WA HAS NO `.footer`. DP's version also offsets the bar upward when its
 * marketing footer scrolls into view; WA's shell has no footer element, so that
 * query always returns null and the offset is always 0. The lookup is kept (it
 * is one line and costs nothing) so a future footer works without a code change,
 * but it is documented here rather than left to look like dead code.
 *
 * `ResizeObserver` and `getBoundingClientRect` are DOM reads, so this whole
 * component is client-only and never runs during SSR.
 *
 * ── `adaptive` (2026-08-13) ──────────────────────────────────────────────────
 *
 * Product owner request: Custom mode's CTA should only float when the page
 * actually needs scrolling to reach it — otherwise render it as the panel's
 * own last row (Figma node 1367:33182, the non-floating state). `adaptive`
 * defaults to `false`, so a caller has to opt in explicitly. `MvEditor` still
 * doesn't (2026-08-14: `MvRoom` and `StoryboardEditor` both opted in, to
 * match Song Create's CTA — `MvEditor` wasn't asked for, so it keeps the old
 * always-floating behavior untouched).
 *
 * The fit check measures an inline copy of `children` that is ALWAYS
 * rendered in normal flow — hidden with `visibility` (not unmounted) while
 * floating, so it keeps reserving its own real height instead of a separate
 * approximate spacer number, and so the same element is what gets measured
 * in both states. `rect.bottom + window.scrollY` converts the viewport-
 * relative measurement into a document-relative one before comparing to
 * `window.innerHeight` — comparing the raw (viewport-relative) `rect.bottom`
 * would make the check answer "is this scrolled into view right now",
 * which trivially flips to "fits" the moment the user scrolls down to it,
 * defeating the entire point of floating for constant reachability.
 *
 * ── `mobileAlwaysFloat` (2026-08-18) ─────────────────────────────────────────
 *
 * Product owner request, `StoryboardEditor` only: below 1024px (this file's
 * own mobile/tablet breakpoint — the same one `MVStoryboardPage.css` uses
 * for its interleaved section order) the CTA should always float, instead of
 * `adaptive`'s normal "only float if it doesn't fit" measurement. Implemented
 * as an early return inside `checkFit` rather than a separate code path, so
 * it still re-evaluates on every resize/ResizeObserver tick the existing
 * effect already listens for — crossing the 1024px line while the page is
 * open switches modes immediately, the same way `adaptive` already reacts to
 * content height changing. Opt-in and off by default, so `MvRoom` and
 * `SongCompose`'s existing `adaptive` behavior (float only when needed, at
 * every width) is untouched.
 */
export function FloatingCTA({
  children,
  alignToParent = false,
  adaptive = false,
  mobileAlwaysFloat = false,
}: {
  children: React.ReactNode;
  alignToParent?: boolean;
  adaptive?: boolean;
  /** Only meaningful when `adaptive` is also set. */
  mobileAlwaysFloat?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inlineRef = useRef<HTMLDivElement>(null);
  // SSR-safe constant (matches every other measured-layout value in this
  // app, e.g. SongPlayBar's own `sidebarWidth`) — server and first client
  // render agree on "floating" before the layout effect below corrects it,
  // pre-paint, once the real height is knowable.
  const [floating, setFloating] = useState(true);

  useIsomorphicLayoutEffect(() => {
    if (!adaptive) return;
    const inline = inlineRef.current;
    if (!inline) return;

    function checkFit() {
      if (mobileAlwaysFloat && window.innerWidth < 1024) {
        setFloating(true);
        return;
      }
      const rect = inline!.getBoundingClientRect();
      setFloating(rect.bottom + window.scrollY > window.innerHeight);
    }

    checkFit();
    const resizeObserver = new ResizeObserver(checkFit);
    resizeObserver.observe(document.body);
    window.addEventListener("resize", checkFit);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", checkFit);
    };
  }, [adaptive, mobileAlwaysFloat]);

  useEffect(() => {
    if (adaptive && !floating) return;
    const element = rootRef.current;
    if (!element) return;

    const parent = element.parentElement;
    const appMain = element.closest(".app-layout__main");
    const footer = document.querySelector<HTMLElement>(".footer");
    let frame = 0;

    function updatePosition() {
      if (!element) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        if (alignToParent && parent) {
          const rect = parent.getBoundingClientRect();
          element.style.setProperty("--floating-cta-parent-left", `${rect.left}px`);
          element.style.setProperty("--floating-cta-parent-width", `${rect.width}px`);
        }
        const footerTop = footer?.getBoundingClientRect().top ?? window.innerHeight;
        element.style.setProperty(
          "--floating-cta-footer-offset",
          `${Math.max(0, window.innerHeight - footerTop)}px`,
        );
      });
    }

    const resizeObserver = new ResizeObserver(updatePosition);
    if (parent) resizeObserver.observe(parent);
    if (appMain) resizeObserver.observe(appMain);
    if (footer) resizeObserver.observe(footer);

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition);
    };
  }, [alignToParent, adaptive, floating]);

  if (!adaptive) {
    return (
      <>
        <div className="floating-cta__spacer" aria-hidden="true" />
        <div
          ref={rootRef}
          className={`floating-cta${alignToParent ? " floating-cta--parent-aligned" : ""}`}
        >
          {children}
        </div>
      </>
    );
  }

  return (
    <>
      <div
        ref={inlineRef}
        style={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          ...(floating ? { visibility: "hidden" } : undefined),
        }}
        {...(floating ? { "aria-hidden": true, inert: true } : undefined)}
      >
        {children}
      </div>
      {floating && (
        <div
          ref={rootRef}
          className={`floating-cta${alignToParent ? " floating-cta--parent-aligned" : ""}`}
        >
          {children}
        </div>
      )}
    </>
  );
}
