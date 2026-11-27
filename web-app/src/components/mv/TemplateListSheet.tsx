"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { MvSheet } from "./MvSheet";
import { useEdgeFadeY } from "@/components/agent/useEdgeFadeY";
import { TEMPLATES, type TemplateOption } from "@/lib/mv/mock";

interface Props {
  open: boolean;
  onClose: () => void;
  /** The template whose prompt is in the description right now, if any. */
  selectedId: string | null;
  /** Apply confirmed with the marked template. Only fires on Apply (which is
   *  disabled while nothing is marked); closing the sheet discards. */
  onApply: (template: TemplateOption) => void;
}

/**
 * "See all" for `/mv/room`'s Start-from-a-Template row (product owner,
 * 2026-11-27): every template at once, as the same 4:3 tiles the row uses.
 *
 * Tapping a tile only MARKS it (tap the marked one again to clear it); the
 * description is not touched until Apply, which is disabled while nothing is
 * marked (product owner, 2026-11-27), and closing the sheet discards the mark.
 * Apply is a header check on phones (`MvSheet`'s `confirm`) and the gradient CTA
 * below the grid on desktop and tablet. Grid and sizing: `.mv-template-list*` in
 * `designer-overrides.css`; the tiles are the row's own `.mv-create__tpl*`, so the
 * ring and tick read the same in both places.
 */
export function TemplateListSheet({ open, onClose, selectedId, onApply }: Props) {
  // The mark starts as whatever is applied each time the sheet opens. Adjusted
  // during render, not in an effect (`react-hooks/set-state-in-effect`).
  const [pendingId, setPendingId] = useState<string | null>(selectedId);
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) setPendingId(selectedId);
  }

  const gridRef = useRef<HTMLDivElement>(null);
  // Opening on a long list with the applied template below the fold: scroll the
  // sheet so it is in view.
  useEffect(() => {
    if (!open) return;
    gridRef.current
      ?.querySelector<HTMLElement>('[aria-pressed="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [open]);

  const marked = TEMPLATES.find((t) => t.id === pendingId) ?? null;
  const apply = () => {
    if (marked) onApply(marked);
  };

  // Fades the grid at whichever edge has more to scroll to (product owner, 2026-11-27).
  const bodyRef = useEdgeFadeY<HTMLDivElement>(open);

  return (
    <MvSheet
      open={open}
      onClose={onClose}
      label="All templates"
      title="Templates"
      variant="mv-template-list"
      // Phones: Apply is the check in the sheet's header, top right (product owner,
      // 2026-11-27) — `MvSheet` draws it only on a phone. Desktop and tablet get the
      // button below the grid instead, and the sheet's own Cancel / Confirm footer
      // is hidden in CSS so the two do not double up.
      confirm={{ onConfirm: apply, disabled: !marked, ariaLabel: "Apply" }}
    >
      <div ref={bodyRef} className="mv-sheet__body">
        <div ref={gridRef} className="mv-template-list__grid">
          {TEMPLATES.map((t) => {
            const on = pendingId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`mv-create__tpl${on ? " mv-create__tpl--active mv-create__tpl--checked" : ""}`}
                aria-pressed={on}
                onClick={() => setPendingId(on ? null : t.id)}
              >
                <img src={t.cover} alt="" className="mv-create__tpl-thumb" />
                <span className="mv-create__tpl-check" aria-hidden="true" />
                <span className="mv-create__tpl-name">{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mv-template-list__actions">
        <button
          type="button"
          className="button button--large button--primary"
          disabled={!marked}
          onClick={apply}
        >
          <span className="button__label">Apply</span>
        </button>
      </div>
    </MvSheet>
  );
}
