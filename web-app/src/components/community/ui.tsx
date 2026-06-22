"use client";

import { formatCount, type Badge } from "@/lib/mv/community";

export function Headphones({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 14v-2a9 9 0 0 1 18 0v2" />
      <path d="M21 16a2 2 0 0 1-2 2h-1v-6h1a2 2 0 0 1 2 2zM3 16a2 2 0 0 0 2 2h1v-6H5a2 2 0 0 0-2 2z" />
    </svg>
  );
}
export function Heart({ size = 12, filled = false }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}
export function Share({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" />
    </svg>
  );
}
export function Play({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><polygon points="6,4 20,12 6,20" /></svg>;
}
export function ChevronRight({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 6l6 6-6 6" /></svg>;
}

export function BadgePill({ badge }: { badge: Badge }) {
  if (!badge) return null;
  const hot = badge === "HOT";
  return (
    <span
      className="absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white"
      style={{ background: hot ? "linear-gradient(135deg,#FF6BCE,#FF4E50)" : "linear-gradient(135deg,#A855F7,#4338CA)" }}
    >
      {badge}
    </span>
  );
}

/** play / like / share stat row */
export function Stats({ plays, likes, shares }: { plays: number; likes: number; shares: number }) {
  return (
    <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--text-2)" }}>
      <span className="inline-flex items-center gap-1"><Headphones /> {formatCount(plays)}</span>
      <span className="inline-flex items-center gap-1"><Heart /> {formatCount(likes)}</span>
      <span className="inline-flex items-center gap-1"><Share /> {formatCount(shares)}</span>
    </div>
  );
}

export function SectionHead({ title, href }: { title: string; href?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[18px] font-extrabold tracking-tight">{title}</h2>
      {href && (
        <a href={href} className="inline-flex items-center gap-0.5 text-[12px] font-semibold" style={{ color: "var(--accent)" }}>
          See all <ChevronRight />
        </a>
      )}
    </div>
  );
}
