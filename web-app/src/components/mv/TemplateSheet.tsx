"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { MvSheet } from "./MvSheet";
import { TEMPLATES } from "@/lib/mv/mock";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Applies the chosen template's prompt to the description field. */
  onApply: (prompt: string) => void;
}

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3g-2) ──────────────────
 *
 * DP source: `TemplateSheet` inside `MVCreatePage.tsx` (Figma "Select a
 * Template", node 346:5071). Classes from
 * `src/styles/designer/MVCreatePage.css` (`.mv-template-sheet__*`), verbatim.
 *
 * NOT one of the five sheets the handoff named — it is the sixth overlay on
 * this screen, and slice 3g left it as an inline Tailwind `Modal` inside
 * `MvRoom`. Migrating it here rather than leaving one un-ported overlay behind
 * on an otherwise-migrated screen (that mix is exactly what 3g's own header
 * argued against).
 *
 * ── DP'S INTERACTION MODEL IS ADOPTED; ITS CONTENT MODEL IS NOT ─────────────
 *
 * DP picks a RENDER STYLE and previews it as video. WA's templates fill the
 * description with a `prompt` — a different feature that happens to share the
 * word. So the data stays WA's (`TEMPLATES`), and what is ported is DP's shape:
 * select a thumbnail, see it large, then Cancel/Confirm. WA's previous version
 * applied on the first click with no preview at all.
 *
 * One deviation, because WA has no template videos — only cover stills:
 * `.mv-template-sheet__preview video` is an ELEMENT selector, so an `<img>`
 * inside that box matches no rule and is left unsized inside an
 * `overflow: hidden` 16/9 frame. The four fitting declarations are applied
 * inline rather than adding a rule to a stylesheet that is gated byte-for-byte.
 * `.mv-template-sheet__thumb` is class-based and needs no such help.
 */
export function TemplateSheet({ open, onClose, onApply }: Props) {
  const [selectedId, setSelectedId] = useState(TEMPLATES[0].id);
  const selected = TEMPLATES.find((t) => t.id === selectedId) ?? TEMPLATES[0];

  return (
    <MvSheet
      open={open}
      onClose={onClose}
      label="Select a Template"
      title="Select a Template"
      variant="mv-template-sheet"
      confirm={{ onConfirm: () => onApply(selected.prompt), ariaLabel: "Apply" }}
    >
      <div className="mv-template-sheet__preview">
        <img
          src={selected.cover}
          alt=""
          style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      <div className="mv-template-sheet__list">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`mv-template-sheet__item${
              t.id === selectedId ? " mv-template-sheet__item--active" : ""
            }`}
            onClick={() => setSelectedId(t.id)}
            aria-pressed={t.id === selectedId}
          >
            <img src={t.cover} alt="" className="mv-template-sheet__thumb" />
            <span className="mv-template-sheet__label">{t.name}</span>
          </button>
        ))}
      </div>
    </MvSheet>
  );
}
