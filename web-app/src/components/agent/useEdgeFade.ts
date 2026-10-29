"use client";

import { useEffect, useRef } from "react";

/**
 * Fades a horizontal scroller's edges while there is more to scroll that way
 * (product owner, 2026-10-28). Writes `data-fade="l" | "r" | "lr" | ""` on the
 * element — a data attribute, not a class, because React owns `className` and
 * would wipe a toggled class on its next render. `agent.css` turns the
 * attribute into a mask.
 */
export function useEdgeFade<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const l = el.scrollLeft > 2;
      const r = max - el.scrollLeft > 2;
      el.dataset.fade = `${l ? "l" : ""}${r ? "r" : ""}`;
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, []);
  return ref;
}
