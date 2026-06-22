"use client";

import { useState } from "react";
import { useMvFlow } from "@/components/mv/MvFlowProvider";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";
import { AccountMenu } from "@/components/account/AccountMenu";
import { MOCK_USER } from "@/lib/user";

export function HeaderActions() {
  const { credits } = useMvFlow();
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function onPurchased(n: number) {
    setToast(`Added ${n} credits`);
    setTimeout(() => setToast(null), 2000);
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setCreditsOpen(true)}
        aria-label="Buy credits"
        className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-bold transition-opacity hover:opacity-80"
        style={{ background: "rgba(245,158,11,.18)", color: "var(--gold)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><circle cx="12" cy="12" r="9" opacity="0.25" /><circle cx="12" cy="12" r="6" /></svg>
        {credits}
        <span className="ml-0.5 text-[14px] leading-none">+</span>
      </button>

      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Account menu"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="grid h-8 w-8 place-items-center rounded-full text-white"
          style={{ background: "var(--mv-grad)", fontWeight: 700, fontSize: 13 }}
        >
          {MOCK_USER.name.charAt(0)}
        </button>
        <AccountMenu open={menuOpen} onClose={() => setMenuOpen(false)} onBuyCredits={() => setCreditsOpen(true)} />
      </div>

      <BuyCreditsModal open={creditsOpen} onClose={() => setCreditsOpen(false)} onPurchased={onPurchased} />

      {toast && (
        <div className="fixed right-4 top-16 z-50 rounded-full px-4 py-2 text-[13px] font-semibold" style={{ background: "var(--card-3)", color: "var(--text)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
