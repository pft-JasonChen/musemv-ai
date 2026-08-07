"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
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
  const progressRef = useRef<HTMLDivElement>(null);
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
  const [sidebarWidth, setSidebarWidth] = useState(0);

  useEffect(() => {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;
    // getBoundingClientRect, not contentRect: Sidebar has padding and a border,
    // and a `left` offset needs the border-box width.
    const observer = new ResizeObserver((entries) =>
      setSidebarWidth(entries[0].target.getBoundingClientRect().width),
    );
    observer.observe(sidebar);
    return () => observer.disconnect();
  }, []);

  function seekFromClientX(clientX: number) {
    const track = progressRef.current;
    const audio = audioRef.current;
    if (!track || !audio || !audio.duration) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    // S3: no clamp, same as every other seek in the product.
    audio.currentTime = ratio * audio.duration;
  }

  function onProgressPointerDown(event: ReactPointerEvent) {
    seekFromClientX(event.clientX);
    const onMove = (e: PointerEvent) => seekFromClientX(e.clientX);
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
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

  const progressRatio = duration ? currentTime / duration : 0;

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
      <div className="song-bar__progress" ref={progressRef} onPointerDown={onProgressPointerDown}>
        <div className="song-bar__progress-track" />
        <div className="song-bar__progress-fill" style={{ width: `${progressRatio * 100}%` }} />
        <div className="song-bar__progress-thumb" style={{ left: `${progressRatio * 100}%` }} />
      </div>
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
