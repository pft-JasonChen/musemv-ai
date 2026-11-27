"use client";

import { useSyncExternalStore } from "react";

/**
 * Home composer layout A/B switch (product owner, 2026-11-27), for UX testing.
 *   A — no tab bar above the composer; Music Video and Song are pills in the
 *       skills row, ahead of the AI Shorts groups.
 *   B — the original tab bar (Music Video · Song · AI Shorts) above the composer.
 * Kept in localStorage so a reload stays on the chosen layout. SSR renders "A"
 * (the server snapshot) and the real value lands after hydration, the same
 * shape as `authStore` — reading storage during render would be React error 418.
 * Delete this file, `HomeLayoutToggle` and its CSS once one layout is chosen.
 */
export type HomeLayout = "A" | "B";

const LS_KEY = "muse_home_layout";
const listeners = new Set<() => void>();

function read(): HomeLayout {
  try {
    return localStorage.getItem(LS_KEY) === "B" ? "B" : "A";
  } catch {
    return "A";
  }
}

export function setHomeLayout(layout: HomeLayout) {
  try {
    localStorage.setItem(LS_KEY, layout);
  } catch {
    /* private window: the switch still works for this document via listeners */
    memory = layout;
  }
  listeners.forEach((l) => l());
}

let memory: HomeLayout | null = null;
const snapshot = (): HomeLayout => {
  const stored = read();
  return memory && stored === "A" ? memory : stored;
};

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === LS_KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useHomeLayout(): HomeLayout {
  return useSyncExternalStore(subscribe, snapshot, () => "A");
}
