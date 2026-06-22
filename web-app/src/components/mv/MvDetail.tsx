"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { downloadFile } from "@/lib/download";
import { formatDuration } from "@/lib/mv/mock";

export interface MvDetailInfo {
  title: string;
  typeName: string;
  kind: "mv" | "song";
  dateLabel: string;
  author?: string;
  songTitle?: string;
  songArt?: string;
  songDuration?: number;
  photos?: { id: string; url: string }[];
  ratio?: string;
  resolution?: string;
  scenes?: number | null;
  subtitle?: boolean;
  hasCharacterTag?: boolean;
}

interface Props {
  videoUrl?: string;
  posterUrl?: string;
  info: MvDetailInfo;
  shareUrl: string;
  downloadUrl?: string;
  onRecreate: () => void;
  onEdit: () => void;
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

export function MvDetail({ videoUrl, posterUrl, info, shareUrl, downloadUrl, onRecreate, onEdit, onDelete, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [published, setPublished] = useState(false);

  function togglePlay() { const v = videoRef.current; if (!v) return; if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); } }
  function toggleMute() { const v = videoRef.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); }
  function download() { if (downloadUrl) downloadFile(downloadUrl, `${info.title}.${videoUrl ? "mp4" : "jpg"}`); }

  return (
    <>
      <div className="flex flex-col gap-4 lg:h-[520px] lg:flex-row">
        {/* Left: 1:1 square stage */}
        <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-2xl lg:aspect-auto lg:h-[520px] lg:w-[520px]" style={{ background: "#0e0e12" }}>
          {videoUrl ? (
            <>
              <video ref={videoRef} src={videoUrl} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-contain" />
              <button aria-label={playing ? "Pause" : "Play"} onClick={togglePlay} className="absolute inset-0 grid place-items-center">
                {!playing && <span className="grid h-16 w-16 place-items-center rounded-full" style={{ background: "rgba(0,0,0,.45)" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><polygon points="6,4 20,12 6,20" /></svg></span>}
              </button>
              <button aria-label={muted ? "Unmute" : "Mute"} onClick={toggleMute} className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full" style={{ background: "rgba(0,0,0,.5)", color: "#fff" }}>
                {muted ? <I d="M11 5 6 9H2v6h4l5 4zM23 9l-6 6M17 9l6 6" /> : <I d="M11 5 6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />}
              </button>
            </>
          ) : (
            <>
              {}
              <img src={posterUrl} alt="" className="absolute inset-0 h-full w-full object-contain" />
              <span className="absolute inset-0 grid place-items-center"><span className="grid h-16 w-16 place-items-center rounded-full" style={{ background: "rgba(0,0,0,.45)" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><polygon points="6,4 20,12 6,20" /></svg></span></span>
            </>
          )}
        </div>

        {/* Right: info panel — scrolls; actions pinned */}
        <div className="flex min-w-0 flex-1 flex-col lg:h-[520px]">
          {onClose && (
            <div className="mb-1 flex items-center justify-end">
              <button aria-label="Close" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full" style={{ background: "var(--card-2)", color: "var(--text-2)" }}><I d="M6 6l12 12M18 6L6 18" /></button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <span className="rounded-md px-2.5 py-1 text-[11px] font-bold" style={{ background: "rgba(1,179,123,.18)", color: "var(--green)" }}># {info.kind === "mv" ? "Music Video" : "Song"}</span>
              {info.typeName && <span className="rounded-md px-2.5 py-1 text-[11px] font-bold" style={{ background: "var(--card-2)", color: "var(--text-2)" }}># {info.typeName}</span>}
              {info.hasCharacterTag && <span className="rounded-md px-2.5 py-1 text-[11px] font-bold" style={{ background: "var(--card-2)", color: "var(--text-2)" }}># Consistent Character</span>}
            </div>

            <h1 className="text-[22px] font-extrabold leading-tight">{info.title}</h1>
            <div className="mt-0.5 text-[12px]" style={{ color: "var(--text-2)" }}>{info.kind === "mv" ? "Music Video" : "AI Song"} · {info.dateLabel}</div>

            <div className="my-3 flex items-center gap-3 border-y py-2.5" style={{ borderColor: "var(--border-3)" }}>
              <button aria-label="Like" onClick={() => setVote((v) => (v === "up" ? null : "up"))} className="grid h-8 w-8 place-items-center rounded-lg transition-all hover:brightness-125" style={{ background: "var(--card-2)", color: vote === "up" ? "var(--accent)" : "var(--text-2)" }}><I d="M7 10v11M7 10l4-7a2 2 0 0 1 3 1.7V9h5a2 2 0 0 1 2 2.3l-1.3 7A2 2 0 0 1 18 20H7" /></button>
              <button aria-label="Dislike" onClick={() => setVote((v) => (v === "down" ? null : "down"))} className="grid h-8 w-8 place-items-center rounded-lg transition-all hover:brightness-125" style={{ background: "var(--card-2)", color: vote === "down" ? "var(--accent)" : "var(--text-2)" }}><I d="M17 14V3M17 14l-4 7a2 2 0 0 1-3-1.7V15H5a2 2 0 0 1-2-2.3l1.3-7A2 2 0 0 1 6 4h11" /></button>
              <span className="text-[13px]" style={{ color: "var(--text-3)" }}>How is the quality?</span>
            </div>

            <div className="mb-1 text-[13px] font-bold">Quick Actions</div>
            <div className="mb-2 grid grid-cols-2 gap-2">
              <button onClick={() => setShareOpen(true)} className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold transition-all hover:brightness-125 active:scale-[0.97]" style={{ background: "var(--card-2)" }}><I d="M4 12v8h16v-8M12 16V3M8 7l4-4 4 4" /> Share</button>
              <button onClick={download} className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold transition-all hover:brightness-125 active:scale-[0.97]" style={{ background: "var(--card-2)" }}><I d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" /> Download</button>
            </div>

            {/* Publish toggle */}
            <button onClick={() => setPublished((p) => !p)} className="mb-2 flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-[14px] font-semibold transition-all hover:brightness-125" style={{ background: "var(--card-2)" }}>
              <span className="flex items-center gap-2"><I d="M12 3v12m0-12 4 4m-4-4-4 4M5 21h14" /> {published ? "Published · pending review" : "Publish to community"}</span>
              <span className="relative inline-block h-5 w-9 rounded-full transition-colors" style={{ background: published ? "var(--accent)" : "var(--card-3)" }}>
                <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all" style={{ left: published ? "18px" : "2px" }} />
              </span>
            </button>

            {/* Branded share row */}
            <div className="mb-1 text-[12px]" style={{ color: "var(--text-2)" }}>Share to</div>
            <div className="mb-4 flex gap-2">
              {["Instagram", "TikTok", "WhatsApp", "X", "More"].map((t) => (
                <button key={t} onClick={() => setShareOpen(true)} title={t} className="grid h-9 flex-1 place-items-center rounded-xl text-[11px] font-bold transition-all hover:brightness-125 active:scale-[0.97]" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
                  {t === "More" ? "···" : t === "Instagram" ? "IG" : t === "TikTok" ? "TT" : t === "WhatsApp" ? "WA" : "X"}
                </button>
              ))}
            </div>

            {info.songTitle && (
              <>
                <div className="mb-1 text-[13px] font-bold">Music</div>
                <div className="mb-4 flex items-center gap-3 rounded-xl border p-2.5" style={{ borderColor: "var(--border-2)" }}>
                  {}
                  <img src={info.songArt} alt="" className="h-9 w-9 rounded-md object-cover" />
                  <div className="min-w-0 flex-1"><div className="truncate text-[13px] font-semibold">{info.songTitle}</div><div className="text-[11px]" style={{ color: "var(--text-2)" }}>{formatDuration(info.songDuration ?? 0)}</div></div>
                </div>
              </>
            )}

            <div className="mb-1 text-[13px] font-bold">Generation Detail</div>
            <div className="divide-y" style={{ borderColor: "var(--border-3)" }}>
              <Row label="Character">{info.photos && info.photos.length > 0 ? <span className="inline-flex gap-1 align-middle">{info.photos.map((p) => (<img key={p.id} src={p.url} alt="" className="h-7 w-7 rounded-md object-cover" />))}</span> : "—"}</Row>
              <Row label="Author">{info.author || "—"}</Row>
              <Row label="Style">{info.typeName || "—"}</Row>
              <Row label="Aspect ratio">{info.ratio || "—"}</Row>
              <Row label="Resolution">{info.resolution || "—"}</Row>
              <Row label="Scenes">{info.scenes ?? "—"}</Row>
              <Row label="Subtitle">{info.subtitle == null ? "—" : info.subtitle ? "On" : "Off"}</Row>
            </div>

            {onDelete && (
              <button onClick={onDelete} className="mt-5 inline-flex items-center gap-1.5 text-[12px] hover:underline" style={{ color: "var(--text-3)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                Delete this creation
              </button>
            )}
          </div>

          {/* Pinned actions */}
          <div className="mt-3 flex shrink-0 gap-2 border-t pt-3" style={{ borderColor: "var(--border-2)" }}>
            <Button variant="secondary" className="flex-1" onClick={onRecreate}><I d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" /> Recreate</Button>
            <Button className="flex-1" onClick={onEdit}><I d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /> Edit MV</Button>
          </div>
        </div>
      </div>

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} title={info.title} url={shareUrl} />
    </>
  );
}
