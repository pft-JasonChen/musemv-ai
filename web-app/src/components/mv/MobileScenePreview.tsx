"use client";

import { useRef, useState } from "react";
import { DpIcon } from "@/components/ui/DpIcon";
import { SeekBar } from "@/components/ui/SeekBar";
import { toggleMvFullscreen, useIsFullscreen } from "@/lib/fullscreen";

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**
 * The 180px preview box of the phone-only Storyboard scene screen (Figma
 * "Edit MV — Scene Detail", node 5038:76430): a portrait video letterboxed in
 * the middle of a dark card with the media controller overlaid along its
 * bottom edge — play, elapsed, seek, duration, mute, fullscreen.
 *
 * Owns its own video and playback state instead of reaching into `MvEditor`'s:
 * the desktop preview is `display: none` on phones but still mounted, so its
 * `videoRef`/`currentTime` belong to a player nobody can see. Keyed by scene id
 * at the call site, so switching clips remounts it with a fresh clock.
 */
export function MobileScenePreview({ src, poster }: { src: string; poster: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isFullscreen = useIsFullscreen();
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    // Without user activation play() rejects; an unhandled rejection prints to
    // the console, which the R-2 specs assert is empty.
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  }

  function seek(next: number) {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    v.currentTime = Math.min(v.duration, Math.max(0, next));
  }

  return (
    <div ref={frameRef} className="mv-edit-mobile-scene__preview">
      <video
        ref={videoRef}
        className="mv-edit-mobile-scene__preview-video"
        src={src}
        poster={poster}
        autoPlay
        loop
        muted={muted}
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onClick={togglePlay}
      />
      <div className="mv-edit-mobile-scene__preview-controls">
        <button
          type="button"
          className="mv-edit__control-btn"
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
        >
          <DpIcon name={playing ? "ic_pause" : "ic_play"} className="mv-edit__control-icon" />
        </button>
        <span className="mv-edit__time">{formatClock(currentTime)}</span>
        <SeekBar
          value={currentTime}
          max={duration}
          onSeek={seek}
          label="Seek within the scene preview"
          className="mv-edit__progress"
          trackClassName="mv-edit__progress-track"
          fillClassName="mv-edit__progress-fill"
          thumbClassName="mv-edit__progress-thumb"
        />
        <span className="mv-edit__time">{formatClock(duration)}</span>
        <button
          type="button"
          className="mv-edit__control-btn"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Unmute" : "Mute"}
        >
          <DpIcon
            name={muted ? "ic_speaker_off" : "ic_speaker_on"}
            className="mv-edit__control-icon"
          />
        </button>
        <button
          type="button"
          className="mv-edit__control-btn"
          onClick={() => toggleMvFullscreen(frameRef.current, videoRef.current)}
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          <DpIcon
            name={isFullscreen ? "ic_shrink" : "ic_expand"}
            className="mv-edit__control-icon"
          />
        </button>
      </div>
    </div>
  );
}
