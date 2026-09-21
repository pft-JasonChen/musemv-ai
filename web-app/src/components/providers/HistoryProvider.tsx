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
  /**
   * Character names entered at MV creation time, one per uploaded photo
   * (empty string for a slot left unnamed). Additive, MV-only. `/mv/result`'s
   * Character detail row reads this when the screen was opened from a History
   * row rather than the live flow, since `useOpenCreation`'s seeding has no
   * way to reconstruct the actual photos or their names (`YMW260911P0007`).
   * Names themselves are NOT part of `CharacterPhoto` (`schemas.ts`, C2,
   * frozen) — see `MvRoom.tsx`'s own note on why that field stays local.
   */
  characterNames?: string[];
}

interface HistoryValue {
  history: HistoryItem[];
  /** Prepend a generating entry (replacing any existing entry with the same id). */
  upsertGenerating: (item: Omit<HistoryItem, "status">) => void;
  markCompleted: (id: string, resultUrl?: string) => void;
  markFailed: (id: string) => void;
  /**
   * Ids the user has deleted, from EITHER source the History grid draws from —
   * the live `history` above or the `HISTORY_SAMPLES` seed. Deletion has to be
   * a filter rather than a splice because the seed is a module constant: the
   * demo panel's rule applies (`AGENTS.md`), a delete must not mutate seed data.
   */
  removed: ReadonlySet<string>;
  /**
   * Delete a creation from "My Creations" (YMW260917P0008). Lives here rather
   * than in `HistoryView` local state because `/mv/edit`'s "Delete this
   * Project" has to reach it from another route — and because a delete that
   * un-deleted itself as soon as you navigated away was never right.
   */
  remove: (id: string) => void;
}

const Ctx = createContext<HistoryValue | null>(null);

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [removed, setRemoved] = useState<ReadonlySet<string>>(() => new Set());

  const upsertGenerating = useCallback((item: Omit<HistoryItem, "status">) => {
    setHistory((h) => [{ ...item, status: "generating" }, ...h.filter((x) => x.id !== item.id)]);
  }, []);

  const markCompleted = useCallback((id: string, resultUrl?: string) => {
    setHistory((h) => h.map((x) => (x.id === id ? { ...x, status: "completed", resultUrl } : x)));
  }, []);

  const markFailed = useCallback((id: string) => {
    setHistory((h) => h.map((x) => (x.id === id ? { ...x, status: "failed" } : x)));
  }, []);

  const remove = useCallback((id: string) => {
    setRemoved((s) => {
      if (s.has(id)) return s;
      const next = new Set(s);
      next.add(id);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ history, upsertGenerating, markCompleted, markFailed, removed, remove }),
    [history, upsertGenerating, markCompleted, markFailed, removed, remove],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHistory() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useHistory must be used within HistoryProvider");
  return v;
}
