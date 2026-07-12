"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { useSongFlow } from "@/components/providers/SongFlowProvider";
import { ALL_COMMUNITY_SONGS, getCommunitySong, DEFAULT_CREATOR } from "@/lib/mv/community";
import { Heart, Share, Stats } from "@/components/community/ui";

function I({ d, size = 18 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
}
const DURATION = 125; // 2:05, prototype-faithful
function fmt(sec: number) { const m = Math.floor(sec / 60); const s = Math.round(sec % 60); return `${m}:${String(s).padStart(2, "0")}`; }

export function CommunitySongPlayer() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");

  const startIdx = Math.max(0, ALL_COMMUNITY_SONGS.findIndex((s) => s.id === (getCommunitySong(id)?.id ?? id)));
  const [idx, setIdx] = useState(startIdx === -1 ? 0 : startIdx);
  const song = ALL_COMMUNITY_SONGS[idx];

  const { patchSongCompose } = useSongFlow();
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0..100
  const [liked, setLiked] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => { if (timer.current) { clearInterval(timer.current); timer.current = null; } }, []);
  useEffect(() => {
    stop();
    if (!playing) return;
    timer.current = setInterval(() => {
      setProgress((p) => { const next = p + 100 / DURATION; if (next >= 100) { stop(); setPlaying(false); return 100; } return next; });
    }, 1000);
    return stop;
  }, [playing, stop]);

  function go(delta: number) {
    setIdx((i) => (i + delta + ALL_COMMUNITY_SONGS.length) % ALL_COMMUNITY_SONGS.length);
    setProgress(0); setPlaying(true); setLiked(false);
  }
  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setProgress(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
  }
  function createSong() {
    stop();
    patchSongCompose({ genre: song.genre, mood: song.mood, title: song.title, lyrics: song.lyrics ?? "" });
    router.push("/song/create");
  }

  return (
    <div className="mx-auto max-w-[760px] px-4 py-6 sm:px-6">
      <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "var(--text-2)" }}>
        <I d="M15 18l-6-6 6-6" size={16} /> Back
      </button>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Cover */}
        <div className="relative aspect-square w-full max-w-[300px] shrink-0 overflow-hidden rounded-2xl" style={{ background: "var(--card)" }}>
          <img src={song.cover} alt="" className="h-full w-full object-cover" />
        </div>

        {/* Player */}
        <div className="flex w-full min-w-0 flex-1 flex-col">
          <h1 className="text-[24px] font-extrabold leading-tight">{song.title}</h1>
          <div className="mt-0.5 text-[12px]" style={{ color: "var(--text-2)" }}>{song.tags}</div>

          <button onClick={() => router.push("/creator")} className="mt-3 flex w-fit items-center gap-2 text-[13px] font-semibold transition-colors hover:brightness-125" style={{ color: "var(--text-2)" }}>
            <img src={DEFAULT_CREATOR.avatar} alt="" className="h-6 w-6 rounded-full object-cover" /> {song.creator}
          </button>

          <div className="mt-3"><Stats plays={song.plays} likes={song.likes + (liked ? 1 : 0)} shares={song.shares} /></div>

          {/* Progress */}
          <div className="mt-5">
            <div onClick={seek} className="relative flex h-3 cursor-pointer items-center">
              <div className="absolute inset-x-0 h-1 rounded-full" style={{ background: "var(--card-3)" }}>
                <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "linear-gradient(to right,#FFB347,#FF4E50)" }} />
              </div>
              <div className="absolute h-3 w-3 -translate-x-1/2 rounded-full bg-white" style={{ left: `${progress}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px]" style={{ color: "var(--text-3)" }}>
              <span>{fmt((progress / 100) * DURATION)}</span><span>{fmt(DURATION)}</span>
            </div>
          </div>

          {/* Transport */}
          <div className="mt-3 flex items-center justify-center gap-8">
            <button aria-label="Previous" onClick={() => go(-1)} style={{ color: "var(--text)" }}><I d="M19 20 9 12l10-8zM5 19V5" size={22} /></button>
            <button aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying((p) => !p)} className="grid h-14 w-14 place-items-center rounded-full bg-white text-black">
              {playing ? <I d="M6 4h4v16H6zM14 4h4v16h-4z" size={26} /> : <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20" /></svg>}
            </button>
            <button aria-label="Next" onClick={() => go(1)} style={{ color: "var(--text)" }}><I d="M5 4 15 12 5 20zM19 5v14" size={22} /></button>
          </div>

          {/* Like / Share */}
          <div className="mt-5 flex items-center gap-2">
            <button onClick={() => setLiked((l) => !l)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold transition-all hover:brightness-125" style={{ background: "var(--card-2)", color: liked ? "var(--accent)" : "var(--text-2)" }}>
              <Heart size={16} filled={liked} /> Like
            </button>
            <button onClick={() => setShareOpen(true)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold transition-all hover:brightness-125" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
              <Share size={16} /> Share
            </button>
          </div>
        </div>
      </div>

      {song.lyrics && (
        <div className="mt-8">
          <div className="mb-2 text-[13px] font-bold">Lyrics</div>
          <pre className="whitespace-pre-wrap rounded-xl border p-4 text-[13px] leading-relaxed" style={{ borderColor: "var(--border-2)", color: "var(--text-2)", fontFamily: "inherit" }}>{song.lyrics}</pre>
        </div>
      )}

      <div className="sticky bottom-4 mt-8">
        <Button className="w-full" onClick={createSong}>
          <I d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /> Create AI Song
        </Button>
        <p className="mt-2 text-center text-[11px]" style={{ color: "var(--text-3)" }}>Starts a new song with this genre, mood &amp; lyrics.</p>
      </div>

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} title={song.title} url={`https://musemv.ai/song/${song.id}`} />
    </div>
  );
}
