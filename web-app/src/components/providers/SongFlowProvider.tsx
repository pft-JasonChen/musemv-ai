"use client";

// AI Song flow state: compose form, generation progress and result.
// Generation goes through the MuseApi contract (@/lib/api).

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api, pollJob } from "@/lib/api";
import { DEFAULT_SONG_COMPOSE, type SongCompose, type SongResult } from "@/lib/mv/types";
import { useHistory } from "./HistoryProvider";
import { IDLE_GEN, toGen, type Gen } from "./progress";

interface SongFlowValue {
  songCompose: SongCompose;
  patchSongCompose: (p: Partial<SongCompose>) => void;
  gen: Gen;
  songResult: SongResult | null;
  startSong: () => void;
  /** Discard the prior song result before composing a brand-new song. */
  resetForNewSong: () => void;
}

const Ctx = createContext<SongFlowValue | null>(null);

export function SongFlowProvider({ children }: { children: React.ReactNode }) {
  const { upsertGenerating, markCompleted, markFailed } = useHistory();
  const [songCompose, setSongCompose] = useState<SongCompose>(DEFAULT_SONG_COMPOSE);
  const [gen, setGen] = useState<Gen>(IDLE_GEN);
  const [songResult, setSongResult] = useState<SongResult | null>(null);
  const cancelPoll = useRef<(() => void) | null>(null);

  const patchSongCompose = useCallback(
    (p: Partial<SongCompose>) => setSongCompose((c) => ({ ...c, ...p })),
    [],
  );

  useEffect(() => () => cancelPoll.current?.(), []);

  const startSong = useCallback(() => {
    setSongResult(null);
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
          },
        });
      })
      .catch(() => setGen((g) => ({ ...g, status: "failed" })));
  }, [songCompose, upsertGenerating, markCompleted, markFailed]);

  // A brand-new song must discard the previous result, otherwise the song
  // generation screen's `alreadyDone` guard skips generation (showing the old song).
  const resetForNewSong = useCallback(() => {
    cancelPoll.current?.();
    setGen(IDLE_GEN);
    setSongResult(null);
  }, []);

  return (
    <Ctx.Provider
      value={{ songCompose, patchSongCompose, gen, songResult, startSong, resetForNewSong }}
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
