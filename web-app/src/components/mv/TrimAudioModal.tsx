"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { formatDuration } from "@/lib/mv/mock";
import type { Song } from "@/lib/mv/types";

interface Props {
  open: boolean;
  song: Song | null;
  onClose: () => void;
  onConfirm: (song: Song) => void;
}

// deterministic pseudo-random bar heights
const BARS = Array.from({ length: 56 }, (_, i) => 0.3 + (Math.sin(i * 1.7) * 0.5 + 0.5) * 0.7);

export function TrimAudioModal({ open, song, onClose, onConfirm }: Props) {
  const total = song?.durationSec && song.durationSec > 0 ? song.durationSec : 180;
  const trackRef = useRef<HTMLDivElement>(null);
  const [startPct, setStartPct] = useState(15);
  const [endPct, setEndPct] = useState(70);
  const drag = useRef<null | "start" | "end">(null);

  function pctFromEvent(clientX: number) {
    const el = trackRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const p = pctFromEvent(e.clientX);
    if (drag.current === "start") setStartPct(Math.min(p, endPct - 5));
    else setEndPct(Math.max(p, startPct + 5));
  }

  const startSec = Math.round((startPct / 100) * total);
  const endSec = Math.round((endPct / 100) * total);

  function confirm() {
    if (!song) return;
    onConfirm({ ...song, durationSec: endSec - startSec, trim: { start: startSec, end: endSec } });
  }

  if (!song) return null;

  return (
    <Modal open={open} onClose={onClose} title="Trim Audio" maxWidth={460}>
      <p className="mb-4 text-[14px]" style={{ color: "var(--text-2)" }}>
        Keep only the part of the audio you like best.
      </p>

      <div className="mb-4 flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--card-2)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={song.art} alt="" className="h-10 w-10 rounded-md object-cover" />
        <div className="min-w-0">
          <div className="truncate text-[14px] font-semibold">{song.title}</div>
          <div className="text-[12px]" style={{ color: "var(--text-2)" }}>{formatDuration(total)}</div>
        </div>
      </div>

      <div className="mb-1 flex justify-between text-[12px]" style={{ color: "var(--text-2)" }}>
        <span>{formatDuration(startSec)}</span>
        <span>{formatDuration(endSec)}</span>
      </div>

      <div
        ref={trackRef}
        className="relative h-16 select-none overflow-hidden rounded-lg"
        style={{ background: "var(--card-2)", touchAction: "none" }}
        onPointerMove={onMove}
        onPointerUp={() => (drag.current = null)}
        onPointerLeave={() => (drag.current = null)}
      >
        <div className="flex h-full items-center gap-[2px] px-2">
          {BARS.map((h, i) => {
            const p = (i / BARS.length) * 100;
            const inRegion = p >= startPct && p <= endPct;
            return (
              <div key={i} className="flex-1 rounded-full" style={{ height: `${h * 100}%`, background: inRegion ? "var(--accent)" : "var(--card-4)" }} />
            );
          })}
        </div>
        <div className="absolute inset-y-0" style={{ left: `${startPct}%`, right: `${100 - endPct}%`, background: "rgba(168,85,247,.16)" }} />
        {(["start", "end"] as const).map((which) => (
          <div
            key={which}
            onPointerDown={(e) => { drag.current = which; e.currentTarget.setPointerCapture(e.pointerId); }}
            className="absolute top-0 bottom-0 w-3 cursor-ew-resize"
            style={{ left: `calc(${which === "start" ? startPct : endPct}% - 6px)` }}
            role="slider"
            aria-label={which === "start" ? "Trim start" : "Trim end"}
            aria-valuenow={which === "start" ? startSec : endSec}
          >
            <div className="mx-auto h-full w-1 rounded-full" style={{ background: "var(--accent)" }} />
          </div>
        ))}
      </div>

      <div className="mt-5 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" onClick={confirm}>Use Trimmed Audio</Button>
      </div>
    </Modal>
  );
}
