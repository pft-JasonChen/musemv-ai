"use client";

import { useSyncExternalStore } from "react";
import { demoStore, type DemoFlagKey, type DemoState } from "@/lib/demoStore";

/**
 * Read the demo switchboard. No provider needed — see `src/lib/demoStore.ts`
 * for why this deliberately stays outside the C4 provider surface.
 *
 * ── HOW A SCREEN CONSUMES A FLAG ────────────────────────────────────────────
 *
 * The flag must be the LAST thing that decides what renders, never something
 * that changes the real data path:
 *
 *     const demoEmpty = useDemoFlag("historyEmpty");
 *     const shown = demoEmpty ? [] : rows.filter(…);
 *
 * Not by emptying `HISTORY_SAMPLES` at the source, and not by short-circuiting
 * a provider — a demo switch that mutates real state can leave the app in a
 * state the panel can no longer undo, and it would also change what the
 * PRODUCTION build does when the flag is off. Keep it to a render-time branch.
 */
export function useDemoState(): DemoState {
  return useSyncExternalStore(
    demoStore.subscribe,
    demoStore.getSnapshot,
    demoStore.getServerSnapshot,
  );
}

/** One flag. Returns `false` on the server and on the first client paint. */
export function useDemoFlag(key: DemoFlagKey): boolean {
  return useDemoState().flags[key];
}
