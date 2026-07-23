"use client";

import { useState } from "react";
/* eslint-disable @next/next/no-img-element */
import { useCredits } from "@/components/providers/CreditsProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";
import { AccountMenu } from "@/components/account/AccountMenu";

export function HeaderActions() {
  const { credits } = useCredits();
  const { loggedIn, hydrated, openSignIn, profile, subscribed } = useAuth();
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function onPurchased(n: number) {
    setToast(`Added ${n} credits`);
    setTimeout(() => setToast(null), 2000);
  }

  // Until persisted auth is read from localStorage, the server/first-paint state
  // is logged-out. Rendering it would flash the "Sign In" button for a signed-in
  // user before flipping. Reserve the height and show nothing until hydrated.
  if (!hydrated) {
    return <div className="h-8" aria-hidden />;
  }

  if (!loggedIn) {
    return (
      <button
        onClick={openSignIn}
        className="rounded-full px-4 py-1.5 text-[13px] font-bold text-white transition-all hover:brightness-110 active:scale-95"
        style={{ background: "var(--accent)" }}
      >
        Sign In
      </button>
    );
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
          className="relative grid h-8 w-8 place-items-center overflow-hidden rounded-full text-white"
          style={{ background: "var(--mv-grad)", fontWeight: 700, fontSize: 13, boxShadow: subscribed ? "0 0 0 2px var(--gold)" : undefined }}
        >
          {profile.avatar ? (
            <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            profile.name.charAt(0)
          )}
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
