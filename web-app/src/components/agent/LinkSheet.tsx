"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { DpIcon } from "@/components/ui/DpIcon";
import { useEscapeToClose } from "@/components/ui/useDialogTransition";
import { GuideHint } from "./GuideHint";

/**
 * "Product URL" (handoff §1.2): opens with the demo link already pasted; send
 * commits it, an emptied field clears it. YCA draws a fake keyboard because
 * its prototype is a phone frame — on the web the real keyboard does that job,
 * so the field is a real input.
 */
export function LinkSheet({
  open,
  initial,
  onSubmit,
  onClose,
}: {
  open: boolean;
  initial: string;
  onSubmit: (url: string) => void;
  onClose: () => void;
}) {
  useEscapeToClose(open, onClose);
  if (!open || typeof document === "undefined") return null;
  return createPortal(<LinkBody initial={initial} onSubmit={onSubmit} onClose={onClose} />, document.body);
}

function LinkBody({
  initial,
  onSubmit,
  onClose,
}: {
  initial: string;
  onSubmit: (url: string) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(initial);
  return (
    <div className="agent-sheet">
      <div className="agent-sheet__backdrop" onClick={onClose} aria-hidden="true" />
      <form
        className="agent-sheet__panel agent-link"
        role="dialog"
        aria-modal="true"
        aria-label="Product URL"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(url.trim());
        }}
      >
        <div className="agent-sheet__top">
          <button type="button" className="agent-sheet__close" onClick={onClose} aria-label="Close">
            <DpIcon name="ic_close" className="agent-sheet__close-icon" />
          </button>
          <h2 className="agent-sheet__title">Product URL</h2>
          <span className="agent-sheet__spacer" aria-hidden="true" />
        </div>
        <div className="agent-link__row">
          <input
            className="agent-link__input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-label="Product URL"
            autoFocus
            spellCheck={false}
          />
          <button type="submit" className="agent-send agent-send--on" aria-label="Send">
            <DpIcon name="ic_arrow_up" className="agent-send__icon" />
            <GuideHint show />
          </button>
        </div>
      </form>
    </div>
  );
}
