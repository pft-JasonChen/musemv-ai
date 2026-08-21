"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Accessible name for dialogs that render their own custom heading instead of the
   *  sticky title bar. With neither `title` nor `ariaLabel` the dialog has NO
   *  accessible name — a WCAG failure (axe `aria-dialog-name`) that e2e/a11y.spec.ts
   *  cannot catch, because it only visits pages with every modal closed. */
  ariaLabel?: string;
  children: React.ReactNode;
  maxWidth?: number;
}

/**
 * Product owner request, 2026-08-23 — every DP-designed dialog/sheet backdrop
 * in this app (`LoginModal`, `UpgradeDialog`, `CreditsDialog`,
 * `PublishDialog`, `LyricsSheet`, the `MvSheet` family, …) already blurs the
 * page behind it at the same literal `blur(2px)`; this component (the
 * generic WA-authored Delete/Share/Feedback dialog, used at 9+ call sites)
 * was the one gap, with a plain dim scrim and no blur. Matched to the
 * existing value rather than inventing a new one — `--blur-glass` (3px,
 * `tokens.css`) is a different token, for small glass-chrome buttons, not
 * this. Note: `next dev` (Turbopack) drops `backdrop-filter` entirely; only
 * a production build restores it (`postcss-restore-backdrop-filter.mjs`,
 * `AGENTS.md`) — check this in `npm run build`, not dev.
 *
 * ── `z-[100]` -> `z-[1300]`, 2026-08-23 (product owner: "the share button
 *    is missing the function") ────────────────────────────────────────────
 *
 * The button worked exactly as coded — `ShareDialog` (built on this
 * component) opened, mounted, and rendered its real content — but from
 * `/song/play`'s mobile full-screen player it opened invisibly BEHIND that
 * player's own `.song-detail-mobile-player--open` overlay, which is
 * `position: fixed; z-index: 150` (SongDetailPage.css) and, like this
 * component, portals to `document.body` — so the two compete directly on
 * z-index, and 150 beat 100. This component is DP's generic "final action"
 * dialog (Delete/Share/Feedback/Settings' Unsubscribe, 9+ call sites) and
 * has no reason to ever sit below anything else in the app; `1300` clears
 * the highest z-index anywhere in the gated stylesheets
 * (`.face-picker-overlay`, `MVCreatePage.css`, `1200`) rather than just this
 * one 150.
 */

export function Modal({ open, onClose, title, ariaLabel, children, maxWidth = 460 }: Props) {
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
    <div role="dialog" aria-modal="true" aria-label={title ?? ariaLabel} className="fixed inset-0 z-[1300] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 anim-fade"
        style={{
          background: "rgba(0,0,0,.6)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
        }}
        onClick={onClose}
        aria-hidden
      />
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
