"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useLayoutEffect, useState } from "react";
import { SeekBar } from "@/components/ui/SeekBar";
import type { RefObject } from "react";
import { DpIcon } from "@/components/ui/DpIcon";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { formatTime } from "@/components/ui/LyricsSheet";
import { buildShareUrl } from "@/lib/share";
import type { CommunitySong } from "@/lib/mv/community";

/**
 * ── DESKTOP PREVIEW BAR, PORTED FROM DP DROP 2 (`2670ed2`) ──────────────────
 *
 * A row's ALBUM-ART play icon starts this; the row's TITLE still navigates. The
 * point of it, in DP's own words, is that browsing continues while a preview
 * plays. It is not the main player and it replaces nothing — an earlier reading
 * of the drop said it replaced `/song/play`'s Now Playing column, and that was
 * wrong (the correction is in `docs/NEXT-SESSION.md` §2.0).
 *
 * `.song-bar` is `display: none` below 768px, so this is desktop-only by
 * stylesheet. Phones keep `MobileNowPlaying`, untouched.
 *
 * ── DP's `useSongPlayer` IS DELIBERATELY NOT PORTED ─────────────────────────
 *
 * `SongDetailView` already owns `playing` / `currentTime` / `duration` and one
 * `<audio>`, already resolves URLs through `songAudioUrl()`, and already
 * `.catch()`es `audio.play()`. DP's hook does NOT catch it, and an uncaught
 * `NotAllowedError` on a cold load is a console error that the R-2 specs fail
 * on. Two sources for "what is playing" would also be two chances to disagree.
 * So this takes the state it needs as props and owns only the bar's own UI.
 *
 * ── EVERY ICON HERE WAS TAG-CHECKED AGAINST `SongPlayBar.css` (D4) ──────────
 *
 * `.song-bar__cover` is `width`/`height` only with no `mask-*` ⇒ a real `<img>`;
 * a `DpIcon` there would be a mask with no background to clip. The transport,
 * play and action icons all set `background-color: currentColor` + `mask-*`
 * ⇒ `DpIcon`. Both failure shapes are swept by `e2e/behaviour-regressions`'
 * mask-icon test.
 */

// `useLayoutEffect` warns during SSR; fall back to `useEffect` there. Not
// imported from `src/lib/ssr.ts` — that module keeps this helper private to
// itself, same as `Sidebar.tsx`'s own local copy.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface SongPlayBarProps {
  song: CommunitySong;
  playing: boolean;
  currentTime: number;
  duration: number;
  audioRef: RefObject<HTMLAudioElement | null>;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

export function SongPlayBar({
  song,
  playing,
  currentTime,
  duration,
  audioRef,
  onTogglePlay,
  onPrev,
  onNext,
  onClose,
}: SongPlayBarProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  /**
   * The bar is `position: fixed`, so it spans the viewport — including the
   * width the Sidebar occupies. DP offsets `left` by the Sidebar's MEASURED
   * width rather than a CSS constant, because that width is a runtime toggle
   * (collapsed / expanded), not a breakpoint value. Constraining the bar inside
   * `.app-layout__main` instead is not an option: a transformed ancestor turns
   * `position: fixed` into "scrolls away with the content".
   */
  // `useState(0)` is the SSR-safe answer — the server (and the first client
  // render, before they've had a chance to disagree) both render with no
  // sidebar measured yet. Reading `document` inside the initializer itself
  // (`useState(() => document.querySelector(...))`) is the exact pattern
  // `src/lib/ssr.ts` documents as MEASURED to throw React error 418 on
  // hydration — this needs the same fix as `useMediaQuery`: a safe constant
  // here, corrected in a LAYOUT effect below (before paint, not after).
  const [sidebarWidth, setSidebarWidth] = useState(0);

  useIsomorphicLayoutEffect(() => {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;
    // Read the current width SYNCHRONOUSLY here too, not just once the
    // observer's own first callback fires — that callback is async (fires
    // shortly after `observe()`, not immediately), so without this the bar
    // still rendered flush against the viewport edge for one frame, then
    // visibly snapped sideways once the real width arrived
    // (designer-reported, 2026-08-11). A layout effect runs before paint,
    // so this correction is invisible; the observer then only has to
    // handle actual LATER resizes (collapse/expand toggle).
    setSidebarWidth(sidebar.getBoundingClientRect().width);
    // getBoundingClientRect, not contentRect: Sidebar has padding and a border,
    // and a `left` offset needs the border-box width.
    const observer = new ResizeObserver((entries) =>
      setSidebarWidth(entries[0].target.getBoundingClientRect().width),
    );
    observer.observe(sidebar);
    return () => observer.disconnect();
  }, []);

  // TODO.md #5 / 7a: seeking goes through `ui/SeekBar`, which is keyboard-operable.
  // This bar arrived with the drop-2 re-sync (2026-08-07), AFTER TODO #5 listed the
  // four pointer-only seek bars — so it was a fifth instance of the same Serious
  // WCAG 2.1.1 defect that no list mentioned. Adopted 2026-08-12 with the other four.
  function seek(next: number) {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    // S3: no clamp, same as every other seek in the product.
    audio.currentTime = Math.min(audio.duration, Math.max(0, next));
  }

  function applyVolume(next: number) {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = next;
      audio.muted = next === 0;
    }
    setVolume(next);
    setMuted(next === 0);
  }

  function toggleMute() {
    const audio = audioRef.current;
    const next = !muted;
    if (audio) audio.muted = next;
    setMuted(next);
  }


  return (
    <div className="song-bar" style={{ left: sidebarWidth }}>
      <img src={song.cover} alt="" className="song-bar__cover" />
      <div className="song-bar__meta">
        <p className="song-bar__title">{song.title}</p>
        <p className="song-bar__username">{song.creator}</p>
      </div>

      <div className="song-bar__transport">
        <button
          type="button"
          className="song-bar__transport-btn"
          onClick={onPrev}
          aria-label="Previous"
        >
          <DpIcon name="ic_skip_back" className="song-bar__transport-icon" />
        </button>
        <button
          type="button"
          className="song-bar__play"
          onClick={onTogglePlay}
          aria-label={playing ? "Pause" : "Play"}
        >
          <DpIcon name={playing ? "ic_pause" : "ic_play"} className="song-bar__play-icon" />
        </button>
        <button
          type="button"
          className="song-bar__transport-btn"
          onClick={onNext}
          aria-label="Next"
        >
          <DpIcon name="ic_skip_forward" className="song-bar__transport-icon" />
        </button>
      </div>

      <span className="song-bar__time">{formatTime(currentTime)}</span>
      <SeekBar
        value={currentTime}
        max={duration}
        onSeek={seek}
        label="Seek within the song"
        className="song-bar__progress"
        trackClassName="song-bar__progress-track"
        fillClassName="song-bar__progress-fill"
        thumbClassName="song-bar__progress-thumb"
      />
      <span className="song-bar__time">{formatTime(duration)}</span>

      <button
        type="button"
        className="song-bar__icon-btn"
        onClick={() => setShareOpen(true)}
        aria-label="Share"
      >
        <DpIcon name="ic_share" className="song-bar__icon" />
      </button>

      <div className="song-bar__volume">
        <div className="song-bar__volume-slider">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={muted ? 0 : volume}
            onChange={(event) => applyVolume(Number(event.target.value))}
            aria-label="Volume"
          />
        </div>
        <button
          type="button"
          className="song-bar__icon-btn"
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          <DpIcon
            name={muted || volume === 0 ? "ic_speaker_off" : "ic_speaker_on"}
            className="song-bar__icon"
          />
        </button>
      </div>

      <button
        type="button"
        className="song-bar__icon-btn"
        onClick={onClose}
        aria-label="Close player"
      >
        <DpIcon name="ic_close" className="song-bar__icon" />
      </button>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={song.title}
        url={buildShareUrl(song.id)}
      />
    </div>
  );
}
