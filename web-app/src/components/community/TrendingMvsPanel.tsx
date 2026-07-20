"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TRENDING_MVS, NEW_MVS, formatCount } from "@/lib/mv/community";
import { Heart, Play } from "@/components/community/ui";

const ITEMS = [...TRENDING_MVS, ...NEW_MVS.slice(0, 4)];

export function TrendingMvsPanel() {
  const router = useRouter();
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border-2)", background: "var(--card)" }}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-extrabold tracking-tight">Trending from community</h3>
        <Link href="/explore/mvs" className="text-[12px] font-semibold" style={{ color: "var(--accent)" }}>See all</Link>
      </div>
      <div className="flex flex-col gap-2.5">
        {ITEMS.map((m) => (
          <button key={m.id} onClick={() => router.push(`/watch?id=${m.id}`)} className="group flex items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-[var(--card-2)]">
            <div className="relative h-[52px] w-[68px] shrink-0 overflow-hidden rounded-lg" style={{ background: "var(--card-2)" }}>
              <img src={m.thumb} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 grid place-items-center text-white opacity-0 transition-opacity group-hover:opacity-100" style={{ background: "rgba(0,0,0,.35)" }}><Play size={16} /></span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold">{m.title}</div>
              <div className="truncate text-[11px]" style={{ color: "var(--text-2)" }}>{m.creator}</div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px]" style={{ color: "var(--text-2)" }}><Heart /> {formatCount(m.likes)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
