"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface FaceRegion {
  x: number; // % left
  y: number; // % top
  size: number; // % of width
}

interface Props {
  open: boolean;
  imageUrl: string | null;
  /** optional detected-face regions (e.g. for a group photo) */
  suggestions?: FaceRegion[];
  onClose: () => void;
  onConfirm: (dataUrl: string) => void;
}

async function cropToDataUrl(src: string, r: FaceRegion): Promise<string> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
  const sx = (r.x / 100) * img.naturalWidth;
  const sy = (r.y / 100) * img.naturalHeight;
  const s = (r.size / 100) * img.naturalWidth;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, sx, sy, s, s, 0, 0, 256, 256);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export function FacePickerModal({ open, imageUrl, suggestions = [], onClose, onConfirm }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState<FaceRegion>({ x: 30, y: 25, size: 40 });
  const drag = useRef<null | "move">(null);
  const [busy, setBusy] = useState(false);

  function onMove(e: React.PointerEvent) {
    if (drag.current !== "move" || !wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * 100;
    const py = ((e.clientY - r.top) / r.height) * 100;
    setCrop((c) => ({
      ...c,
      x: Math.min(100 - c.size, Math.max(0, px - c.size / 2)),
      y: Math.min(100 - c.size, Math.max(0, py - c.size / 2)),
    }));
  }

  async function confirm() {
    if (!imageUrl) return;
    setBusy(true);
    try {
      const url = await cropToDataUrl(imageUrl, crop);
      onConfirm(url);
    } catch {
      onConfirm(imageUrl); // fallback to original if crop fails
    } finally {
      setBusy(false);
      onClose();
    }
  }

  if (!imageUrl) return null;

  return (
    <Modal open={open} onClose={onClose} title="Select a Face" maxWidth={460}>
      <p className="mb-3 text-[13px]" style={{ color: "var(--text-2)" }}>
        Drag the square to frame the face you want{suggestions.length ? ", or tap a detected face." : "."}
      </p>

      <div
        ref={wrapRef}
        className="relative mx-auto w-full overflow-hidden rounded-xl select-none"
        style={{ maxWidth: 340, aspectRatio: "1 / 1", background: "var(--card-2)", touchAction: "none" }}
        onPointerMove={onMove}
        onPointerUp={() => (drag.current = null)}
        onPointerLeave={() => (drag.current = null)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Uploaded" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,.45)" }} />
        {/* crop window */}
        <div
          onPointerDown={(e) => { drag.current = "move"; e.currentTarget.setPointerCapture(e.pointerId); }}
          className="absolute cursor-move rounded-md"
          style={{
            left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.size}%`, height: `${crop.size}%`,
            boxShadow: "0 0 0 9999px rgba(0,0,0,.45)", border: "2px solid var(--accent)",
          }}
        >
          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-sm" style={{ background: "var(--accent)" }} />
        </div>
      </div>

      {/* size control */}
      <div className="mt-4 flex items-center gap-3">
        <span className="text-[12px]" style={{ color: "var(--text-2)" }}>Size</span>
        <input
          type="range" min={20} max={80} value={crop.size}
          onChange={(e) => setCrop((c) => { const size = Number(e.target.value); return { size, x: Math.min(c.x, 100 - size), y: Math.min(c.y, 100 - size) }; })}
          className="flex-1" aria-label="Crop size"
        />
      </div>

      {suggestions.length > 0 && (
        <div className="mt-3">
          <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>Detected faces</div>
          <div className="flex gap-2">
            {suggestions.map((f, i) => (
              <button key={i} onClick={() => setCrop(f)} className="rounded-lg px-3 py-1.5 text-[12px] font-semibold" style={{ background: "var(--card-2)" }}>
                Face {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1" onClick={confirm} disabled={busy}>{busy ? "Cropping…" : "Use This Face"}</Button>
      </div>
    </Modal>
  );
}
