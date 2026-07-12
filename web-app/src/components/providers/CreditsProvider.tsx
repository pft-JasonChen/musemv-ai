"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DEFAULT_CREDITS } from "@/lib/user";

interface CreditsValue {
  credits: number;
  addCredits: (n: number) => void;
}

const Ctx = createContext<CreditsValue | null>(null);

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState(DEFAULT_CREDITS);
  const addCredits = useCallback((n: number) => setCredits((c) => c + n), []);
  const value = useMemo(() => ({ credits, addCredits }), [credits, addCredits]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCredits() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCredits must be used within CreditsProvider");
  return v;
}
