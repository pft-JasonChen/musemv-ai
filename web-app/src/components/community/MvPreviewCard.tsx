"use client";

import { useRef, useState } from "react";
import { SeekBar } from "@/components/ui/SeekBar";
import { DpIcon } from "@/components/ui/DpIcon";
import { useVolumePopup } from "@/components/ui/useVolumePopup";
import { formatCount } from "@/lib/mv/community";
import { toggleMvFullscreen, useIsFullscreen } from "@/lib/fullscreen";
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
 * passed in as `actions`, rendered by the caller (`CreatorProfile`, which owns
 * the owner menu and its state).
 *
 * Only finished, published MVs reach this card: `/creator` lists published
 * works only (product owner, 2026-10-05), which retired the storyboard /
 * failed / generating variants this card used to carry.
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
  // Reported bug, 2026-09-22 (found on `/mv/edit`, same shared button
  // everywhere): the fullscreen icon never changed once already fullscreen.
  // See `useIsFullscreen`'s header comment in `src/lib/fullscreen.ts`.
  const isFullscreen = useIsFullscreen();
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  // Product owner, 2026-09-16: hover-revealed volume-slider popup on the mute
  // button — see `MvResult.tsx`'s matching comment for the `muted`/`volume`
  // split.
  const [volume, setVolume] = useState(1);
  const volumeWrapRef = useRef<HTMLDivElement>(null);
  const volumePopup = useVolumePopup(volumeWrapRef);
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

  function setVol(next: number) {
    const v = videoRef.current;
    if (v) {
      v.volume = next;
      v.muted = next === 0;
    }
    setVolume(next);
    setMuted(next === 0);
  }

  function toggleFullscreen() {
    toggleMvFullscreen(stageRef.current, videoRef.current);
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
              <DpIcon
                name={playing ? "ic_pause" : "ic_play"}
                className="mv-preview__control-icon"
              />
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

            <div
              className={`mv-preview__volume${volumePopup.open ? " mv-preview__volume--open" : ""}`}
              ref={volumeWrapRef}
            >
              <div className="mv-preview__volume-slider">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={muted ? 0 : volume}
                  onChange={(e) => setVol(Number(e.target.value))}
                  aria-label="Volume"
                />
              </div>
              <button
                type="button"
                className="mv-preview__control-btn"
                onClick={() => volumePopup.handleMuteClick(() => setVol(muted ? 1 : 0))}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                <DpIcon
                  name={muted || volume === 0 ? "ic_speaker_off" : "ic_speaker_on"}
                  className="mv-preview__control-icon"
                />
              </button>
            </div>

            <button
              type="button"
              className="mv-preview__control-btn"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              <DpIcon
                name={isFullscreen ? "ic_shrink" : "ic_expand"}
                className="mv-preview__control-icon"
              />
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
