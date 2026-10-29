"use client";
/* eslint-disable @next/next/no-img-element */

import { createPortal } from "react-dom";
import { DpIcon } from "@/components/ui/DpIcon";
import { useEscapeToClose } from "@/components/ui/useDialogTransition";
import { PICKER, PICKER_ALBUMS, type PickerSheet } from "@/lib/agent/content";
import { GuideHint } from "./GuideHint";

/**
 * The phone photo album, as YCA draws it (handoff §3.2): `Recents` or
 * `Sample Photos` selected in the album strip, a camera tile first, then the
 * grid. Cell art is YCA's own picker cut (`pk/`).
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

  const cells: React.ReactNode[] = [];
  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < 3; c++) {
      if (r === 0 && c === 0) {
        cells.push(
          <span key="cam" className="agent-picker__cam" aria-hidden="true">
            <DpIcon name="ic_camera" className="agent-picker__cam-icon" />
          </span>,
        );
        continue;
      }
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
      <div className="agent-sheet__panel agent-picker" role="dialog" aria-modal="true" aria-label={g.title}>
        <div className="agent-sheet__top">
          <button type="button" className="agent-sheet__close" onClick={onClose} aria-label="Close">
            <DpIcon name="ic_close" className="agent-sheet__close-icon" />
          </button>
          <h2 className="agent-sheet__title">{g.title}</h2>
          <span className="agent-sheet__spacer" aria-hidden="true" />
        </div>
        <div className="agent-picker__albums" aria-hidden="true">
          {PICKER_ALBUMS.map((name, i) => (
            <span key={name} className={`agent-picker__album${i === g.album ? " agent-picker__album--on" : ""}`}>
              {name}
            </span>
          ))}
        </div>
        <div className="agent-picker__grid">{cells}</div>
      </div>
    </div>,
    document.body,
  );
}
