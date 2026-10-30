"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { DpIcon } from "@/components/ui/DpIcon";
import { useEscapeToClose } from "@/components/ui/useDialogTransition";
import { GENRES, MOODS, VOCALS } from "@/lib/mv/mock";

export interface SongStyle {
  genre: string;
  mood: string;
  vocal: string | null;
}

/**
 * Song Style sheet (product owner, 2026-10-30) — opened from the Home Song
 * input's "Song Style" button. Close (✕) discards, confirm (✓) applies; the
 * picks are a draft until then. Same rules as `/song/create`'s STYLE block:
 * every field optional and single-select (tap the picked chip to clear it),
 * and VOCAL is not offered while Instrumental is on. Options come from the
 * same `GENRES` / `MOODS` / `VOCALS` lists, so a pick made here is a value the
 * song contract already accepts.
 *
 * The shell is the Agent's `.agent-sheet` (a centred dialog on desktop, a
 * bottom sheet on phones); chips are DP's `.chip`.
 */
export function SongStyleSheet({
  open,
  value,
  instrumental,
  onApply,
  onClose,
}: {
  open: boolean;
  value: SongStyle;
  instrumental: boolean;
  onApply: (style: SongStyle) => void;
  onClose: () => void;
}) {
  useEscapeToClose(open, onClose);
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <SheetBody value={value} instrumental={instrumental} onApply={onApply} onClose={onClose} />,
    document.body,
  );
}

function SheetBody({
  value,
  instrumental,
  onApply,
  onClose,
}: {
  value: SongStyle;
  instrumental: boolean;
  onApply: (style: SongStyle) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const groups: { key: keyof SongStyle; label: string; optional?: boolean; options: string[] }[] = [
    { key: "genre", label: "GENRE", options: GENRES },
    { key: "mood", label: "MOOD", options: MOODS },
    ...(instrumental ? [] : [{ key: "vocal" as const, label: "VOCAL", optional: true, options: VOCALS }]),
  ];

  return (
    <div className="agent-sheet">
      <div className="agent-sheet__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="agent-sheet__panel song-style" role="dialog" aria-modal="true" aria-label="Song Style">
        <div className="agent-sheet__top">
          <button type="button" className="agent-sheet__close" onClick={onClose} aria-label="Close">
            <DpIcon name="ic_close" className="agent-sheet__close-icon" />
          </button>
          <h2 className="agent-sheet__title">Song Style</h2>
          <button
            type="button"
            className="song-style__done"
            onClick={() => onApply(instrumental ? { ...draft, vocal: null } : draft)}
            aria-label="Apply"
          >
            <DpIcon name="ic_check" className="song-style__done-icon" />
          </button>
        </div>

        <div className="song-style__body">
          {groups.map((g) => (
            <div key={g.key} className="song-style__group" role="group" aria-label={g.label}>
              <p className="song-style__label">
                {g.label}
                {g.optional && <span className="song-style__optional"> (Optional)</span>}
              </p>
              <div className="song-style__chips">
                {g.options.map((o) => {
                  const on = draft[g.key] === o;
                  return (
                    <button
                      key={o}
                      type="button"
                      className={`chip${on ? " chip--selected" : ""}`}
                      aria-pressed={on}
                      onClick={() =>
                        setDraft((d) => ({ ...d, [g.key]: on ? (g.key === "vocal" ? null : "") : o }))
                      }
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
