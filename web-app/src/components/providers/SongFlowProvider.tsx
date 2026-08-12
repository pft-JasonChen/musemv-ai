"use client";

// AI Song flow state: compose form, generation progress and result.
// Generation goes through the MuseApi contract (@/lib/api).

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api, pollJob } from "@/lib/api";
import {
  songCost,
  DEFAULT_SONG_COMPOSE,
  type SongCompose,
  type SongResult,
} from "@/lib/mv/types";
import { useHistory } from "./HistoryProvider";
import { useCredits } from "./CreditsProvider";
import { IDLE_GEN, toGen, type Gen } from "./progress";

interface SongFlowValue {
  songCompose: SongCompose;
  patchSongCompose: (p: Partial<SongCompose>) => void;
  gen: Gen;
  songResult: SongResult | null;
  /**
   * Hydrate the flow with an ALREADY-FINISHED song, so `/song/result` can be
   * opened for something the user made earlier instead of only for the take
   * this session just generated. `/history` uses it to route a done song row at
   * its own result screen; nothing else should.
   *
   * C4 addition, not a rename — see `docs/CHANGELOG-RD.md` 2026-08-06.
   */
  setSongResult: React.Dispatch<React.SetStateAction<SongResult | null>>;
  startSong: () => void;
  /** Discard the prior song result before composing a brand-new song. */
  resetForNewSong: () => void;
  /** SONG-03: prepare a recreate — the next generation charges the recreate cost
   *  and the previous song stays in History (a fresh job = a new entry). */
  resetForRecreate: () => void;
}

const Ctx = createContext<SongFlowValue | null>(null);

export function SongFlowProvider({ children }: { children: React.ReactNode }) {
  const { upsertGenerating, markCompleted, markFailed } = useHistory();
  const { addCredits } = useCredits();
  const [songCompose, setSongCompose] = useState<SongCompose>(DEFAULT_SONG_COMPOSE);
  const [gen, setGen] = useState<Gen>(IDLE_GEN);
  const [songResult, setSongResult] = useState<SongResult | null>(null);
  const cancelPoll = useRef<(() => void) | null>(null);
  // NOTE: there used to be a `nextCost` ref here, because a Recreate charged a
  // different (flat 50) amount for exactly one run. Since 2026-08-12 a Recreate
  // bills the same as any generation (spec 11 §3.1 — vocal 6 / instrumental 12),
  // so the amount is simply derived from the compose at charge time and the
  // one-shot ref is gone.

  const patchSongCompose = useCallback(
    (p: Partial<SongCompose>) => setSongCompose((c) => ({ ...c, ...p })),
    [],
  );

  useEffect(() => () => cancelPoll.current?.(), []);

  const startSong = useCallback(() => {
    setSongResult(null);
    // GL-01: charge on generation start; refund if the job fails.
    const cost = songCost(songCompose.instrumental);
    addCredits(-cost);
    const refund = () => addCredits(cost);
    void api
      .createSongJob(songCompose)
      .then((job) => {
        upsertGenerating({ id: job.id, kind: "song", title: job.title, thumb: job.cover });
        setGen(toGen(job));
        cancelPoll.current?.();
        cancelPoll.current = pollJob(() => api.getSongJob(job.id), {
          onUpdate: (j) => setGen(toGen(j)),
          onDone: (done) => {
            if (!done.result) return;
            setSongResult(done.result);
            markCompleted(done.id, done.result.audioUrl);
          },
          onError: () => {
            setGen((g) => ({ ...g, status: "failed" }));
            markFailed(job.id);
            refund();
          },
        });
      })
      .catch(() => {
        refund();
        setGen((g) => ({ ...g, status: "failed" }));
      });
  }, [songCompose, upsertGenerating, markCompleted, markFailed, addCredits]);

  // A brand-new song must discard the previous result, otherwise the song
  // generation screen's `alreadyDone` guard skips generation (showing the old song).
  const resetForNewSong = useCallback(() => {
    cancelPoll.current?.();
    setGen(IDLE_GEN);
    setSongResult(null);
  }, []);

  const resetForRecreate = useCallback(() => {
    cancelPoll.current?.();
    setGen(IDLE_GEN);
    setSongResult(null);
  }, []);

  return (
    <Ctx.Provider
      value={{
        songCompose,
        patchSongCompose,
        gen,
        songResult,
        setSongResult,
        startSong,
        resetForNewSong,
        resetForRecreate,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSongFlow() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSongFlow must be used within SongFlowProvider");
  return v;
}
