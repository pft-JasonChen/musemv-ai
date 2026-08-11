"use client";

import { useRef, useState } from "react";
import { SeekBar } from "@/components/ui/SeekBar";
import { DpIcon } from "@/components/ui/DpIcon";
import { formatCount } from "@/lib/mv/community";
import type { MvRatio } from "@/lib/mv/justifiedRows";

/**
 * The "Music Videos" tab's big preview card on `/creator` (Figma "Community
 * User Profile — MV", nodes 1961:40612 / 1961:41878, designer request
 * 2026-08-07) — the boss found the old `.community-profile__item` row too
 * small. Classes are `.mv-preview__*`, from `community-profile-mv-preview.css`
 * (no DP source — see that file's header for why it isn't in `designer/`).
 *
 * Each card is a REAL, independently playable video, with its own play/pause,
 * seek (via the shared keyboard-operable `SeekBar`), mute and fullscreen.
 * Not autoplaying (designer request, 2026-08-07) — starts paused, showing
 * `cover` as the poster, muted only matters once play is pressed.
 *
 * The stage is ALWAYS 16:9 (designer correction, 2026-08-07 — an earlier
 * pass made the box itself tall and cropped portrait clips to fill it,
 * which is wrong). Same technique `/watch`'s player already uses for a 3:4
 * clip inside its wider stage: a blurred copy of the SAME video fills the
 * whole 16:9 box behind everything, and the real video sits on top at its
 * own ratio — full height, centred, pillarboxed — so a portrait clip never
 * gets cropped, the empty sides just show blur instead.
 *
 * The action row (Like / Share / owner-only More) is NOT built here — it's
 * passed in as `actions`, rendered by the caller. `CreatorProfile` already
 * has the full six-action owner menu (Edit/Like/Share/Publish/Download/
 * Delete) wired to its own state; duplicating that here would be a second
 * copy of behaviour the designer explicitly asked to reuse, not rebuild.
 */
export function MvPreviewCard({
  title,
  video,
  cover,
  ratio,
  plays,
  likes,
  shares,
  onOpen,
  actions,
}: {
  title: string;
  video: string;
  cover: string;
  ratio: MvRatio;
  plays: number;
  likes: number;
  shares: number;
  onOpen: () => void;
  actions: React.ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const isPortrait = ratio === "3:4";

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      // A cold `<video>` has no user activation on this page load, so play()
      // can reject with NotAllowedError — same R-2 reasoning as `/watch`'s
      // player: catch it rather than let it print an unhandled rejection.
      void v.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function toggleFullscreen() {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => {});
  }

  function seek(next: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = next;
    setCurrentTime(next);
  }

  return (
    <div className="mv-preview">
      <div
        ref={stageRef}
        className={`mv-preview__stage${isPortrait ? " mv-preview__stage--portrait" : ""}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt="" className="mv-preview__backdrop" aria-hidden="true" />
        <div className="mv-preview__backdrop-scrim" aria-hidden="true" />
        <video
          ref={videoRef}
          src={video}
          poster={cover}
          className="mv-preview__video"
          loop
          muted
          playsInline
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onClick={togglePlay}
        />

        <div className="mv-preview__controller">
          <div className="mv-preview__controls">
            <button
              type="button"
              className="mv-preview__control-btn"
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
            >
              <DpIcon name={playing ? "ic_pause" : "ic_play"} className="mv-preview__control-icon" />
            </button>

            <span className="mv-preview__time">{formatTime(currentTime)}</span>

            <SeekBar
              value={currentTime}
              max={duration}
              onSeek={seek}
              label="Seek"
              className="mv-preview__seek"
              trackClassName="mv-preview__seek-track"
              fillClassName="mv-preview__seek-fill"
              thumbClassName="mv-preview__seek-thumb"
            />

            <span className="mv-preview__time">{formatTime(duration)}</span>

            <button
              type="button"
              className="mv-preview__control-btn"
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
            >
              <DpIcon name={muted ? "ic_speaker_off" : "ic_speaker_on"} className="mv-preview__control-icon" />
            </button>

            <button
              type="button"
              className="mv-preview__control-btn"
              onClick={toggleFullscreen}
              aria-label="Fullscreen"
            >
              <DpIcon name="ic_expand" className="mv-preview__control-icon" />
            </button>
          </div>
        </div>
      </div>

      <div className="mv-preview__info">
        <div className="mv-preview__copy">
          <button type="button" className="mv-preview__title" onClick={onOpen}>
            {title}
          </button>
          <div className="mv-preview__social">
            <span className="mv-preview__stat">
              <DpIcon as="i" name="ic_headphones" className="mv-preview__stat-icon" />
              {formatCount(plays)}
            </span>
            <span className="mv-preview__stat">
              <DpIcon as="i" name="ic_favorite_off" className="mv-preview__stat-icon" />
              {formatCount(likes)}
            </span>
            <span className="mv-preview__stat">
              <DpIcon as="i" name="ic_share" className="mv-preview__stat-icon" />
              {formatCount(shares)}
            </span>
          </div>
        </div>

        <div className="mv-preview__actions">{actions}</div>
      </div>
    </div>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
