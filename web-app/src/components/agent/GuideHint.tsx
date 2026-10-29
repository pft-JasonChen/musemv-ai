"use client";

import { useSyncExternalStore } from "react";
import { useIsMounted } from "@/lib/ssr";

/**
 * The pulsing "tap here next" dot from YCA's demo (handoff §3.1). It appears
 * 600ms after the target becomes the next step; any pointer-down hides it and
 * starts the 600ms over. `?nohint` on the URL turns every hint off.
 *
 * The restart is a remount: a module-level counter bumps on every pointer-down
 * and is the dot's `key`, so its CSS `animation-delay` simply runs again. The
 * parent must be `position: relative` — the dot centres itself on it.
 */

let nonce = 0;
const listeners = new Set<() => void>();
function bump() {
  nonce++;
  listeners.forEach((fn) => fn());
}
function subscribe(fn: () => void) {
  if (listeners.size === 0) document.addEventListener("pointerdown", bump, true);
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0) document.removeEventListener("pointerdown", bump, true);
  };
}

export function GuideHint({ show }: { show: boolean }) {
  const n = useSyncExternalStore(
    subscribe,
    () => nonce,
    () => 0,
  );
  const mounted = useIsMounted();
  if (!show || !mounted || /[?&]nohint\b/.test(window.location.search)) return null;
  return <span key={n} className="agent-hint" aria-hidden="true" />;
}
