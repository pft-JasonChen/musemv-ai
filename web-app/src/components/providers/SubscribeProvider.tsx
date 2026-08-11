"use client";

// Designer fix, 2026-08-11: RoomNavbar's header Upgrade pill and Sidebar's
// Upgrade button both used to `<Link href="/profile">` because that's where
// WA's real SubscribeModal lives (see the comments left in both files) — a
// deliberate call to not duplicate DP's IAP surface inside a shell slice.
// That falls apart on `/profile` itself: navigating to the page you are
// already on is a no-op, so the button visibly did nothing there ("這三顆的
// popup跑掉了"). This mirrors `AuthProvider`'s own `openSignIn` pattern
// (a provider owns the open state and mounts the dialog once, globally) so
// every Upgrade entry point — header, sidebar, and `/profile`'s own "Muse
// Pro" row — opens the SAME dialog instance directly, on every page.
//
// Follow-up, same day: the header/DetailNavbar credit pill (the "390 +"
// pill, distinct from the crown "Upgrade" pill) had the identical bug — it
// linked to `/profile`, a no-op there too. Figma (node 1783:41659) shows it
// opening "Buy Credits" directly, so that dialog is owned here too — the
// two purchase flows already live side by side everywhere they're offered
// (RoomNavbar's credit pill + Upgrade button, HeaderActions, AccountMenu),
// so one provider owning both is the natural home, not two.
//
// This is its OWN provider, not folded into `AuthProvider`, because both
// modals call `useAuth()` internally — mounting either from inside
// `AuthProvider.tsx` would import a module that imports `AuthProvider.tsx`
// right back, a real circular import. Nesting this provider INSIDE
// `AuthProvider` (and, for Buy Credits, also inside `CreditsProvider`) in
// `AppProviders.tsx` gets the same effect without the cycle.
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { SubscribeModal } from "@/components/credits/SubscribeModal";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";

interface SubscribeValue {
  /** Open the shared Subscribe dialog. `onSubscribed` (e.g. a toast) fires
   *  once, only on an actual successful subscribe — not on cancel/close. */
  openSubscribe: (onSubscribed?: (planName: string) => void) => void;
  /** Open the shared Buy Credits dialog — no subscription required (see
   *  `BuyCreditsModal`'s own note). `onPurchased` fires once, only on an
   *  actual purchase. */
  openBuyCredits: (onPurchased?: (credits: number) => void) => void;
}

const Ctx = createContext<SubscribeValue | null>(null);

export function SubscribeProvider({ children }: { children: React.ReactNode }) {
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const subscribeCallback = useRef<((planName: string) => void) | null>(null);

  const openSubscribe = useCallback((onSubscribed?: (planName: string) => void) => {
    subscribeCallback.current = onSubscribed ?? null;
    setSubscribeOpen(true);
  }, []);

  const closeSubscribe = useCallback(() => {
    setSubscribeOpen(false);
    subscribeCallback.current = null;
  }, []);

  const handleSubscribed = useCallback((planName: string) => {
    setSubscribeOpen(false);
    const fn = subscribeCallback.current;
    subscribeCallback.current = null;
    fn?.(planName);
  }, []);

  const [buyOpen, setBuyOpen] = useState(false);
  const buyCallback = useRef<((credits: number) => void) | null>(null);

  const openBuyCredits = useCallback((onPurchased?: (credits: number) => void) => {
    buyCallback.current = onPurchased ?? null;
    setBuyOpen(true);
  }, []);

  const closeBuyCredits = useCallback(() => {
    setBuyOpen(false);
    buyCallback.current = null;
  }, []);

  const handlePurchased = useCallback((credits: number) => {
    setBuyOpen(false);
    const fn = buyCallback.current;
    buyCallback.current = null;
    fn?.(credits);
  }, []);

  return (
    <Ctx.Provider value={{ openSubscribe, openBuyCredits }}>
      {children}
      <SubscribeModal open={subscribeOpen} onClose={closeSubscribe} onSubscribed={handleSubscribed} />
      <BuyCreditsModal open={buyOpen} onClose={closeBuyCredits} onPurchased={handlePurchased} />
    </Ctx.Provider>
  );
}

export function useSubscribe() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSubscribe must be used within SubscribeProvider");
  return v;
}
