"use client";

import { useEffect, useRef } from "react";

/**
 * The vertical twin of `useEdgeFade` (product owner, 2026-11-27): writes
 * `data-fade="t" | "b" | "tb" | ""` on a scrolling element while there is more to
 * scroll up / down, for a mask that fades the cut-off edge. Extracted on its second
 * consumer (the two `/mv/room` pick sheets).
 *
 * `active` re-attaches the listener — the sheets mount their body only while open,
 * so the element is not there when the hook first runs; pass `open`.
 */
export function useEdgeFadeY<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    const update = () => {
      const t = el.scrollTop > 2;
      const b = el.scrollHeight - el.clientHeight - el.scrollTop > 2;
      el.dataset.fade = `${t ? "t" : ""}${b ? "b" : ""}`;
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [active]);
  return ref;
}
