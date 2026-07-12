"use client";

// Session-local "My Creations" list, fed by the MV/Song flow providers as
// jobs start and finish. In-memory only (a reload loses it); the backend
// replaces this with a persisted history endpoint.

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export interface HistoryItem {
  id: string;
  kind: "mv" | "song";
  title: string;
  thumb: string;
  status: "generating" | "completed" | "failed";
  resultUrl?: string;
}

interface HistoryValue {
  history: HistoryItem[];
  /** Prepend a generating entry (replacing any existing entry with the same id). */
  upsertGenerating: (item: Omit<HistoryItem, "status">) => void;
  markCompleted: (id: string, resultUrl?: string) => void;
  markFailed: (id: string) => void;
}

const Ctx = createContext<HistoryValue | null>(null);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const upsertGenerating = useCallback((item: Omit<HistoryItem, "status">) => {
    setHistory((h) => [{ ...item, status: "generating" }, ...h.filter((x) => x.id !== item.id)]);
  }, []);

  const markCompleted = useCallback((id: string, resultUrl?: string) => {
    setHistory((h) => h.map((x) => (x.id === id ? { ...x, status: "completed", resultUrl } : x)));
  }, []);

  const markFailed = useCallback((id: string) => {
    setHistory((h) => h.map((x) => (x.id === id ? { ...x, status: "failed" } : x)));
  }, []);

  const value = useMemo(
    () => ({ history, upsertGenerating, markCompleted, markFailed }),
    [history, upsertGenerating, markCompleted, markFailed],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHistory() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useHistory must be used within HistoryProvider");
  return v;
}
