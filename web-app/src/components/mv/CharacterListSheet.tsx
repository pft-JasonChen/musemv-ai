"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { MvSheet } from "./MvSheet";
import { useEdgeFadeY } from "@/components/agent/useEdgeFadeY";
import { SAMPLE_CHARACTERS } from "@/lib/mv/mock";

type Character = (typeof SAMPLE_CHARACTERS)[number];

interface Props {
  open: boolean;
  onClose: () => void;
  /** Photos already in a character slot — those cannot be picked again. */
  usedUrls: string[];
  /** How many more characters the room has space for (1 or 2). */
  maxPick: number;
  /** Apply confirmed with the picks, in the order they were chosen. */
  onApply: (picks: Character[]) => void;
}

/**
 * "See all" for `/mv/room`'s Sample Characters row (product owner, 2026-11-27):
 * pick up to two characters at once.
 *
 * Each pick shows its order as a number badge — (1), (2). The numbers are derived
 * from the order of `picked`, so un-picking (1) promotes (2) to (1) with nothing to
 * renumber. Nothing reaches the slots until the Add button (disabled while nothing is
 * picked); closing the sheet discards the picks. Shares the Templates sheet's
 * shell, Apply button and bottom fade (`.mv-template-list*`).
 */
export function CharacterListSheet({ open, onClose, usedUrls, maxPick, onApply }: Props) {
  // Reset on every open — adjusted during render, not in an effect
  // (`react-hooks/set-state-in-effect`).
  const [picked, setPicked] = useState<string[]>([]);
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) setPicked([]);
  }

  const bodyRef = useEdgeFadeY<HTMLDivElement>(open);
  const full = picked.length >= maxPick;

  const toggle = (url: string) =>
    setPicked((cur) => {
      if (cur.includes(url)) return cur.filter((u) => u !== url);
      return cur.length >= maxPick ? cur : [...cur, url];
    });

  // The button says what it does, and how many: "Add 2 Characters" (product owner,
  // 2026-11-27: "Apply" said nothing). Plain "Add Characters" while nothing is picked.
  const label =
    picked.length === 0
      ? "Add Characters"
      : `Add ${picked.length} ${picked.length === 1 ? "Character" : "Characters"}`;
  const apply = () => {
    const picks = picked
      .map((url) => SAMPLE_CHARACTERS.find((c) => c.url === url))
      .filter((c): c is Character => !!c);
    if (picks.length > 0) onApply(picks);
  };

  return (
    <MvSheet
      open={open}
      onClose={onClose}
      label="All sample characters"
      title="Sample Characters"
      variant="mv-template-list mv-character-list"
      confirm={{ onConfirm: apply, disabled: picked.length === 0, ariaLabel: label }}
    >
      <div ref={bodyRef} className="mv-sheet__body">
        <div className="mv-character-list__grid">
          {SAMPLE_CHARACTERS.map((c) => {
            const order = picked.indexOf(c.url) + 1; // 0 when not picked
            const used = usedUrls.includes(c.url);
            const blocked = used || (full && order === 0);
            return (
              <button
                key={c.url}
                type="button"
                className={`mv-create__face${order ? " mv-create__face--picked" : ""}`}
                aria-pressed={order > 0}
                aria-disabled={blocked || undefined}
                aria-label={order ? `${c.name}, pick ${order}` : c.name}
                onClick={() => {
                  if (!used) toggle(c.url);
                }}
              >
                <img src={c.url} alt="" className="mv-create__face-thumb" />
                {order > 0 && (
                  <span className="mv-create__face-badge" aria-hidden="true">
                    {order}
                  </span>
                )}
                <span className="mv-create__face-name">{c.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mv-template-list__actions">
        <button
          type="button"
          className="button button--large button--primary"
          disabled={picked.length === 0}
          onClick={apply}
        >
          <span className="button__label">{label}</span>
        </button>
      </div>
    </MvSheet>
  );
}
