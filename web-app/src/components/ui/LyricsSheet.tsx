"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { DpIcon } from "@/components/ui/DpIcon";
import { useIsMounted } from "@/lib/ssr";
import { activeLineIndex, type TimedLine } from "@/lib/mv/lyrics";

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
 * ── LINES ARE NOW TIMED, AND CLICKABLE (YMW260903P0005, 2026-09-09) ─────────
 *
 * This used to take PLAIN STRINGS and estimate the "current" line from
 * playback position — DP's own approach, on the grounds that no per-line
 * timestamps existed. They do now: the AI Song result carries an LRC block
 * (`SongResult.lyricsLrc`), so the caller passes `lines: TimedLine[]` and the
 * highlight comes from real cues where they exist.
 *
 * `lib/mv/lyrics.ts`'s `timedLyrics()` is what builds that list, and it still
 * falls back to DP's even spread for a song with no LRC — so nothing about
 * this screen's *appearance* changed for those songs, and the highlight is
 * bit-for-bit the same index it used to compute (last line whose `t` has been
 * reached ≡ `floor(currentTime / duration * lineCount)` when the times ARE
 * that spread).
 *
 * `onSeek` is optional. With it, each line is a real `<button>` — see
 * `lyric-seek.css` for why that needs three lines of CSS and why they are not
 * in `designer/`. Without it the lines stay `<p>`, which is what keeps a
 * read-only caller from advertising an affordance it cannot honour.
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
  lines,
  currentTime,
  duration,
  playing,
  onTogglePlay,
  onSeek,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  cover: string;
  /** Display lines with their start times — `timedLyrics()` builds these. */
  lines: TimedLine[];
  currentTime: number;
  duration: number;
  playing: boolean;
  onTogglePlay: () => void;
  /** Omit to render the lyrics read-only (no click-to-seek). */
  onSeek?: (seconds: number) => void;
  onClose: () => void;
}) {
  // A callback ref, not an object ref, because the active line is a `<button>`
  // in the seekable case and a `<p>` in the read-only one — one `useRef<T>`
  // cannot be assigned to both without widening T to something neither
  // element accepts.
  const activeLineRef = useRef<HTMLElement | null>(null);
  const setActiveLine = (el: HTMLElement | null) => {
    activeLineRef.current = el;
  };
  const active = activeLineIndex(lines, currentTime);
  const mounted = useIsMounted();

  useEffect(() => {
    if (isOpen) activeLineRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [active, isOpen]);

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
          {lines.map((l, index) => {
            const className = `lyrics-sheet__line${index === active ? " lyrics-sheet__line--active" : ""}`;
            // A `<button>` only when it can actually do something. `type` is
            // explicit because this sheet can be portalled inside a form on
            // the result screen, where the default `submit` would navigate.
            return onSeek ? (
              <button
                key={index}
                type="button"
                ref={index === active ? setActiveLine : undefined}
                className={className}
                onClick={() => onSeek(l.t)}
              >
                {l.line}
              </button>
            ) : (
              <p
                key={index}
                ref={index === active ? setActiveLine : undefined}
                className={className}
              >
                {l.line}
              </p>
            );
          })}
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
