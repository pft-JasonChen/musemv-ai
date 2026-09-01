"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
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
  /**
   * Which screen is borrowing this crop (product owner, 2026-09-01).
   *
   * `"face"` (default) is `/mv/room`'s **Select a Face** — square-cornered
   * frame, face-detection suggestions, MV-character copy.
   * `"avatar"` is `/profile`'s **Edit Profile Picture** — the SAME crop
   * mechanics with a CIRCULAR frame and avatar copy, because the product owner
   * asked for the profile upload to reuse this dialog rather than get a second
   * crop implementation. Only the frame shape and the three strings differ;
   * the drag/scale/canvas-crop path below is shared, which is the point.
   */
  variant?: "face" | "avatar";
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
 * · DP's `.face-picker__preview` was `aspect-ratio: 1009/519` (a wide
 *   letterbox), then briefly a fixed 420x315 (4:3) box (2026-08-14, matching
 *   Figma node 2404:124513 as it stood that day). Product owner request,
 *   same day, follow-up: the box must show the WHOLE image (DP's own
 *   `object-fit: cover` box, and WA's earlier square/4:3 versions alike,
 *   both crop whatever doesn't fit the box's fixed ratio) and stay within
 *   300-400px on both axes — no aspect ratio is fixed anymore. `boxRatio`
 *   (measured live via `ResizeObserver`, same pattern as `SongPlayBar.tsx`'s
 *   `sidebarWidth`) is what makes THAT work: the box's own rendered
 *   width/height now come from the image's intrinsic ratio via
 *   `designer-overrides.css`'s `object-fit: contain` + min/max rules on
 *   `.face-picker__preview > img`, not a fixed number here, so the crop
 *   square's on-screen height has to be corrected by whatever that ratio
 *   turns out to be for THIS image — see the crop handle's `height` below.
 * · DP's scan line, four face boxes and `.face-picker__faces` strip are only
 *   meaningful with detection data. They render from the existing
 *   `suggestions` prop, which nothing passes today — so the strip is absent,
 *   exactly as it was before this slice. This is not detection being removed;
 *   it never existed here.
 * · The crop square and the size slider have no DP class. Inline styles, for
 *   the same reason as the trim playhead: a class no stylesheet defines paints
 *   nothing and never errors. The slider's track/thumb ARE now styled (2026-
 *   08-14, `designer-overrides.css`, matching Figma's "Control/Media
 *   Controller/Dt") via `::-webkit-slider-thumb`/`::-moz-range-thumb` on the
 *   plain `<input type="range">` — no new component needed for that part.
 * · `crop.size` is documented (see `FaceRegion`) as "% of width", and
 *   `cropToDataUrl` below was ALREADY correct under that contract — it always
 *   draws a source-pixel-square `s x s` region regardless of how the box is
 *   displayed. The bug this same-day follow-up fixes is purely visual: the
 *   ON-SCREEN overlay reused `crop.size` for both width% and height%, which
 *   is only a square in PIXELS when the box itself is square. Once the box's
 *   width and height can differ (this request), that stopped being true, so
 *   the overlay's `height` is now `crop.size * boxRatio` — same width in
 *   pixels, expressed as whatever percentage-of-height that takes to match.
 */
const COPY = {
  face: {
    title: "Select a Face",
    cta: "Use This Face",
    busyCta: "Cropping…",
    closeLabel: "Close face selector",
    doneLabel: "Use this face",
  },
  avatar: {
    title: "Edit Profile Picture",
    subtitle: "Move and scale the box to select your avatar area.",
    cta: "Set as Profile Picture",
    busyCta: "Saving…",
    closeLabel: "Close profile picture editor",
    doneLabel: "Set as profile picture",
  },
} as const;

export function FacePickerModal({
  open,
  imageUrl,
  suggestions = [],
  onClose,
  onConfirm,
  variant = "face",
}: Props) {
  const isAvatar = variant === "avatar";
  const copy = COPY[variant];
  const wrapRef = useRef<HTMLDivElement>(null);
  // Designer request, 2026-08-11: the Size slider should open centered in
  // its 20–80 range (50), not offset toward one end.
  const [crop, setCrop] = useState<FaceRegion>({ x: 30, y: 25, size: 50 });
  const drag = useRef<null | "move">(null);
  const [busy, setBusy] = useState(false);
  const { mounted, visible } = useDialogTransition(open);
  useEscapeToClose(open, onClose);

  // Product owner request, 2026-08-14 — the box now sizes itself to the
  // image's own ratio (see the header note), so it isn't square/4:3 anymore
  // and `crop.size` (a single "% of width" value) can no longer be reused
  // directly for the overlay's height. `width / height`, measured live —
  // same `ResizeObserver` pattern as `SongPlayBar.tsx`'s `sidebarWidth` —
  // rather than computed from `naturalWidth`/`naturalHeight` directly,
  // because the RENDERED box is what the overlay actually sits inside; that
  // box's ratio matches the image's natural one once loaded, but reading the
  // element itself avoids the two ever being able to disagree.
  const [boxRatio, setBoxRatio] = useState(1);

  /**
   * Measure the RENDERED preview box's aspect ratio.
   *
   * Pulled out of the effect and given to the `<img>`'s `onLoad` as well
   * (2026-09-01) — see the effect below for why the ResizeObserver alone was
   * not enough.
   */
  const measureBox = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) setBoxRatio(r.width / r.height);
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    measureBox();
    const observer = new ResizeObserver(measureBox);
    observer.observe(el);
    return () => observer.disconnect();
  }, [imageUrl, mounted, measureBox]);

  function onMove(e: React.PointerEvent) {
    if (drag.current !== "move" || !wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * 100;
    const py = ((e.clientY - r.top) / r.height) * 100;
    setCrop((c) => {
      const h = c.size * boxRatio;
      return {
        ...c,
        x: Math.min(100 - c.size, Math.max(0, px - c.size / 2)),
        y: Math.min(100 - h, Math.max(0, py - h / 2)),
      };
    });
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
        aria-label={copy.closeLabel}
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
              {copy.title}
            </h2>
            <p className="face-picker__subtitle">
              {isAvatar ? (
                COPY.avatar.subtitle
              ) : (
                <>
                  Drag the square to frame the face you want
                  {suggestions.length ? ", or tap a detected face." : "."}
                </>
              )}
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
            aria-label={copy.doneLabel}
          >
            <DpIcon name="ic_check" className="face-picker__icon" />
          </button>
        </header>

        <div className="face-picker__body">
          <div
            ref={wrapRef}
            className="face-picker__preview"
            // No fixed size here — the box now shrink-wraps to whatever size
            // `designer-overrides.css` computes for the `<img>` itself
            // (intrinsic ratio, clamped to 300-400px both axes, `object-fit:
            // contain` so the whole image is always visible). `margin: 0
            // auto` only matters once the box is narrower than its flex
            // column parent.
            style={{
              margin: "0 auto",
              touchAction: "none",
              userSelect: "none",
            }}
            onPointerMove={onMove}
            onPointerUp={() => (drag.current = null)}
            onPointerLeave={() => (drag.current = null)}
          >
            {/* `onLoad` re-measures, and it is NOT redundant with the
                ResizeObserver above — it is the trigger that was missing.
                MEASURED 2026-09-01: before the image loads, the CSS min/max
                clamps on `.face-picker__preview > img` give it a SQUARE box, so
                the effect's first `measureBox()` records `boxRatio === 1`. The
                observer did not correct it once the real 4:3 image settled the
                box to 384×288 — probed live, `boxRatio` was still `1.0000001`
                against a box that measured 384×288.

                The consequence was not cosmetic: the frame was drawn at
                `crop.size`% of BOTH axes (192×144) while `cropToDataUrl` has
                always cut a SQUARE `s × s` region, so the area a user framed
                was never the area they got. That has been true on `/mv/room`'s
                Select a Face since the 2026-08-14 `boxRatio` change — it only
                became visible here because a circular frame turns the same
                rectangle into an obvious ellipse. */}
            <img src={imageUrl} alt="Uploaded" draggable={false} onLoad={measureBox} />
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
                // `boxRatio` correction (2026-08-14) — see the header note.
                // Same pixel size as `width` above, expressed as whatever
                // %-of-height that takes once the box isn't square/4:3.
                height: `${crop.size * boxRatio}%`,
                // 12px radius / ~2.6px border — Figma's exact values
                // (`--radius/sm`, 2.625px), 2026-08-14.
                //
                // The avatar variant makes it a CIRCLE (product owner,
                // 2026-09-01). `50%` is a true circle here, not an ellipse,
                // because the box is already pixel-SQUARE — `height` above is
                // `crop.size * boxRatio`, i.e. the same pixel length as
                // `width` expressed as a percentage of a different axis. If
                // that ratio correction is ever removed, this becomes an oval.
                borderRadius: isAvatar ? "50%" : 12,
                boxShadow: "0 0 0 9999px rgba(0,0,0,.45)",
                border: "2.6px solid var(--color-accent-purple)",
              }}
            />
          </div>

          <div className="mv-settings__row">
            {/* Designer fix, 2026-08-11: NOT `.mv-settings__row-text` — that
                class carries `flex: 1` (correct for its real usage: a
                label+description column that fills the row next to a small
                fixed-width toggle). Reusing it here made the bare "Size"
                label ALSO stretch to an even 50/50 split against the
                slider's own `flex: 1`, leaving a huge gap between the two.
                The label just needs to hug its own text. */}
            <p className="mv-settings__row-title">Size</p>
            <input
              type="range"
              min={20}
              max={80}
              value={crop.size}
              onChange={(e) =>
                setCrop((c) => {
                  const size = Number(e.target.value);
                  const h = size * boxRatio;
                  return { size, x: Math.min(c.x, 100 - size), y: Math.min(c.y, 100 - h) };
                })
              }
              aria-label="Crop size"
              // `--range-progress` drives the filled-track effect in
              // designer-overrides.css (Figma's "Juice" — the purple portion
              // up to the thumb) — plain CSS can't read an <input>'s own
              // value, so the percentage is computed here and read back via
              // `var(--range-progress)`.
              style={
                { flex: 1, "--range-progress": `${((crop.size - 20) / 60) * 100}%` } as CSSProperties
              }
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
            {busy ? copy.busyCta : copy.cta}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
