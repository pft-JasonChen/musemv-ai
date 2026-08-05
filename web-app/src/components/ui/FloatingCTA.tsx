"use client";

import { useEffect, useRef } from "react";

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
 */
export function FloatingCTA({
  children,
  alignToParent = false,
}: {
  children: React.ReactNode;
  alignToParent?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, [alignToParent]);

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
