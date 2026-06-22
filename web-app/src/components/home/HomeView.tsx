"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMvFlow } from "@/components/mv/MvFlowProvider";
import { CreationDialog, type CreationLike } from "@/components/mv/CreationDialog";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { MV_TYPES } from "@/lib/mv/mock";
import { NEW_MVS, TOP_PICKS_SONGS, NEW_SONGS, TRENDING_MVS, formatCount } from "@/lib/mv/community";
import { BadgePill, Play, Headphones, Heart, Share, SectionHead } from "@/components/community/ui";

function StyleHead({ title }: { title: string }) {
  return <h2 className="mb-3 text-[18px] font-extrabold tracking-tight">{title}</h2>;
}

function Star({ size = 11 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.4 6.8L12 17.8 5.9 20.4l1.4-6.8L2.2 9l6.9-.7z" /></svg>;
}

export function HomeView() {
  const router = useRouter();
  const { history, patchSongCompose } = useMvFlow();
  const [selected, setSelected] = useState<CreationLike | null>(null);
  const [likedSongs, setLikedSongs] = useState<Record<string, boolean>>({});
  const [share, setShare] = useState<{ title: string; url: string } | null>(null);

  const recent: CreationLike[] = history
    .filter((h) => h.status === "completed")
    .map((h) => ({ id: h.id, kind: h.kind, title: h.title, thumb: h.thumb, date: "Just now", plays: 0, likes: 0, shares: 0, liked: false }));

  function openMv(id: string) { router.push(`/watch?id=${id}`); }
  function openSong(id: string) { router.push(`/song/play?id=${id}`); }
  function createFromSong(genre: string, mood: string, title: string, lyrics?: string) {
    patchSongCompose({ genre, mood, title, lyrics: lyrics ?? "" });
    router.push("/song/create");
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
      {/* Hero CTAs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <button onClick={() => router.push("/mv/room")} className="hover-lift relative h-[180px] overflow-hidden rounded-2xl text-left">
          <video src={MV_TYPES[0].video} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(168,85,247,.85), rgba(67,56,202,.5) 60%, transparent)" }} />
          <div className="absolute inset-0 flex flex-col justify-center p-6">
            <div className="text-[22px] font-extrabold text-white">AI Music Video Studio</div>
            <div className="mt-1 max-w-[80%] text-[13px] text-white/85">Turn your songs into cinematic visuals.</div>
            <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-[13px] font-bold text-white">Create MV →</span>
          </div>
        </button>
        <button onClick={() => router.push("/song/create")} className="hover-lift relative h-[180px] overflow-hidden rounded-2xl text-left" style={{ background: "var(--card)" }}>
          <img src="/assets/images/album-art/album_02.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(255,78,80,.85), rgba(214,58,249,.5) 60%, transparent)" }} />
          <div className="absolute inset-0 flex flex-col justify-center p-6">
            <div className="text-[22px] font-extrabold text-white">AI Audio Lab</div>
            <div className="mt-1 max-w-[80%] text-[13px] text-white/85">Turn your ideas into original songs.</div>
            <span className="mt-3 inline-flex w-fit items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-[13px] font-bold text-white">Create Song →</span>
          </div>
        </button>
      </div>

      {/* Trending MV */}
      <div className="mt-10">
        <SectionHead title="Trending MV" href="/explore/mvs" />
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {TRENDING_MVS.map((m) => (
            <button key={m.id} onClick={() => openMv(m.id)} className="hover-lift relative aspect-video w-[320px] shrink-0 overflow-hidden rounded-2xl text-left">
              <img src={m.thumb} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,.05) 30%, rgba(0,0,0,.7))" }} />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white" style={{ background: "rgba(255,255,255,.18)", backdropFilter: "blur(6px)" }}>
                <Star /> Trending MV
              </span>
              <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
                <div>
                  <div className="text-[16px] font-extrabold text-white">{m.title}</div>
                  <div className="text-[11px] text-white/75">{m.meta}</div>
                </div>
                <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-black">Create MV</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* New MVs */}
      <div className="mt-10">
        <SectionHead title="New MVs" href="/explore/mvs" />
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {NEW_MVS.slice(0, 8).map((m) => (
            <button key={m.id} onClick={() => openMv(m.id)} className="hover-lift w-[180px] shrink-0 overflow-hidden rounded-xl text-left" style={{ background: "var(--card)" }}>
              <div className="relative aspect-[3/4]">
                <img src={m.thumb} alt="" className="h-full w-full object-cover" />
                <BadgePill badge={m.badge} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,.75), transparent 50%)" }} />
                <div className="absolute bottom-2 left-3 right-3">
                  <div className="truncate text-[13px] font-bold text-white">{m.title}</div>
                  <div className="text-[11px] text-white/70">{m.meta}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Top Picks Songs */}
      <div className="mt-10">
        <SectionHead title="Top Picks Songs" href="/explore/songs" />
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {TOP_PICKS_SONGS.map((s) => (
            <button key={s.id} onClick={() => openSong(s.id)} className="hover-lift w-[150px] shrink-0 text-left">
              <div className="relative aspect-square overflow-hidden rounded-xl" style={{ background: "var(--card)" }}>
                <img src={s.cover} alt="" className="h-full w-full object-cover" />
                <BadgePill badge={s.badge} />
                <span className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full text-white" style={{ background: "rgba(0,0,0,.55)" }}><Play /></span>
              </div>
              <div className="mt-2 truncate text-[13px] font-semibold">{s.title}</div>
              <div className="truncate text-[11px]" style={{ color: "var(--text-2)" }}>{s.tags}</div>
            </button>
          ))}
        </div>
      </div>

      {/* New Songs */}
      <div className="mt-10">
        <SectionHead title="New Songs" href="/explore/songs" />
        <div className="grid gap-2 sm:grid-cols-2">
          {NEW_SONGS.slice(0, 6).map((s) => {
            const liked = likedSongs[s.id] ?? false;
            return (
              <div key={s.id} onClick={() => openSong(s.id)} className="hover-lift flex cursor-pointer items-center gap-3 rounded-xl p-2.5" style={{ background: "var(--card)" }}>
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                  <img src={s.cover} alt="" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 grid place-items-center text-white opacity-0 transition-opacity hover:opacity-100" style={{ background: "rgba(0,0,0,.4)" }}><Play /></span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold">{s.title}</div>
                  <button onClick={(e) => { e.stopPropagation(); router.push("/creator"); }} className="truncate text-[11px] hover:underline" style={{ color: "var(--text-2)" }}>{s.creator}</button>
                  <div className="mt-1 flex items-center gap-3 text-[11px]" style={{ color: "var(--text-2)" }}>
                    <span className="inline-flex items-center gap-1"><Headphones /> {formatCount(s.plays)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setLikedSongs((m) => ({ ...m, [s.id]: !liked })); }}
                      className="inline-flex items-center gap-1 transition-colors hover:brightness-125"
                      style={{ color: liked ? "var(--accent)" : "var(--text-2)" }}
                      aria-label={liked ? "Unlike" : "Like"}
                    >
                      <Heart filled={liked} /> {formatCount(s.likes + (liked ? 1 : 0))}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShare({ title: s.title, url: `https://musemv.ai/song/${s.id}` }); }}
                      className="inline-flex items-center gap-1 transition-colors hover:brightness-125"
                      style={{ color: "var(--text-2)" }}
                      aria-label="Share"
                    >
                      <Share /> {formatCount(s.shares)}
                    </button>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); createFromSong(s.genre, s.mood, s.title, s.lyrics); }}
                  className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold text-white transition-all hover:brightness-110 active:scale-95"
                  style={{ background: "var(--accent)" }}
                >
                  Create
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Your recent creations */}
      <div className="mt-10">
        <StyleHead title="Your recent creations" />
        {recent.length === 0 ? (
          <div className="rounded-2xl border p-8 text-center text-[14px]" style={{ borderColor: "var(--border-2)", color: "var(--text-2)" }}>
            Nothing yet — create your first MV or song and it’ll show up here.
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {recent.map((c) => (
              <button key={c.id} onClick={() => setSelected(c)} className="hover-lift w-[200px] shrink-0 overflow-hidden rounded-xl text-left" style={{ background: "var(--card)" }}>
                <div className="relative aspect-video"><img src={c.thumb} alt="" className="h-full w-full object-cover" /><span className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ background: "rgba(0,0,0,.55)", color: "#fff" }}>{c.kind}</span></div>
                <div className="p-2.5"><div className="truncate text-[13px] font-semibold">{c.title}</div><div className="text-[11px]" style={{ color: "var(--text-2)" }}>{c.date}</div></div>
              </button>
            ))}
          </div>
        )}
      </div>

      <CreationDialog key={selected?.id ?? "none"} open={selected != null} creation={selected} onClose={() => setSelected(null)} onDelete={() => setSelected(null)} />
      <ShareDialog open={share != null} onClose={() => setShare(null)} title={share?.title ?? ""} url={share?.url ?? ""} />
    </div>
  );
}
