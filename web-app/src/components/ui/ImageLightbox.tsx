"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { DpIcon } from "./DpIcon";

/**
 * Shared "click an expand icon → full-screen enlarged image" lightbox —
 * extracted 2026-09-22 on its second consumer (`MvEditor.tsx`'s Cover
 * Image; `StoryboardEditor.tsx`'s character image is the first to move
 * onto it). Both had their own bespoke inline implementation; `MvEditor`'s
 * is the one kept — product owner asked for `StoryboardEditor`'s to match
 * it exactly, not the other way round, after its own inline version turned
 * out to nest the image in an extra sizing box that put the close button at
 * the IMAGE's corner instead of the screen's. Classes here
 * (`image-lightbox-*`) are copied verbatim from `MvEditor`'s original
 * `.mv-edit__lightbox-*` values in `designer-overrides.css`.
 *
 * Portalled to `document.body` for the same reason `MvEditor`'s other
 * overlays already are — `.app-layout__content` sets `z-index: 1` on
 * itself, trapping any descendant's `z-index` below `MobileHeader`/
 * `MobileTabBar` (`z-index: 20`); escaping to `<body>` sidesteps that
 * stacking context entirely.
 */
export function ImageLightbox({
  src,
  alt,
  open,
  onClose,
}: {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="image-lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <button type="button" className="image-lightbox-close" onClick={onClose} aria-label="Close">
        <DpIcon name="ic_close" className="image-lightbox-close-icon" />
      </button>
      <img src={src} alt="" className="image-lightbox-image" onClick={(e) => e.stopPropagation()} />
    </div>,
    document.body,
  );
}
