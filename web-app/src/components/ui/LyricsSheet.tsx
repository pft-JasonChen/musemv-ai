"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { DpIcon } from "@/components/ui/DpIcon";
import { useIsMounted } from "@/lib/ssr";

/**
 * ── MIGRATED FROM DP `LyricsSheet` (plan Phase 3, slice 3b) ──────────────────
 *
 * Figma "Song Result — Lyrics" (node 881:19546) — a mobile bottom sheet that
 * becomes a centred dialog above the mobile breakpoint. Classes from
 * `src/styles/designer/LyricsSheet.css`, verbatim.
 *
 * WA'S EXISTING `LyricsPanel` IS DELIBERATELY LEFT IN PLACE. It still serves
 * `/song/result` and `CreationDialog`, neither of which is migrated; deleting it
 * belongs to those slices. So the two coexist for now — this one on the migrated
 * screen, that one everywhere else.
 *
 * PLAIN STRINGS, NOT WA's `TimedLine[]`. DP highlights the "current" line by
 * estimating it from playback position (no per-line timestamps exist for
 * generated lyrics), which is what `LyricsSheet.css` is built around. WA's
 * `buildTimedLines` computes the same estimate a different way; carrying DP's
 * version keeps this component a file-level copy of the drop.
 *
 * ── ALWAYS MOUNTED, `inert` WHEN CLOSED — AND WHY, BECAUSE IT MATTERS ────────
 *
 * DP unmounts this on close and keeps it alive through the exit transition with a
 * `useMountTransition` hook. That hook exists only because of the unmounting, and
 * the unmounting is only needed because of one thing: the closed overlay is
 * `opacity: 0; pointer-events: none` (see `LyricsSheet.css`), which hides it from
 * the eye and the mouse but NOT from the tab order or a screen reader. Leave it
 * mounted naively and every page with a player gains an invisible focusable
 * dialog.
 *
 * `inert` answers exactly that — it removes the subtree from the tab order and
 * the a11y tree — so the overlay can stay mounted, the CSS transition plays in
 * both directions unaided (DP's own "always mount, toggle a modifier class"
 * convention, quoted in its `SongDetailPage.tsx`), and the hook is not needed at
 * all. React 19 supports `inert` as a plain boolean attribute.
 *
 * SSR: `useIsMounted` gates the portal. `document` is also checked, matching WA's
 * `Modal`. DP portals unconditionally, which is fine under Vite and is a BUILD
 * failure under Next — see `SongDetailView` for the sharp edge of that.
 */
export function LyricsSheet({
  isOpen,
  title,
  cover,
  lyricLines,
  currentTime,
  duration,
  playing,
  onTogglePlay,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  cover: string;
  lyricLines: string[];
  currentTime: number;
  duration: number;
  playing: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
}) {
  const activeLineRef = useRef<HTMLParagraphElement>(null);
  const activeLineIndex = Math.min(
    lyricLines.length - 1,
    Math.floor((duration ? currentTime / duration : 0) * lyricLines.length),
  );
  const mounted = useIsMounted();

  useEffect(() => {
    if (isOpen) activeLineRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [activeLineIndex, isOpen]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`lyrics-sheet-overlay${isOpen ? " lyrics-sheet-overlay--visible" : ""}`}
      inert={!isOpen}
    >
      <div className="lyrics-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="lyrics-sheet" role="dialog" aria-label="Lyrics">
        <div className="lyrics-sheet__handle" aria-hidden="true" />

        <div className="lyrics-sheet__header">
          <button
            type="button"
            className="lyrics-sheet__close"
            onClick={onClose}
            aria-label="Close"
          >
            {/* An <img>, NOT a DpIcon. `.lyrics-sheet__close-icon` sets width and
                height only — no `background-color: currentColor`, no mask
                properties — because DP renders this one icon as a plain image
                while the play icon below it is a mask. A DpIcon here is a
                silently invisible 16×16 span. */}
            <img src="/assets/icons/ui/ic_close.svg" alt="" className="lyrics-sheet__close-icon" />
          </button>
          <p className="lyrics-sheet__title">Lyrics</p>
          <div className="lyrics-sheet__header-spacer" aria-hidden="true" />
        </div>

        <div className="lyrics-sheet__song-row">
          <img src={cover} alt="" className="lyrics-sheet__song-art" />
          <div className="lyrics-sheet__song-info">
            <p className="lyrics-sheet__song-title">{title}</p>
            <p className="lyrics-sheet__song-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
          <button
            type="button"
            className="lyrics-sheet__play"
            onClick={onTogglePlay}
            aria-label={playing ? "Pause" : "Play"}
          >
            <DpIcon name={playing ? "ic_pause" : "ic_play"} className="lyrics-sheet__play-icon" />
          </button>
        </div>

        <div className="lyrics-sheet__divider" />

        <div className="lyrics-sheet__lines">
          {lyricLines.map((line, index) => (
            <p
              key={index}
              ref={index === activeLineIndex ? activeLineRef : undefined}
              className={`lyrics-sheet__line${index === activeLineIndex ? " lyrics-sheet__line--active" : ""}`}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** DP's own helper, kept here so both players format time identically. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
