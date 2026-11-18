"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { DpIcon } from "@/components/ui/DpIcon";
import { useEscapeToClose } from "@/components/ui/useDialogTransition";
import { DANCE_STYLES } from "@/lib/agent/content";

/**
 * Dance Video's "Dance Style" chip (product owner, 2026-11-18): the same
 * bottom sheet as the Product URL chip's (`LinkSheet`), listing the styles as
 * pills. Picking one fills the chip and closes the sheet. Below them a field
 * takes a style of the user's own (2026-11-18), in the Product URL sheet's
 * input + send row; a typed style re-opens in that field.
 */
export function DanceStyleSheet({
  open,
  value,
  onPick,
  onClose,
}: {
  open: boolean;
  value: string | null;
  onPick: (style: string) => void;
  onClose: () => void;
}) {
  useEscapeToClose(open, onClose);
  if (!open || typeof document === "undefined") return null;
  return createPortal(<StyleBody value={value} onPick={onPick} onClose={onClose} />, document.body);
}

/** Mounted per opening, so the field starts from the current style each time. */
function StyleBody({
  value,
  onPick,
  onClose,
}: {
  value: string | null;
  onPick: (style: string) => void;
  onClose: () => void;
}) {
  const listed = (DANCE_STYLES as readonly string[]).includes(value ?? "");
  const [own, setOwn] = useState(value && !listed ? value : "");
  const typed = own.trim();
  return (
    <div className="agent-sheet">
      <div className="agent-sheet__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="agent-sheet__panel agent-dance" role="dialog" aria-modal="true" aria-label="Dance Style">
        <div className="agent-sheet__top">
          <button type="button" className="agent-sheet__close" onClick={onClose} aria-label="Close">
            <DpIcon name="ic_close" className="agent-sheet__close-icon" />
          </button>
          <h2 className="agent-sheet__title">Dance Style</h2>
          <span className="agent-sheet__spacer" aria-hidden="true" />
        </div>
        <div className="tabs agent-dance__styles">
          {DANCE_STYLES.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={value === s}
              className={`tabs__tab${value === s ? " tabs__tab--active" : ""}`}
              onClick={() => onPick(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <form
          className="agent-link__row agent-dance__own"
          onSubmit={(e) => {
            e.preventDefault();
            if (typed) onPick(typed);
          }}
        >
          <input
            className="agent-link__input"
            value={own}
            onChange={(e) => setOwn(e.target.value)}
            placeholder="Or type your own style…"
            aria-label="Your own dance style"
            maxLength={40}
            spellCheck={false}
          />
          <button
            type="submit"
            className={`agent-send${typed ? " agent-send--on" : ""}`}
            disabled={!typed}
            aria-label="Use this style"
          >
            <DpIcon name="ic_arrow_up" className="agent-send__icon" />
          </button>
        </form>
      </div>
    </div>
  );
}
