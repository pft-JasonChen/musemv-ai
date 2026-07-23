"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { buildShareUrl } from "@/lib/share";
import { LyricsPanel } from "@/components/song/LyricsPanel";
import { SubscribeModal } from "@/components/credits/SubscribeModal";
import { useSongFlow } from "@/components/providers/SongFlowProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { ALL_COMMUNITY_SONGS, CREATOR_SONGS, getCommunitySong, DEFAULT_CREATOR } from "@/lib/mv/community";
import { buildTimedLines } from "@/lib/mv/lyrics";
import { Heart, Share, Stats } from "@/components/community/ui";
import { CommunityEmpty } from "@/components/community/EmptyState";

function I({ d, size = 18 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
}
const DURATION = 125; // 2:05, prototype-faithful
// SONG-02: free accounts preview only the first 30s; Pro unlocks full playback.
const FREE_PREVIEW_SEC = 30;
function fmt(sec: number) { const m = Math.floor(sec / 60); const s = Math.round(sec % 60); return `${m}:${String(s).padStart(2, "0")}`; }

export function CommunitySongPlayer() {
  const router = useRouter();
  const params = useSearchParams();
  const id = params.get("id");

  // EXP-09: creator songs (`cps-*`) live in CREATOR_SONGS, not ALL_COMMUNITY_SONGS.
  // Pick the playlist the requested song actually belongs to so the right track
  // plays and prev/next stays within that set instead of falling back to index 0.
  const resolvedId = getCommunitySong(id)?.id ?? id;
  const playlist = useMemo(
    () => (CREATOR_SONGS.some((s) => s.id === resolvedId) ? CREATOR_SONGS : ALL_COMMUNITY_SONGS),
    [resolvedId],
  );
  const startIdx = Math.max(0, playlist.findIndex((s) => s.id === resolvedId));
  const [idx, setIdx] = useState(startIdx);
  const song = playlist[idx];

  const { patchSongCompose } = useSongFlow();
  const { subscribed, requireLogin } = useAuth();
  // Free accounts can only scrub/play up to the 30s preview cap.
  const maxPct = subscribed ? 100 : Math.min(100, (FREE_PREVIEW_SEC / DURATION) * 100);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // 0..100
  const [liked, setLiked] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  // EXP-04: player parity — shuffle + repeat, matching the app player.
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lyricLines = useMemo(() => buildTimedLines(song.lyrics, DURATION), [song.lyrics]);

  const stop = useCallback(() => { if (timer.current) { clearInterval(timer.current); timer.current = null; } }, []);
  useEffect(() => {
    stop();
    if (!playing) return;
    timer.current = setInterval(() => {
      // On reaching the (possibly gated) end: repeat loops the track, else it stops.
      setProgress((p) => { const next = p + 100 / DURATION; if (next >= maxPct) { if (repeat) return 0; stop(); setPlaying(false); return maxPct; } return next; });
    }, 1000);
    return stop;
  }, [playing, stop, maxPct, repeat]);

  function go(delta: number) {
    setIdx((i) => {
      if (shuffle && playlist.length > 1) {
        let n = i;
        while (n === i) n = Math.floor(Math.random() * playlist.length);
        return n;
      }
      return (i + delta + playlist.length) % playlist.length;
    });
    setProgress(0); setPlaying(true); setLiked(false);
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const target = Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100));
    if (target > maxPct) { setProgress(maxPct); setPlaying(false); setSubOpen(true); return; } // gated → prompt upgrade
    setProgress(target);
  }
  // GL-02/EXP-02: gate at the action — Like and Create both require sign-in.
  function toggleLike() { requireLogin(() => setLiked((l) => !l)); }
  function createSong() {
    requireLogin(() => {
      stop();
      patchSongCompose({ genre: song.genre, mood: song.mood, title: song.title, lyrics: song.lyrics ?? "" });
      router.push("/song/create");
    });
  }

  // EXP-06: an id that resolves to nothing shows a not-found state.
  if (id && !getCommunitySong(id)) {
    return (
      <div className="mx-auto max-w-[760px] px-4 py-6 sm:px-6">
        <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "var(--text-2)" }}>
          <I d="M15 18l-6-6 6-6" size={16} /> Back
        </button>
        <CommunityEmpty variant="not-found" action={<Button onClick={() => router.push("/explore/songs")}>Explore Songs</Button>} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[760px] px-4 py-6 sm:px-6">
      <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "var(--text-2)" }}>
        <I d="M15 18l-6-6 6-6" size={16} /> Back
      </button>

      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        {/* Cover — circular disc, spins while playing */}
        <div className="relative aspect-square w-full max-w-[300px] shrink-0 overflow-hidden rounded-full disc-spinning" style={{ background: "var(--card)", animationPlayState: playing ? "running" : "paused" }}>
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
            {!subscribed && (
              <button onClick={() => setSubOpen(true)} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden style={{ color: "var(--gold)" }}><path d="M3 7l4 4 5-6 5 6 4-4-1.5 12h-15z" /></svg>
                Free preview · first {FREE_PREVIEW_SEC}s — upgrade to Muse Pro for full playback
              </button>
            )}
          </div>

          {/* Transport */}
          <div className="mt-3 flex items-center justify-center gap-6">
            <button aria-label="Shuffle" aria-pressed={shuffle} onClick={() => setShuffle((v) => !v)} style={{ color: shuffle ? "var(--accent)" : "var(--text-3)" }}><I d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" size={18} /></button>
            <button aria-label="Previous" onClick={() => go(-1)} style={{ color: "var(--text)" }}><I d="M19 20 9 12l10-8zM5 19V5" size={22} /></button>
            <button aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying((p) => !p)} className="grid h-14 w-14 place-items-center rounded-full bg-white text-black">
              {playing ? <I d="M6 4h4v16H6zM14 4h4v16h-4z" size={26} /> : <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20" /></svg>}
            </button>
            <button aria-label="Next" onClick={() => go(1)} style={{ color: "var(--text)" }}><I d="M5 4 15 12 5 20zM19 5v14" size={22} /></button>
            <button aria-label="Repeat" aria-pressed={repeat} onClick={() => setRepeat((v) => !v)} style={{ color: repeat ? "var(--accent)" : "var(--text-3)" }}><I d="M17 2l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3" size={18} /></button>
          </div>

          {/* Like / Share */}
          <div className="mt-5 flex items-center gap-2">
            <button onClick={toggleLike} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold transition-all hover:brightness-125" style={{ background: "var(--card-2)", color: liked ? "var(--accent)" : "var(--text-2)" }}>
              <Heart size={16} filled={liked} /> Like
            </button>
            <button onClick={() => setShareOpen(true)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold transition-all hover:brightness-125" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
              <Share size={16} /> Share
            </button>
            {lyricLines.length > 0 && (
              <button aria-label="Lyrics" onClick={() => setLyricsOpen(true)} className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl transition-all hover:brightness-125" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
                <I d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3" size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="sticky bottom-4 mt-8">
        <Button className="w-full" onClick={createSong}>
          <I d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /> Create AI Song
        </Button>
        <p className="mt-2 text-center text-[11px]" style={{ color: "var(--text-3)" }}>Starts a new song with this genre, mood &amp; lyrics.</p>
      </div>

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} title={song.title} url={buildShareUrl(song.id)} />
      <SubscribeModal open={subOpen} onClose={() => setSubOpen(false)} />
      <LyricsPanel
        open={lyricsOpen}
        onClose={() => setLyricsOpen(false)}
        title={song.title}
        cover={song.cover}
        lines={lyricLines}
        currentSec={(progress / 100) * DURATION}
        durationSec={DURATION}
        playing={playing}
        onTogglePlay={() => setPlaying((p) => !p)}
      />
    </div>
  );
}
