"use client";
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NEW_MVS, TRENDING_MVS, DEFAULT_CREATOR, formatCount } from "@/lib/mv/community";
import { BadgePill, Heart } from "@/components/community/ui";
import { CommunityEmpty, useOnline } from "@/components/community/EmptyState";
import { CommunityMvDialog } from "./CommunityMvDialog";

function I({ d }: { d: string }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
}

const ALL_MVS = [...TRENDING_MVS, ...NEW_MVS];

export function MvExplore({ initialPlayId }: { initialPlayId?: string }) {
  const router = useRouter();
  const [playId, setPlayId] = useState<string | null>(initialPlayId ?? null);
  const online = useOnline();

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
      <button onClick={() => router.push("/")} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: "var(--text-2)" }}>
        <I d="M15 18l-6-6 6-6" /> Home
      </button>
      <h1 className="mb-1 text-[22px] font-extrabold tracking-tight">Explore Music Videos</h1>
      <p className="mb-5 text-[13px]" style={{ color: "var(--text-2)" }}>Trending and new creations from the community.</p>

      {!online ? (
        <CommunityEmpty variant="offline" />
      ) : ALL_MVS.length === 0 ? (
        <CommunityEmpty variant="empty" />
      ) : (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ALL_MVS.map((m) => (
          <button key={m.id} onClick={() => setPlayId(m.id)} className="hover-lift overflow-hidden rounded-xl text-left" style={{ background: "var(--card)" }}>
            <div className="relative aspect-[3/4]">
              <img src={m.thumb} alt="" className="h-full w-full object-cover" />
              <BadgePill badge={m.badge} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,.8), transparent 55%)" }} />
              <div className="absolute bottom-2 left-3 right-3">
                <div className="truncate text-[13px] font-bold text-white">{m.title}</div>
                <div className="mt-0.5 flex items-center gap-2">
                  <img src={DEFAULT_CREATOR.avatar} alt="" className="h-4 w-4 rounded-full object-cover" />
                  <span className="truncate text-[11px] text-white/75">{m.creator}</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-white/85"><Heart /> {formatCount(m.likes)}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      )}

      <CommunityMvDialog open={playId != null} mvId={playId} onClose={() => setPlayId(null)} />
    </div>
  );
}
