"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Figma "Popup/Toast" (node 5319:56985) — a short message pill at the bottom
 * centre. `/history` has its own inline copy of this idea; this one exists for
 * the player screens and is the one to reach for next.
 *
 * Returns the node to render plus `show(message)`. A second `show` replaces
 * the first and restarts the timer.
 */
export function useToast(durationMs = 2200) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = useCallback(
    (next: string) => {
      window.clearTimeout(timer.current);
      setMessage(next);
      timer.current = window.setTimeout(() => setMessage(null), durationMs);
    },
    [durationMs],
  );

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const toast = message ? (
    <div className="popup-toast" role="status">
      {message}
    </div>
  ) : null;

  return { show, toast };
}
