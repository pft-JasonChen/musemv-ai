"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { buildShareUrl } from "@/lib/share";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { DEFAULT_COMPOSE } from "@/lib/mv/types";
import { getCommunityMv, DEFAULT_CREATOR } from "@/lib/mv/community";
import { Heart, Share, Stats } from "@/components/community/ui";

function I({ d, size = 18 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
}

export function CommunityMvDialog({ mvId, open, onClose }: { mvId: string | null; open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { setCompose } = useMvFlow();
  const { requireLogin } = useAuth();
  const mv = getCommunityMv(mvId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  if (!mv) return null;

  function togglePlay() { const v = videoRef.current; if (!v) return; if (v.paused) { v.play(); } else { v.pause(); } }
  function toggleMute() { const v = videoRef.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); }
  // GL-02/EXP-02: gate at the action — Like and Create require sign-in.
  function toggleLike() { requireLogin(() => setLiked((l) => !l)); }
  function createMv() {
    requireLogin(() => {
      setCompose({
        ...DEFAULT_COMPOSE,
        mvType: mv!.mvType,
        description: mv!.prompt,
        song: { id: `tpl-${mv!.id}`, source: "sample", title: mv!.matchedSong.title, durationSec: mv!.matchedSong.durationSec, art: mv!.matchedSong.art },
        settings: { ...DEFAULT_COMPOSE.settings, title: { on: true, text: mv!.title } },
      });
      router.push("/mv/room");
    });
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth={900}>
      <div className="flex flex-col gap-4 lg:h-[520px] lg:flex-row">
        {/* 1:1 square stage (fits portrait & landscape) */}
        <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-2xl lg:aspect-auto lg:h-[520px] lg:w-[520px]" style={{ background: "#0e0e12" }}>
          <video key={mv.id} ref={videoRef} src={mv.video} autoPlay muted loop playsInline onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} className="absolute inset-0 h-full w-full object-contain" />
          <button aria-label={playing ? "Pause" : "Play"} onClick={togglePlay} className="absolute inset-0 grid place-items-center">
            {!playing && <span className="grid h-16 w-16 place-items-center rounded-full" style={{ background: "rgba(0,0,0,.45)" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><polygon points="6,4 20,12 6,20" /></svg></span>}
          </button>
          <button aria-label={muted ? "Unmute" : "Mute"} onClick={toggleMute} className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full" style={{ background: "rgba(0,0,0,.5)", color: "#fff" }}>
            {muted ? <I d="M11 5 6 9H2v6h4l5 4zM23 9l-6 6M17 9l6 6" /> : <I d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />}
          </button>
        </div>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-1 flex items-center justify-between">
            <span className="inline-flex w-fit rounded-md px-2.5 py-1 text-[11px] font-bold" style={{ background: "rgba(1,179,123,.18)", color: "var(--green)" }}># Music Video</span>
            <button aria-label="Close" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full" style={{ background: "var(--card-2)", color: "var(--text-2)" }}><I d="M6 6l12 12M18 6L6 18" /></button>
          </div>

          <h1 className="text-[22px] font-extrabold leading-tight">{mv.title}</h1>
          <div className="mt-0.5 text-[12px]" style={{ color: "var(--text-2)" }}>{mv.meta}</div>

          <button onClick={() => { onClose(); router.push("/creator"); }} className="mt-3 flex w-fit items-center gap-2.5 rounded-xl p-1.5 pr-3 transition-colors hover:brightness-125" style={{ background: "var(--card-2)" }}>
            <img src={DEFAULT_CREATOR.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
            <div className="text-left"><div className="text-[13px] font-semibold">{mv.creator}</div><div className="text-[11px]" style={{ color: "var(--text-2)" }}>View profile</div></div>
          </button>

          <div className="my-3 flex items-center gap-2">
            <button onClick={toggleLike} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all hover:brightness-125" style={{ background: "var(--card-2)", color: liked ? "var(--accent)" : "var(--text-2)" }}><Heart size={16} filled={liked} /> Like</button>
            <button onClick={() => setShareOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all hover:brightness-125" style={{ background: "var(--card-2)", color: "var(--text-2)" }}><Share size={16} /> Share</button>
          </div>

          <div className="mb-4 rounded-xl border p-3" style={{ borderColor: "var(--border-2)" }}>
            <div className="mb-1.5"><Stats plays={mv.plays} likes={mv.likes + (liked ? 1 : 0)} shares={mv.shares} /></div>
            <div className="text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>{mv.prompt}</div>
          </div>

          <div className="mt-auto">
            <Button className="w-full" onClick={createMv}><I d="M5 12h14M13 6l6 6-6 6" /> Create Music Video</Button>
            <p className="mt-2 text-center text-[11px]" style={{ color: "var(--text-3)" }}>Uses this prompt, style &amp; song as a starting point.</p>
          </div>
        </div>
      </div>

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} title={mv.title} url={buildShareUrl(mv.id)} />
    </Modal>
  );
}
