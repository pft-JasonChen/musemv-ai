"use client";
/* eslint-disable @next/next/no-img-element */

import { MvSheet } from "./MvSheet";
import { DpIcon } from "@/components/ui/DpIcon";
import type { MvMode } from "@/lib/mv/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: MvMode) => void;
  /** Spec 11 §3.3 — tiered on the song's trimmed length. */
  storyboardCost: number;
  /** Spec 11 §3.2 — `45 + N×sec`, N from MV type × resolution. */
  directCost: number;
}

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3g-2) ──────────────────
 *
 * DP source: `ModeSheet` inside `MVCreatePage.tsx` (Figma "How Would You Like
 * to Create", node 53:53). Classes from `src/styles/designer/MVCreatePage.css`
 * (`.mv-mode-sheet__*`, `.mv-mode-card__*`), verbatim.
 *
 * Header is a close button alone — no title, no spacer — which is what
 * `.mv-mode-sheet .mv-sheet__header { justify-content: flex-end }` is for. No
 * footer either: each card IS the confirming action.
 *
 * ── S20: THE CREDIT COSTS COME FROM WA, NOT FROM DP'S MARKUP ────────────────
 *
 * DP hardcodes "20 Credits" and "200 Credits". They used to agree with the two
 * placeholder constants, which is exactly how a hardcoded number survives a
 * review and then silently diverges — the Credits IAP slice (3f) found DP's
 * prices already wrong in two places.
 *
 * Since 2026-08-19 they are not constants at all: spec 11 prices both scenarios
 * from the SONG's trimmed length (and the direct render also from MV type and
 * resolution), so the same dialog shows different numbers for a 30s and a 60s
 * track. The caller computes them and passes them in — this sheet stays
 * presentational. DP's two literals are now wrong at essentially every length,
 * which is `DESIGNER-TODO` A24.
 *
 * Both tag icons are real `<img>`: `.mv-mode-card__tag-icon` sets width and
 * height and nothing else, so a mask span there has no background to clip. The
 * card icons above them ARE masks (`background-color: currentColor`).
 */
export function ModeModal({ open, onClose, onSelect, storyboardCost, directCost }: Props) {
  return (
    <MvSheet
      open={open}
      onClose={onClose}
      label="How would you like to create?"
      variant="mv-mode-sheet"
    >
      <div className="mv-mode-sheet__intro">
        <p className="mv-mode-sheet__headline">How would you like to create?</p>
        <p className="mv-mode-sheet__sub">
          Choose your creative workflow. You can always adjust later.
        </p>
      </div>

      <button
        type="button"
        className="mv-mode-card mv-mode-card--featured"
        onClick={() => onSelect("storyboard_first")}
      >
        <div className="mv-mode-card__top">
          <DpIcon name="ic_script" className="mv-mode-card__icon" />
          <span className="mv-mode-card__badge">Recommended</span>
        </div>
        <p className="mv-mode-card__title">Create Storyboard First</p>
        <p className="mv-mode-card__desc">Review scenes before rendering.</p>
        <div className="mv-mode-card__tags">
          <span className="mv-mode-card__tag">
            <img src="/assets/icons/ui/ic_clock.svg" alt="" className="mv-mode-card__tag-icon" /> ~1
            min
          </span>
          <span className="mv-mode-card__tag mv-mode-card__tag--credit">
            <img src="/assets/icons/ui/ic_credit.svg" alt="" className="mv-mode-card__tag-icon" />{" "}
            {storyboardCost} Credits
          </span>
        </div>
      </button>

      <button type="button" className="mv-mode-card" onClick={() => onSelect("direct")}>
        <div className="mv-mode-card__top">
          <DpIcon name="ic_video_ai" className="mv-mode-card__icon" />
        </div>
        <p className="mv-mode-card__title">Create MV Directly</p>
        <p className="mv-mode-card__desc">Generate your MV instantly.</p>
        <div className="mv-mode-card__tags">
          <span className="mv-mode-card__tag">
            <img src="/assets/icons/ui/ic_clock.svg" alt="" className="mv-mode-card__tag-icon" /> ~2
            min
          </span>
          <span className="mv-mode-card__tag mv-mode-card__tag--credit">
            <img src="/assets/icons/ui/ic_credit.svg" alt="" className="mv-mode-card__tag-icon" />{" "}
            {directCost} Credits
          </span>
        </div>
      </button>
    </MvSheet>
  );
}
