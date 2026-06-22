"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CREATOR_MVS, CREATOR_SONGS, DEFAULT_CREATOR, formatCount, type CommunityMv, type CommunitySong } from "@/lib/mv/community";
import { Heart, Share, Headphones } from "@/components/community/ui";

function I({ d, size = 16 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
}

function Stat({ icon, value }: { icon: React.ReactNode; value: number }) {
  return <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "var(--text-2)" }}>{icon} {formatCount(value)}</span>;
}

function Row({ thumb, title, plays, likes, shares, date, onOpen }: { thumb: string; title: string; plays: number; likes: number; shares: number; date: string; onOpen: () => void }) {
  const [liked, setLiked] = useState(false);
  const [menu, setMenu] = useState(false);
  return (
    <div className="flex items-center gap-3 border-b py-3" style={{ borderColor: "var(--border-3)" }}>
      <button onClick={onOpen} className="relative h-[56px] w-[56px] shrink-0 overflow-hidden rounded-lg" style={{ background: "var(--card)" }}>
        <img src={thumb} alt="" className="h-full w-full object-cover" />
      </button>
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <div className="truncate text-[14px] font-bold">{title}</div>
        <div className="mt-1 flex items-center gap-3">
          <Stat icon={<Headphones />} value={plays} />
          <Stat icon={<Heart filled={liked} />} value={likes + (liked ? 1 : 0)} />
          <Stat icon={<Share />} value={shares} />
        </div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--text-3)" }}>{date}</div>
      </button>
      <div className="relative shrink-0">
        <button aria-label="More" onClick={() => setMenu((m) => !m)} onBlur={() => setTimeout(() => setMenu(false), 150)} className="grid h-8 w-8 place-items-center rounded-full" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
          <I d="M12 5h.01M12 12h.01M12 19h.01" />
        </button>
        {menu && (
          <div className="absolute right-0 top-9 z-10 w-36 overflow-hidden rounded-xl border py-1 shadow-lg" style={{ background: "var(--card)", borderColor: "var(--border-2)" }}>
            <button onMouseDown={() => setLiked((l) => !l)} className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-semibold" style={{ color: liked ? "var(--accent)" : "var(--text)" }}><Heart size={16} filled={liked} /> {liked ? "Unlike" : "Like"}</button>
            <button onMouseDown={() => setMenu(false)} className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-semibold"><Share size={16} /> Share</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CreatorProfile() {
  const router = useRouter();
  const [tab, setTab] = useState<"mv" | "songs">("mv");
  const c = DEFAULT_CREATOR;

  return (
    <div className="mx-auto max-w-[760px] px-4 py-6 sm:px-6">
      <button onClick={() => router.back()} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "var(--text-2)" }}>
        <I d="M15 18l-6-6 6-6" /> Back
      </button>

      {/* Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <img src={c.avatar} alt="" className="h-[88px] w-[88px] rounded-full object-cover" />
        <div>
          <div className="text-[22px] font-extrabold leading-tight">{c.name}</div>
          <div className="text-[12px]" style={{ color: "var(--text-2)" }}>{c.email}</div>
        </div>
        <div className="mt-1 flex items-center gap-8">
          <div className="text-center"><div className="text-[20px] font-extrabold">{c.plays}</div><div className="text-[11px]" style={{ color: "var(--text-3)" }}>Plays</div></div>
          <div className="h-8 w-px" style={{ background: "var(--border-2)" }} />
          <div className="text-center"><div className="text-[20px] font-extrabold">{c.likes}</div><div className="text-[11px]" style={{ color: "var(--text-3)" }}>Likes</div></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        {([["mv", "Music Videos"], ["songs", "Songs"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="rounded-full px-4 py-1.5 text-[12px] font-bold transition-colors"
            style={{ background: tab === key ? "var(--accent)" : "var(--card-2)", color: tab === key ? "#fff" : "var(--text-2)" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-4">
        {tab === "mv"
          ? CREATOR_MVS.map((m: CommunityMv) => (
              <Row key={m.id} thumb={m.thumb} title={m.title} plays={m.plays} likes={m.likes} shares={m.shares} date={m.date} onOpen={() => router.push(`/watch?id=${m.id}`)} />
            ))
          : CREATOR_SONGS.map((s: CommunitySong) => (
              <Row key={s.id} thumb={s.cover} title={s.title} plays={s.plays} likes={s.likes} shares={s.shares} date={s.date} onOpen={() => router.push(`/song/play?id=${s.id}`)} />
            ))}
      </div>
    </div>
  );
}
