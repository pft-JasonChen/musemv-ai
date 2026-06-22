"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export function Modal({ open, onClose, title, children, maxWidth = 460 }: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 anim-fade" style={{ background: "rgba(0,0,0,.6)" }} onClick={onClose} aria-hidden />
      <div
        className="anim-pop relative max-h-[88vh] w-full overflow-y-auto no-scrollbar rounded-t-2xl border sm:w-auto sm:rounded-2xl"
        style={{ background: "var(--card)", borderColor: "var(--border-2)", width: "100%", maxWidth }}
      >
        {title && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4" style={{ background: "var(--card)", borderColor: "var(--border-3)" }}>
            <h2 className="text-[17px] font-bold">{title}</h2>
            <button aria-label="Close" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full" style={{ background: "var(--card-2)" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden><path d="M1 1l12 12M13 1L1 13" stroke="var(--text-2)" strokeWidth="1.8" strokeLinecap="round" /></svg>
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
