"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useCredits } from "@/components/providers/CreditsProvider";
import { MOCK_USER } from "@/lib/user";

interface Props {
  open: boolean;
  onClose: () => void;
  onBuyCredits: () => void;
}

function Avatar({ size = 40 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full text-white"
      style={{ width: size, height: size, background: "var(--mv-grad)", fontWeight: 700, fontSize: size * 0.4 }}
    >
      {MOCK_USER.name.charAt(0)}
    </span>
  );
}

export function AccountMenu({ open, onClose, onBuyCredits }: Props) {
  const { credits } = useCredits();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const item = "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors";

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-2xl border shadow-xl"
      style={{ background: "var(--card)", borderColor: "var(--border-2)" }}
    >
      <div className="flex items-center gap-3 border-b p-4" style={{ borderColor: "var(--border-3)" }}>
        <Avatar />
        <div className="min-w-0">
          <div className="truncate text-[14px] font-bold">{MOCK_USER.name}</div>
          <div className="truncate text-[12px]" style={{ color: "var(--text-2)" }}>{MOCK_USER.email}</div>
        </div>
      </div>

      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border-3)" }}>
        <span className="inline-flex items-center gap-1.5 text-[14px] font-bold" style={{ color: "var(--gold)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="12" cy="12" r="9" opacity="0.25" /><circle cx="12" cy="12" r="6" /></svg>
          {credits}
        </span>
        <button
          onClick={() => { onClose(); onBuyCredits(); }}
          className="rounded-lg px-2.5 py-1 text-[12px] font-bold text-white"
          style={{ background: "var(--accent)" }}
        >
          Buy Credits
        </button>
      </div>

      <nav className="p-2">
        <Link href="/profile" onClick={onClose} className={item} style={{ color: "var(--text)" }} role="menuitem">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" /></svg>
          Profile
        </Link>
        <Link href="/history" onClick={onClose} className={item} style={{ color: "var(--text)" }} role="menuitem">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5M12 7v5l3 2" /></svg>
          My Creations
        </Link>
        <button onClick={onClose} className={`${item} w-full`} style={{ color: "var(--red)" }} role="menuitem">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
          Sign Out
        </button>
      </nav>
    </div>
  );
}
