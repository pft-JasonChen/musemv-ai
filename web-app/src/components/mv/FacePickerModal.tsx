"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DpIcon } from "@/components/ui/DpIcon";
import { useDialogTransition, useEscapeToClose } from "@/components/ui/useDialogTransition";

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

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3g-2) ──────────────────
 *
 * DP source: `FacePicker` inside `MVCreatePage.tsx` (Figma "Select a Face",
 * nodes 280:3091 / 280:3131). Classes from
 * `src/styles/designer/MVCreatePage.css` (`.face-picker__*`), verbatim. This
 * one does NOT use `MvSheet` — DP gives it its own block, with a `<button>`
 * backdrop and a header that is a 3-column grid, not the `.mv-sheet` flex row.
 *
 * ── THE ONE PLACE IN THIS SLICE WHERE DP AND WA ARE NOT THE SAME FEATURE ────
 *
 * DP's face picker is a CANNED DEMO. It ignores whatever the user uploaded and
 * always shows one bundled group photo (`demo-detection/group.jpg`) with four
 * hardcoded percentage boxes, fakes a 1.4s "Analyzing photo…" delay, and
 * returns a face INDEX. WA's takes the real uploaded file, lets you position a
 * crop square over it, and returns a real cropped data URL rendered by canvas.
 *
 * Porting DP verbatim would have deleted the ability to use your own photo —
 * the entire point of the "UPLOAD CHARACTER PHOTO" section that opens it. So
 * this follows the rule the rest of the slice follows (DP's appearance, WA's
 * behaviour): DP's shell, header, heading, mobile check / desktop pill and
 * disabled treatment, wrapped around WA's real crop.
 *
 * Consequences worth naming rather than hiding, for G7 to rule on:
 * · DP's `.face-picker__preview` is `aspect-ratio: 1009/519`, sized for its
 *   landscape demo photo. A portrait upload inside a letterbox with
 *   `object-fit: cover` would push the face out of the visible area, so the
 *   preview keeps WA's square. Overridden inline; the designer stylesheets are
 *   gated byte-for-byte and must not gain a rule.
 * · DP's scan line, four face boxes and `.face-picker__faces` strip are only
 *   meaningful with detection data. They render from the existing
 *   `suggestions` prop, which nothing passes today — so the strip is absent,
 *   exactly as it was before this slice. This is not detection being removed;
 *   it never existed here.
 * · The crop square and the size slider have no DP class. Inline styles, for
 *   the same reason as the trim playhead: a class no stylesheet defines paints
 *   nothing and never errors.
 */
export function FacePickerModal({ open, imageUrl, suggestions = [], onClose, onConfirm }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [crop, setCrop] = useState<FaceRegion>({ x: 30, y: 25, size: 40 });
  const drag = useRef<null | "move">(null);
  const [busy, setBusy] = useState(false);
  const { mounted, visible } = useDialogTransition(open);
  useEscapeToClose(open, onClose);

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

  if (!imageUrl || !mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className={`face-picker-overlay${visible ? " face-picker-overlay--visible" : ""}`}>
      <button
        type="button"
        className="face-picker__backdrop"
        onClick={onClose}
        aria-label="Close face selector"
      />
      <section
        className="face-picker"
        role="dialog"
        aria-modal="true"
        aria-labelledby="face-picker-title"
        inert={!open}
      >
        <div className="face-picker__handle" aria-hidden="true" />
        {/* Close FIRST: at >=768px `.face-picker__header > .face-picker__icon-button:first-child`
            is what moves it to the right-hand grid column. DP's tag AND child
            order are both part of the style contract. */}
        <header className="face-picker__header">
          <button
            type="button"
            className="face-picker__icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            <DpIcon name="ic_close" className="face-picker__icon" />
          </button>
          <div className="face-picker__heading">
            <h2 id="face-picker-title" className="face-picker__title">
              Select a Face
            </h2>
            <p className="face-picker__subtitle">
              Drag the square to frame the face you want
              {suggestions.length ? ", or tap a detected face." : "."}
            </p>
          </div>
          {/* Phone-only (`display: none` at >=768px, so it leaves the tab order
              there rather than lingering invisible). Always `--ready`: WA has
              no analysing stage to gate it behind. */}
          <button
            type="button"
            className="face-picker__icon-button face-picker__done face-picker__done--ready"
            onClick={confirm}
            disabled={busy}
            aria-label="Use this face"
          >
            <DpIcon name="ic_check" className="face-picker__icon" />
          </button>
        </header>

        <div className="face-picker__body">
          <div
            ref={wrapRef}
            className="face-picker__preview"
            // Square, not DP's 1009/519 letterbox — see the header note. The
            // 340px cap is WA's own pre-migration size and is load-bearing at
            // desktop: DP's `max-width: 656px` on a 16/9-ish box is 337px tall,
            // but square it is 656px, which pushes "Use This Face" below the
            // fold of `max-height: calc(100dvh - 64px)`.
            style={{
              aspectRatio: "1 / 1",
              maxWidth: 340,
              margin: "0 auto",
              touchAction: "none",
              userSelect: "none",
            }}
            onPointerMove={onMove}
            onPointerUp={() => (drag.current = null)}
            onPointerLeave={() => (drag.current = null)}
          >
            <img src={imageUrl} alt="Uploaded" draggable={false} />
            <span
              aria-hidden="true"
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)" }}
            />
            <div
              onPointerDown={(e) => {
                drag.current = "move";
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              style={{
                position: "absolute",
                cursor: "move",
                left: `${crop.x}%`,
                top: `${crop.y}%`,
                width: `${crop.size}%`,
                height: `${crop.size}%`,
                borderRadius: 6,
                boxShadow: "0 0 0 9999px rgba(0,0,0,.45)",
                border: "2px solid var(--color-accent-purple)",
              }}
            />
          </div>

          <div className="mv-settings__row">
            <div className="mv-settings__row-text">
              <p className="mv-settings__row-title">Size</p>
            </div>
            <input
              type="range"
              min={20}
              max={80}
              value={crop.size}
              onChange={(e) =>
                setCrop((c) => {
                  const size = Number(e.target.value);
                  return { size, x: Math.min(c.x, 100 - size), y: Math.min(c.y, 100 - size) };
                })
              }
              aria-label="Crop size"
              style={{ flex: 1 }}
            />
          </div>

          {suggestions.length > 0 && (
            <>
              <p className="face-picker__label">CHOOSE ONE FACE</p>
              <div className="face-picker__faces">
                {suggestions.map((f, i) => (
                  <button
                    key={i}
                    type="button"
                    className="face-picker__face"
                    onClick={() => setCrop(f)}
                  >
                    <span
                      className="face-picker__crop"
                      style={{
                        backgroundImage: `url("${imageUrl}")`,
                        backgroundPosition: `${f.x}% ${f.y}%`,
                      }}
                      aria-hidden="true"
                    />
                    <span className="face-picker__face-label">Face {i + 1}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          <button type="button" className="face-picker__confirm" onClick={confirm} disabled={busy}>
            {busy ? "Cropping…" : "Use This Face"}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
