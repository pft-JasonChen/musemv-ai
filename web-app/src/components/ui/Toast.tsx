"use client";

import { useToastTimer } from "@/components/ui/useToastTimer";

/**
 * Figma "Popup/Toast" (node 5319:56985) — a short message pill at the bottom
 * centre. `/history` has its own inline copy of this idea; this one exists for
 * the player screens and is the one to reach for next.
 *
 * Returns the node to render plus `show(message)`. A second `show` replaces
 * the first and restarts the timer. Like every toast in the app it stays while
 * hovered or focused (product owner, 2026-10-22) — the timing is
 * `useToastTimer`'s; this file only owns the Figma markup.
 */
export function useToast(durationMs = 2200) {
  const { toast: message, show, hold } = useToastTimer(durationMs);

  const toast = message ? (
    <div className="popup-toast" role="status" {...hold}>
      {message}
    </div>
  ) : null;

  return { show, toast };
}
