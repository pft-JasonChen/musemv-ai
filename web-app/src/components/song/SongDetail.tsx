"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { downloadFile } from "@/lib/download";
import { formatDuration } from "@/lib/mv/mock";

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
  info: SongDetailInfo;
  shareUrl: string;
  downloadUrl?: string;
  onRecreate: () => void;
  onUseInMv: () => void;
  onDelete?: () => void;
  onClose?: () => void;
}

function I({ d }: { d: string }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-[13px]" style={{ color: "var(--text-2)" }}>{label}</span>
      <span className="min-w-0 truncate text-right text-[13px] font-semibold">{children}</span>
    </div>
  );
}

export function SongDetail({ cover, audioUrl, info, shareUrl, downloadUrl, onRecreate, onUseInMv, onDelete, onClose }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  function togglePlay() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play().then(() => setPlaying(true)).catch(() => {}); } else { a.pause(); setPlaying(false); }
  }
  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current; if (!a || !a.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * a.duration;
  }
  function nudge(sec: number) {
    const a = audioRef.current; if (!a) return;
    a.currentTime = Math.max(0, Math.min(a.duration || 0, a.currentTime + sec));
  }
  const pct = dur ? (cur / dur) * 100 : 0;
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <>
      <div className="flex flex-col gap-4 lg:h-[480px] lg:flex-row">
        {/* Left: square cover */}
        <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-2xl lg:aspect-auto lg:h-[480px] lg:w-[480px]" style={{ background: "var(--card-2)" }}>
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,.35), transparent 50%)" }} />
          <button aria-label={playing ? "Pause" : "Play"} onClick={togglePlay} className="absolute inset-0 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full" style={{ background: "rgba(0,0,0,.5)" }}>
              {playing ? <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg> : <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><polygon points="6,4 20,12 6,20" /></svg>}
            </span>
          </button>
          {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setPlaying(false)} onTimeUpdate={() => setCur(audioRef.current?.currentTime ?? 0)} onLoadedMetadata={() => setDur(audioRef.current?.duration ?? 0)} />}
        </div>

        {/* Right: necessary info */}
        <div className="flex min-w-0 flex-1 flex-col lg:h-[480px]">
          {onClose && (
            <div className="mb-1 flex justify-end">
              <button aria-label="Close" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full" style={{ background: "var(--card-2)", color: "var(--text-2)" }}><I d="M6 6l12 12M18 6L6 18" /></button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
            <span className="mb-2 inline-block rounded-md px-2.5 py-1 text-[11px] font-bold" style={{ background: "rgba(245,158,11,.18)", color: "var(--gold)" }}># AI Song</span>
            <h1 className="text-[22px] font-extrabold leading-tight">{info.title}</h1>
            <div className="mt-0.5 text-[12px]" style={{ color: "var(--text-2)" }}>
              AI Song{(info.genre || info.mood) ? ` · ${[info.genre, info.mood].filter(Boolean).join(" · ")}` : ""} · {info.dateLabel}
            </div>

            {/* Transport */}
            <div className="mt-3">
              <div onClick={seek} className="relative flex h-3 cursor-pointer items-center">
                <div className="absolute inset-x-0 h-1 rounded-full" style={{ background: "var(--card-3)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(to right,#FFB347,#FF4E50)" }} />
                </div>
                <div className="absolute h-3 w-3 -translate-x-1/2 rounded-full bg-white" style={{ left: `${pct}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-[11px]" style={{ color: "var(--text-3)" }}>
                <span>{fmt(cur)}</span><span>{dur ? fmt(dur) : info.durationSec ? formatDuration(info.durationSec) : "--:--"}</span>
              </div>
              <div className="mt-2 flex items-center justify-center gap-7">
                <button aria-label="Back 15s" onClick={() => nudge(-15)} style={{ color: "var(--text-2)" }}><I d="M11 19 4 12l7-7M20 19l-7-7 7-7" /></button>
                <button aria-label={playing ? "Pause" : "Play"} onClick={togglePlay} className="grid h-11 w-11 place-items-center rounded-full bg-white text-black">
                  {playing ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg> : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20" /></svg>}
                </button>
                <button aria-label="Forward 15s" onClick={() => nudge(15)} style={{ color: "var(--text-2)" }}><I d="M13 19l7-7-7-7M4 19l7-7-7-7" /></button>
              </div>
            </div>

            <div className="my-3 flex items-center gap-3 border-y py-2.5" style={{ borderColor: "var(--border-3)" }}>
              <button aria-label="Like" onClick={() => setVote((v) => (v === "up" ? null : "up"))} className="grid h-8 w-8 place-items-center rounded-lg transition-all hover:brightness-125" style={{ background: "var(--card-2)", color: vote === "up" ? "var(--accent)" : "var(--text-2)" }}><I d="M7 10v11M7 10l4-7a2 2 0 0 1 3 1.7V9h5a2 2 0 0 1 2 2.3l-1.3 7A2 2 0 0 1 18 20H7" /></button>
              <button aria-label="Dislike" onClick={() => setVote((v) => (v === "down" ? null : "down"))} className="grid h-8 w-8 place-items-center rounded-lg transition-all hover:brightness-125" style={{ background: "var(--card-2)", color: vote === "down" ? "var(--accent)" : "var(--text-2)" }}><I d="M17 14V3M17 14l-4 7a2 2 0 0 1-3-1.7V15H5a2 2 0 0 1-2-2.3l1.3-7A2 2 0 0 1 6 4h11" /></button>
              <span className="text-[13px]" style={{ color: "var(--text-3)" }}>How is the quality?</span>
            </div>

            <div className="mb-1 text-[13px] font-bold">Quick Actions</div>
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button onClick={() => setShareOpen(true)} className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold transition-all hover:brightness-125 active:scale-[0.97]" style={{ background: "var(--card-2)" }}><I d="M4 12v8h16v-8M12 16V3M8 7l4-4 4 4" /> Share</button>
              <button onClick={() => downloadUrl && downloadFile(downloadUrl, info.title + ".mp3")} className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold transition-all hover:brightness-125 active:scale-[0.97]" style={{ background: "var(--card-2)" }}><I d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" /> Download</button>
            </div>

            <div className="mb-1 text-[13px] font-bold">Details</div>
            <div className="divide-y" style={{ borderColor: "var(--border-3)" }}>
              <Row label="Genre">{info.genre || "—"}</Row>
              <Row label="Mood">{info.mood || "—"}</Row>
              <Row label="Vocal">{info.instrumental ? "Instrumental" : info.vocal || "—"}</Row>
              <Row label="Duration">{info.durationSec ? formatDuration(info.durationSec) : "—"}</Row>
            </div>

            {onDelete && (
              <button onClick={onDelete} className="mt-5 inline-flex items-center gap-1.5 text-[12px] hover:underline" style={{ color: "var(--text-3)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                Delete this creation
              </button>
            )}
          </div>

          <div className="mt-3 flex shrink-0 gap-2 border-t pt-3" style={{ borderColor: "var(--border-2)" }}>
            <Button className="flex-1" onClick={onUseInMv}><I d="M15 10l4.5-2.5v9L15 14M4 7h11v10H4z" /> Use in Music Video</Button>
            <Button variant="secondary" className="flex-1" onClick={onRecreate}><I d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" /> Recreate</Button>
          </div>
        </div>
      </div>
      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} title={info.title} url={shareUrl} />
    </>
  );
}
