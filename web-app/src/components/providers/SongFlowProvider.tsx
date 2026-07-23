"use client";

// AI Song flow state: compose form, generation progress and result.
// Generation goes through the MuseApi contract (@/lib/api).

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api, pollJob } from "@/lib/api";
import { COST_SONG, COST_SONG_RECREATE, DEFAULT_SONG_COMPOSE, type SongCompose, type SongResult } from "@/lib/mv/types";
import { useHistory } from "./HistoryProvider";
import { useCredits } from "./CreditsProvider";
import { IDLE_GEN, toGen, type Gen } from "./progress";

interface SongFlowValue {
  songCompose: SongCompose;
  patchSongCompose: (p: Partial<SongCompose>) => void;
  gen: Gen;
  songResult: SongResult | null;
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
  // Cost the NEXT generation charges — a plain compose is COST_SONG; a recreate
  // bumps it to COST_SONG_RECREATE for one run, then falls back.
  const nextCost = useRef(COST_SONG);

  const patchSongCompose = useCallback(
    (p: Partial<SongCompose>) => setSongCompose((c) => ({ ...c, ...p })),
    [],
  );

  useEffect(() => () => cancelPoll.current?.(), []);

  const startSong = useCallback(() => {
    setSongResult(null);
    // GL-01: charge on generation start; refund if the job fails. The amount is
    // COST_SONG normally, or COST_SONG_RECREATE for a one-shot recreate (SONG-03).
    const cost = nextCost.current;
    nextCost.current = COST_SONG;
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
      .catch(() => { refund(); setGen((g) => ({ ...g, status: "failed" })); });
  }, [songCompose, upsertGenerating, markCompleted, markFailed, addCredits]);

  // A brand-new song must discard the previous result, otherwise the song
  // generation screen's `alreadyDone` guard skips generation (showing the old song).
  const resetForNewSong = useCallback(() => {
    cancelPoll.current?.();
    nextCost.current = COST_SONG;
    setGen(IDLE_GEN);
    setSongResult(null);
  }, []);

  const resetForRecreate = useCallback(() => {
    cancelPoll.current?.();
    nextCost.current = COST_SONG_RECREATE; // the upcoming generation charges the recreate cost
    setGen(IDLE_GEN);
    setSongResult(null);
  }, []);

  return (
    <Ctx.Provider
      value={{ songCompose, patchSongCompose, gen, songResult, startSong, resetForNewSong, resetForRecreate }}
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
