"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { startingCredits } from "@/lib/user";

/**
 * ── `enhanceCost` / `consumeEnhance` REMOVED 2026-08-12 ─────────────────────
 * AI Enhance is free (spec area 11 §5.5, closing TBD-CC-03). There is no
 * cloud-config action for it, so charging was never part of the approved credit
 * model. This is a **C4 removal**, which C4 normally forbids ("additive only") —
 * taken deliberately by product decision and logged in `docs/CHANGELOG-RD.md`,
 * because leaving two permanently-inert keys in a frozen contract would tell RD
 * to implement billing that must not exist. See `ui/EnhanceButton.tsx`.
 */
interface CreditsValue {
  credits: number;
  addCredits: (n: number) => void;
}

const Ctx = createContext<CreditsValue | null>(null);


export function CreditsProvider({ children }: { children: React.ReactNode }) {
  // The product rule is `DEFAULT_CREDITS` (10); `startingCredits()` is that rule
  // plus the NEXT_PUBLIC_DEMO_CREDITS demo override. See `lib/user.ts`.
  const [credits, setCredits] = useState(startingCredits);
  const addCredits = useCallback((n: number) => setCredits((c) => c + n), []);


  const value = useMemo(
    () => ({ credits, addCredits }),
    [credits, addCredits],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCredits() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCredits must be used within CreditsProvider");
  return v;
}
