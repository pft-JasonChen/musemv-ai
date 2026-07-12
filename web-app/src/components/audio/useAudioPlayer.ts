"use client";

// Shared audio playback hook. Owns a non-DOM HTMLAudioElement so any component
// (song row, trim dialog, full player) gets identical play/pause/seek behavior
// without mounting an <audio> tag. Pass `range` to confine playback to a
// section: play() starts inside it and playback auto-stops at its end.

import { useCallback, useEffect, useRef, useState } from "react";

export interface AudioRange {
  start: number;
  end: number;
}

interface Options {
  src?: string;
  /** Confine playback to [start, end] seconds. Changing it re-clamps live playback. */
  range?: AudioRange | null;
}

export function useAudioPlayer({ src, range }: Options) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rangeRef = useRef<AudioRange | null | undefined>(range);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Reset playback state when the source changes (render-phase adjustment,
  // per React's "adjusting state during render" pattern).
  const [prevSrc, setPrevSrc] = useState(src);
  if (prevSrc !== src) {
    setPrevSrc(src);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }

  useEffect(() => {
    rangeRef.current = range;
  }, [range]);

  const ensureAudio = useCallback(() => {
    if (!src || typeof window === "undefined") return null;
    let a = audioRef.current;
    if (a && a.src.endsWith(src)) return a;
    a?.pause();
    a = new Audio(src);
    a.preload = "metadata";
    a.addEventListener("loadedmetadata", () => setDuration(a!.duration || 0));
    a.addEventListener("ended", () => setPlaying(false));
    a.addEventListener("timeupdate", () => {
      const r = rangeRef.current;
      setCurrentTime(a!.currentTime);
      if (r && a!.currentTime >= r.end) {
        a!.pause();
        a!.currentTime = r.start;
        setCurrentTime(r.start);
        setPlaying(false);
      }
    });
    audioRef.current = a;
    return a;
  }, [src]);

  const play = useCallback(() => {
    const a = ensureAudio();
    if (!a) return;
    const r = rangeRef.current;
    if (r && (a.currentTime < r.start || a.currentTime >= r.end)) a.currentTime = r.start;
    void a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [ensureAudio]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) pause();
    else play();
  }, [play, pause]);

  const seek = useCallback((t: number) => {
    const a = ensureAudio();
    if (!a) return;
    const r = rangeRef.current;
    const lo = r ? r.start : 0;
    const hi = r ? r.end : a.duration || t;
    a.currentTime = Math.max(lo, Math.min(hi, t));
    setCurrentTime(a.currentTime);
  }, [ensureAudio]);

  const nudge = useCallback((dt: number) => {
    const a = audioRef.current;
    if (a) seek(a.currentTime + dt);
  }, [seek]);

  // Live-clamp when the range moves under an active playback (trim handle
  // drag). Only touches the audio element; the timeupdate event mirrors the
  // jump back into React state.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || a.paused || !range) return;
    if (a.currentTime < range.start || a.currentTime >= range.end) {
      a.currentTime = range.start;
    }
  }, [range]);

  // Release the audio element when the source changes or on unmount.
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [src]);

  return { playing, currentTime, duration, play, pause, toggle, seek, nudge };
}
