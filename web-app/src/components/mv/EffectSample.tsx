"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { DpIcon } from "@/components/ui/DpIcon";

/** Motion is independent of selection. Observe the image frame (not its label);
 * the browser also clips intersection against the horizontal strip and viewport.
 * Replacing an animated WebP with its cover releases its active image reference.
 */
export function EffectSample({
  sample,
  cover,
  selected,
  enabled,
  replayKey,
  failed,
  onError,
}: {
  sample: string;
  cover: string;
  selected: boolean;
  enabled: boolean;
  replayKey: number;
  failed: boolean;
  onError: () => void;
}) {
  const frameRef = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting && entry.intersectionRatio >= 0.5);
      },
      { threshold: [0, 0.5] },
    );
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);
  const playing = enabled && inView && !failed;
  return (
    <span ref={frameRef} className="effects-dialog__sample-frame">
      <img
        key={replayKey}
        src={playing ? sample : cover}
        alt=""
        onError={playing ? onError : undefined}
      />
      {selected && (
        <span className="effects-dialog__check" aria-hidden="true">
          <DpIcon name="ic_check" className="effects-dialog__check-icon" />
        </span>
      )}
    </span>
  );
}
