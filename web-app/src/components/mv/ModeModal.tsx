"use client";
/* eslint-disable @next/next/no-img-element */

import { MvSheet } from "./MvSheet";
import { DpIcon } from "@/components/ui/DpIcon";
import { COST_RENDER, COST_STORYBOARD, type MvMode } from "@/lib/mv/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: MvMode) => void;
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
 * DP hardcodes "20 Credits" and "200 Credits". They happen to agree with
 * `COST_STORYBOARD` / `COST_RENDER` today, which is exactly how a hardcoded
 * number survives a review and then silently diverges — the Credits IAP slice
 * (3f) found DP's prices already wrong in two places. Both numbers are
 * interpolated from the domain constants that the provider actually charges.
 *
 * Both tag icons are real `<img>`: `.mv-mode-card__tag-icon` sets width and
 * height and nothing else, so a mask span there has no background to clip. The
 * card icons above them ARE masks (`background-color: currentColor`).
 */
export function ModeModal({ open, onClose, onSelect }: Props) {
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
            {COST_STORYBOARD} Credits
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
            {COST_RENDER} Credits
          </span>
        </div>
      </button>
    </MvSheet>
  );
}
