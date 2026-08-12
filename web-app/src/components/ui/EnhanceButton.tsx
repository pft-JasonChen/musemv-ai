"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { EnhanceKind } from "@/lib/api/contract";

export interface EnhanceDirection {
  kind: EnhanceKind;
  label: string;
  sub: string;
}

interface Props {
  /** Current text. The button hides itself when this is empty. */
  value: string;
  /** Context used when there are no `directions` (single-shot enhance). */
  kind: EnhanceKind;
  /** Called with the enhanced text to write back into the field. */
  onEnhanced: (text: string) => void;
  /** If provided, clicking first opens a small "what to enhance?" menu. */
  directions?: EnhanceDirection[];
  className?: string;
  /**
   * Render DP's markup instead of WA's Tailwind pill (`bem` = the block prefix,
   * e.g. `"mv-create"`). A migrated screen may not mix Tailwind utilities into
   * its markup (G3-d), and this pill sits inside `.mv-create__input-footer` —
   * but the BEHAVIOUR here (the `api.enhancePrompt` round-trip and SONG-04's
   * free-first-then-charge rule, G5-d #10) is the thing that must not be
   * duplicated. So the component keeps the logic and swaps its skin.
   *
   * DP's own version has neither the credit cost badge nor the direction menu,
   * so on a DP-skinned instance those simply do not render; no caller uses both.
   */
  bem?: string;
}

/**
 * "Enhance with AI" pill. Rewrites the adjacent text field via
 * `api.enhancePrompt`. Shows a spinner while working; when `directions` are
 * given it first opens a menu (used by the custom-lyrics box: Refine Idea vs
 * Refine Lyrics), matching the mobile prototype.
 */
export function EnhanceButton({ value, kind, onEnhanced, directions, className, bem }: Props) {
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  if (!value.trim()) return null;

  async function run(k: EnhanceKind) {
    setMenuOpen(false);
    // AI Enhance is FREE — it costs no credits (spec area 11 §5.5, product decision
    // 2026-08-12, closing TBD-CC-03). This used to charge 1 credit after the first
    // use per session (the old SONG-04 wording) via `useCredits().consumeEnhance`;
    // that call, its `enhanceCost` badge, and both provider keys are gone. There is
    // no cloud-config action for Enhance, so charging for it was never in the
    // approved credit model in the first place.
    setBusy(true);
    try {
      onEnhanced(await api.enhancePrompt({ text: value, kind: k }));
    } finally {
      setBusy(false);
    }
  }

  function onClick() {
    if (busy) return;
    if (directions && directions.length) setMenuOpen((o) => !o);
    else void run(kind);
  }

  if (bem) {
    // DP's shape: one button, a mask icon that spins while working, and the
    // word "Enhance". `ic_refresh` while busy is DP's own choice of spinner.
    const url = `url("/assets/icons/ui/${busy ? "ic_refresh" : "ic_edit_ai"}.svg")`;
    return (
      <button
        type="button"
        className={`${bem}__enhance-btn`}
        onClick={onClick}
        disabled={busy}
        aria-label="Enhance"
      >
        <span
          className={`${bem}__enhance-icon${busy ? ` ${bem}__enhance-icon--spinning` : ""}`}
          style={{ maskImage: url, WebkitMaskImage: url }}
          aria-hidden="true"
        />
        Enhance
      </button>
    );
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-label="Enhance with AI"
        className={`inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-black transition-all hover:brightness-90 disabled:opacity-70 ${className ?? ""}`}
      >
        {busy ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-spin"
            aria-hidden
          >
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" />
          </svg>
        ) : (
          <img src="/assets/icons/ui/ic_edit_ai.svg" width={14} height={14} alt="" />
        )}
        {busy ? "Enhancing…" : "Enhance"}
      </button>

      {menuOpen && directions && (
        <div
          className="absolute right-0 z-30 mt-1 w-60 overflow-hidden rounded-xl p-1 shadow-xl"
          style={{ background: "var(--card-3)", border: "1px solid var(--border-2)" }}
        >
          <div className="px-3 py-2 text-[11px] font-semibold" style={{ color: "var(--text-3)" }}>
            What would you like to enhance?
          </div>
          {directions.map((d) => (
            <button
              key={d.kind}
              type="button"
              onClick={() => run(d.kind)}
              className="block w-full rounded-lg px-3 py-2 text-left transition-all hover:brightness-125"
              style={{ background: "transparent" }}
            >
              <div className="text-[13px] font-semibold">{d.label}</div>
              <div className="text-[11px]" style={{ color: "var(--text-3)" }}>
                {d.sub}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
