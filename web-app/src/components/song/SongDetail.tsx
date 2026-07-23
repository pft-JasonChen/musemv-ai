"use client";
/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { SubscribeModal } from "@/components/credits/SubscribeModal";
import { LyricsPanel } from "@/components/song/LyricsPanel";
import { useAudioPlayer } from "@/components/audio/useAudioPlayer";
import { useAuth } from "@/components/providers/AuthProvider";
import { buildTimedLines } from "@/lib/mv/lyrics";
import { formatDuration } from "@/lib/mv/mock";

// SONG-02: free accounts preview only the first 30 seconds; Pro plays in full.
const FREE_PREVIEW_SEC = 30;

export interface SongDetailInfo {
  title: string;
  dateLabel: string;
  genre?: string;
  mood?: string;
  vocal?: string | null;
  instrumental?: boolean;
  durationSec?: number;
}

interface Props {
  cover: string;
  audioUrl?: string;
  lyrics?: string;
  info: SongDetailInfo;
  shareUrl: string;
  downloadUrl?: string;
  onRecreate: () => void;
  onUseInMv: () => void;
  onDelete?: () => void;
  onClose?: () => void;
}

function I({ d, size = 18 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
}

export function SongDetail({ cover, audioUrl, lyrics, info, shareUrl, onRecreate, onUseInMv, onClose }: Props) {
  const { subscribed } = useAuth();
  const gated = !subscribed;
  const { playing, currentTime: cur, duration: dur, toggle: togglePlay, seek: seekTo, nudge } = useAudioPlayer({
    src: audioUrl,
    range: gated ? { start: 0, end: FREE_PREVIEW_SEC } : null,
  });
  const [shareOpen, setShareOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const lyricLines = useMemo(() => buildTimedLines(lyrics, dur || info.durationSec || 0), [lyrics, dur, info.durationSec]);

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    if (!dur) return;
    const r = e.currentTarget.getBoundingClientRect();
    seekTo(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur);
  }
  const pct = dur ? (cur / dur) * 100 : 0;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const tags = [info.genre, info.mood].filter(Boolean).join(" · ");

  return (
    <>
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Cover — circular disc, spins while playing */}
        <div className="relative aspect-square w-full max-w-[300px] shrink-0 overflow-hidden rounded-full disc-spinning" style={{ background: "var(--card-2)", animationPlayState: playing ? "running" : "paused" }}>
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        </div>

        {/* Player */}
        <div className="flex w-full min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="truncate text-[22px] font-extrabold leading-tight">{info.title}</h1>
              <div className="mt-0.5 text-[12px]" style={{ color: "var(--text-2)" }}>{tags || "AI Song"} · {info.dateLabel}</div>
            </div>
            {onClose && (
              <button aria-label="Close" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: "var(--card-2)", color: "var(--text-2)" }}><I d="M6 6l12 12M18 6L6 18" /></button>
            )}
          </div>

          {/* Progress */}
          <div className="mt-5">
            <div onClick={seek} className="relative flex h-3 cursor-pointer items-center">
              <div className="absolute inset-x-0 h-1 rounded-full" style={{ background: "var(--card-3)" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(to right,#FFB347,#FF4E50)" }} />
              </div>
              <div className="absolute h-3 w-3 -translate-x-1/2 rounded-full bg-white" style={{ left: `${pct}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px]" style={{ color: "var(--text-3)" }}>
              <span>{fmt(cur)}</span><span>{dur ? fmt(dur) : info.durationSec ? formatDuration(info.durationSec) : "--:--"}</span>
            </div>
            {gated && (
              <button onClick={() => setSubOpen(true)} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden style={{ color: "var(--gold)" }}><path d="M3 7l4 4 5-6 5 6 4-4-1.5 12h-15z" /></svg>
                Free preview · first {FREE_PREVIEW_SEC}s — upgrade to Muse Pro for full playback
              </button>
            )}
          </div>

          {/* Transport */}
          <div className="mt-3 flex items-center justify-center gap-7">
            <button aria-label="Back 15s" onClick={() => nudge(-15)} style={{ color: "var(--text-2)" }}><I d="M11 19 4 12l7-7M20 19l-7-7 7-7" size={22} /></button>
            <button aria-label={playing ? "Pause" : "Play"} onClick={togglePlay} className="grid h-14 w-14 place-items-center rounded-full bg-white text-black">
              {playing ? <I d="M6 4h4v16H6zM14 4h4v16h-4z" size={26} /> : <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20" /></svg>}
            </button>
            <button aria-label="Forward 15s" onClick={() => nudge(15)} style={{ color: "var(--text-2)" }}><I d="M13 19l7-7-7-7M4 19l7-7-7-7" size={22} /></button>
          </div>

          {/* Lyrics / Share — no Like (this is the user's own creation) */}
          <div className="mt-5 flex items-center gap-2">
            {lyricLines.length > 0 && (
              <button onClick={() => setLyricsOpen(true)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold transition-all hover:brightness-125" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
                <I d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3" size={16} /> Lyrics
              </button>
            )}
            <button onClick={() => setShareOpen(true)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold transition-all hover:brightness-125" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
              <I d="M4 12v8h16v-8M12 16V3M8 7l4-4 4 4" size={16} /> Share
            </button>
          </div>

          {/* CTAs */}
          <div className="mt-5 flex gap-2 border-t pt-4" style={{ borderColor: "var(--border-2)" }}>
            <Button className="flex-1" onClick={onUseInMv}><I d="M15 10l4.5-2.5v9L15 14M4 7h11v10H4z" /> Use in Music Video</Button>
            <Button variant="secondary" className="flex-1" onClick={onRecreate}><I d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" /> Recreate</Button>
          </div>
        </div>
      </div>
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} title={info.title} url={shareUrl} />
      <SubscribeModal open={subOpen} onClose={() => setSubOpen(false)} />
      <LyricsPanel
        open={lyricsOpen}
        onClose={() => setLyricsOpen(false)}
        title={info.title}
        cover={cover}
        lines={lyricLines}
        currentSec={cur}
        durationSec={dur || info.durationSec || 0}
        playing={playing}
        onTogglePlay={togglePlay}
      />
    </>
  );
}
