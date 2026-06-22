"use client";
/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useMvFlow } from "@/components/mv/MvFlowProvider";
import { TOP_PICKS_SONGS, NEW_SONGS, type CommunitySong } from "@/lib/mv/community";
import { Play, Stats } from "@/components/community/ui";

function I({ d }: { d: string }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
}

export function SongExplore() {
  const router = useRouter();
  const { patchSongCompose } = useMvFlow();

  function createFromSong(s: CommunitySong, e: React.MouseEvent) {
    e.stopPropagation();
    patchSongCompose({ genre: s.genre, mood: s.mood, title: s.title, lyrics: s.lyrics ?? "" });
    router.push("/song/create");
  }

  const renderList = (title: string, items: CommunitySong[]) => (
    <div className="mb-8">
      <h2 className="mb-3 text-[16px] font-extrabold tracking-tight">{title}</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((s) => (
            <div key={s.id} onClick={() => router.push(`/song/play?id=${s.id}`)} className="hover-lift flex cursor-pointer items-center gap-3 rounded-xl p-2.5" style={{ background: "var(--card)" }}>
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                <img src={s.cover} alt="" className="h-full w-full object-cover" />
                <span className="absolute inset-0 grid place-items-center text-white opacity-0 transition-opacity hover:opacity-100" style={{ background: "rgba(0,0,0,.4)" }}><Play /></span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold">{s.title}</div>
                <button onClick={(e) => { e.stopPropagation(); router.push("/creator"); }} className="truncate text-[11px] hover:underline" style={{ color: "var(--text-2)" }}>{s.creator}</button>
                <div className="mt-1"><Stats plays={s.plays} likes={s.likes} shares={s.shares} /></div>
              </div>
              <button onClick={(e) => createFromSong(s, e)} className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold text-white transition-all hover:brightness-110 active:scale-95" style={{ background: "var(--accent)" }}>
                Create
              </button>
            </div>
          ))}
        </div>
      </div>
  );

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
      <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "var(--text-2)" }}>
        <I d="M15 18l-6-6 6-6" /> Back
      </button>
      <h1 className="mb-5 text-[22px] font-extrabold tracking-tight">Songs</h1>
      {renderList("Top Picks", TOP_PICKS_SONGS)}
      {renderList("New Songs", NEW_SONGS)}
    </div>
  );
}
