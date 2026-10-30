"use client";
/* eslint-disable @next/next/no-img-element */

import { createPortal } from "react-dom";
import { DpIcon } from "@/components/ui/DpIcon";
import { useEscapeToClose } from "@/components/ui/useDialogTransition";
import { PICKER, type PickerSheet } from "@/lib/agent/content";
import { GuideHint } from "./GuideHint";

/**
 * The photo album, after YCA's (handoff §3.2): "Choose Photo" over a grid of
 * YCA's own picker cut (`pk/`). YCA's album strip (Recents / Sample Photos /
 * Favorite / Selfie) is left out, and its camera tile shows on phones only
 * (product owner, 2026-10-30).
 *
 * Every cell is live and every cell gives the same answer — the demo returns
 * the flow's fixed photo whichever one you tap. The hint points at the cell
 * that actually shows that photo. A bottom sheet on phones, a dialog above.
 */
export function PhotoPicker({
  sheet,
  hintCell,
  onPick,
  onClose,
}: {
  sheet: PickerSheet | null;
  hintCell?: readonly [number, number];
  onPick: () => void;
  onClose: () => void;
}) {
  useEscapeToClose(sheet !== null, onClose);
  if (!sheet || typeof document === "undefined") return null;
  const g = PICKER[sheet];

  // The camera tile is a phone affordance: CSS hides it from 768px up.
  const cells: React.ReactNode[] = [
    <span key="cam" className="agent-picker__cam" aria-hidden="true">
      <DpIcon name="ic_camera" className="agent-picker__cam-icon" />
    </span>,
  ];
  for (let r = 0; r < g.rows; r++) {
    for (let c = r === 0 ? 1 : 0; c < 3; c++) {
      const hinted = hintCell?.[0] === r && hintCell?.[1] === c;
      cells.push(
        <button
          key={`${r}${c}`}
          type="button"
          className="agent-picker__cell"
          aria-label={`Photo ${r * 3 + c}`}
          onClick={onPick}
        >
          <img src={g.cell(r, c)} alt="" loading="lazy" />
          <GuideHint show={hinted} />
        </button>,
      );
    }
  }

  return createPortal(
    <div className="agent-sheet">
      <div className="agent-sheet__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="agent-sheet__panel agent-picker" role="dialog" aria-modal="true" aria-label="Choose Photo">
        <div className="agent-sheet__top">
          <button type="button" className="agent-sheet__close" onClick={onClose} aria-label="Close">
            <DpIcon name="ic_close" className="agent-sheet__close-icon" />
          </button>
          <h2 className="agent-sheet__title">Choose Photo</h2>
          <span className="agent-sheet__spacer" aria-hidden="true" />
        </div>
        <div className="agent-picker__grid">{cells}</div>
      </div>
    </div>,
    document.body,
  );
}
