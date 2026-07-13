"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";
import { activeLineIndex, type TimedLine } from "@/lib/mv/lyrics";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  cover: string;
  lines: TimedLine[];
  currentSec: number;
  durationSec: number;
  playing: boolean;
  onTogglePlay: () => void;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, "0")}`;

/**
 * Display Lyrics — synced, auto-scrolling lyrics.
 * Desktop: slides in as a right-docked side panel. Mobile (< sm): rises as a
 * bottom sheet. The active line is centered as playback advances; a manual
 * wheel/touch scroll pauses auto-scroll for 2s.
 */
export function LyricsPanel({ open, onClose, title, cover, lines, currentSec, durationSec, playing, onTogglePlay }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const userScrollingRef = useRef(false);
  const userTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeIdx = activeLineIndex(lines, currentSec);

  // Manual scroll pauses auto-scroll briefly (detect intent via wheel/touch, not
  // scroll events, so our own smooth-scroll doesn't count as user scrolling).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onUser = () => {
      userScrollingRef.current = true;
      if (userTimer.current) clearTimeout(userTimer.current);
      userTimer.current = setTimeout(() => { userScrollingRef.current = false; }, 2000);
    };
    el.addEventListener("wheel", onUser, { passive: true });
    el.addEventListener("touchmove", onUser, { passive: true });
    return () => {
      el.removeEventListener("wheel", onUser);
      el.removeEventListener("touchmove", onUser);
      if (userTimer.current) clearTimeout(userTimer.current);
    };
  }, []);

  // Center the active line as it changes (and when the panel opens).
  useEffect(() => {
    if (!open || userScrollingRef.current) return;
    const el = scrollRef.current;
    const line = lineRefs.current[activeIdx];
    if (!el || !line) return;
    el.scrollTo({ top: line.offsetTop - el.clientHeight / 2 + line.clientHeight / 2, behavior: "smooth" });
  }, [activeIdx, open]);

  // Esc closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-[100] ${open ? "" : "pointer-events-none"}`} aria-hidden={!open} inert={!open}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        style={{ background: "rgba(0,0,0,.5)" }}
      />

      {/* Panel: bottom sheet on mobile, right side panel on sm+ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Lyrics"
        className={`absolute flex flex-col overflow-hidden transition-transform duration-300
          inset-x-0 bottom-0 h-[78vh] rounded-t-2xl
          sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:w-[400px] sm:rounded-none
          ${open ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"}`}
        style={{ background: "var(--card)", boxShadow: "0 10px 40px rgba(0,0,0,.5)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <div className="w-9" />
          <div className="text-[15px] font-bold">Lyrics</div>
          <button aria-label="Close lyrics" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        {/* Mini player */}
        <div className="mx-5 mb-3 flex items-center gap-3 rounded-xl p-2.5" style={{ background: "var(--card-2)" }}>
          <img src={cover} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold">{title}</div>
            <div className="text-[11px] tabular-nums" style={{ color: "var(--text-3)" }}>{fmt(currentSec)} / {fmt(durationSec)}</div>
          </div>
          <button aria-label={playing ? "Pause" : "Play"} onClick={onTogglePlay} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-black">
            {playing
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden><polygon points="6,4 20,12 6,20" /></svg>}
          </button>
        </div>

        {/* Synced lyrics */}
        <div className="relative min-h-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12" style={{ background: "linear-gradient(var(--card), transparent)" }} />
          <div ref={scrollRef} className="no-scrollbar h-full overflow-y-auto px-6 py-16">
            {lines.length === 0 ? (
              <p className="text-center text-[13px]" style={{ color: "var(--text-3)" }}>No lyrics for this track.</p>
            ) : (
              lines.map((l, i) => (
                <div
                  key={i}
                  ref={(el) => { lineRefs.current[i] = el; }}
                  className="py-2 text-center text-[17px] font-semibold leading-snug transition-all duration-300"
                  style={{ color: i === activeIdx ? "var(--text)" : "var(--text-3)", opacity: i === activeIdx ? 1 : 0.35 }}
                >
                  {l.line}
                </div>
              ))
            )}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12" style={{ background: "linear-gradient(transparent, var(--card))" }} />
        </div>
      </div>
    </div>
  );
}
