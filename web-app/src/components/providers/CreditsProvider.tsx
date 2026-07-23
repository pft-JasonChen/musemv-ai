"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DEFAULT_CREDITS } from "@/lib/user";

interface CreditsValue {
  credits: number;
  addCredits: (n: number) => void;
  /** SONG-04: cost of the NEXT AI Enhance — the first per session is free, then 1 each. */
  enhanceCost: number;
  /** Charge for one Enhance (no-op charge when it's the free first use); returns
   *  false when the charge can't be covered so the caller can skip enhancing. */
  consumeEnhance: () => boolean;
}

const Ctx = createContext<CreditsValue | null>(null);

const ENHANCE_COST = 1;

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState(DEFAULT_CREDITS);
  const [enhanceUsed, setEnhanceUsed] = useState(0);
  const addCredits = useCallback((n: number) => setCredits((c) => c + n), []);

  const enhanceCost = enhanceUsed === 0 ? 0 : ENHANCE_COST;
  const consumeEnhance = useCallback(() => {
    let ok = true;
    setEnhanceUsed((used) => {
      const cost = used === 0 ? 0 : ENHANCE_COST;
      if (cost > 0) {
        if (credits < cost) { ok = false; return used; }
        setCredits((c) => c - cost);
      }
      return used + 1;
    });
    return ok;
  }, [credits]);

  const value = useMemo(
    () => ({ credits, addCredits, enhanceCost, consumeEnhance }),
    [credits, addCredits, enhanceCost, consumeEnhance],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCredits() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCredits must be used within CreditsProvider");
  return v;
}
