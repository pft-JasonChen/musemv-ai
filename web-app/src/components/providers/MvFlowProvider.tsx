"use client";
/* eslint-disable react-hooks/set-state-in-effect -- intentional one-time hydration of persisted storyboard from localStorage on mount */

// AI MV flow state: compose form, storyboard editing, generation progress and
// result. Generation goes through the MuseApi contract (@/lib/api) — this
// provider owns no fake timers; it polls jobs like a real client would.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api, pollJob } from "@/lib/api";
import { StoryboardSchema } from "@/lib/api/schemas";
import { DEFAULT_COMPOSE, type ComposeState, type MvJob, type Storyboard } from "@/lib/mv/types";
import { useHistory } from "./HistoryProvider";
import { IDLE_GEN, toGen, type Gen } from "./progress";

interface MvFlowValue {
  compose: ComposeState;
  setCompose: React.Dispatch<React.SetStateAction<ComposeState>>;
  patchCompose: (p: Partial<ComposeState>) => void;
  gen: Gen;
  storyboard: Storyboard | null;
  setStoryboard: React.Dispatch<React.SetStateAction<Storyboard | null>>;
  saveStoryboard: (sb: Storyboard) => void;
  storyboardDirty: boolean;
  resultUrl: string | null;
  startStoryboard: () => void;
  startRender: () => void;
  reset: () => void;
}

const Ctx = createContext<MvFlowValue | null>(null);

const STORAGE_KEY = "mv-storyboard";

export function MvFlowProvider({ children }: { children: React.ReactNode }) {
  const { upsertGenerating, markCompleted, markFailed } = useHistory();
  const [compose, setCompose] = useState<ComposeState>(DEFAULT_COMPOSE);
  const [gen, setGen] = useState<Gen>(IDLE_GEN);
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [savedJson, setSavedJson] = useState<string | null>(null);
  const jobId = useRef<string | null>(null);
  const cancelPoll = useRef<(() => void) | null>(null);

  const patchCompose = useCallback(
    (p: Partial<ComposeState>) => setCompose((c) => ({ ...c, ...p })),
    [],
  );

  const saveStoryboard = useCallback((sb: Storyboard) => {
    const j = JSON.stringify(sb);
    try {
      localStorage.setItem(STORAGE_KEY, j);
    } catch {}
    setSavedJson(j);
  }, []);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      saved = null;
    }
    if (!saved) return;
    // Validate + backfill: a storyboard persisted before `story`/`lyrics`/`cover*`
    // existed is migrated to the current shape via the schema defaults.
    let parsed;
    try {
      parsed = StoryboardSchema.safeParse(JSON.parse(saved));
    } catch {
      return;
    }
    if (!parsed.success) return;
    const normalized = JSON.stringify(parsed.data);
    setStoryboard((cur) => cur ?? parsed.data);
    setSavedJson(normalized);
  }, []);

  useEffect(() => () => cancelPoll.current?.(), []);

  /** Track `job`, updating gen on every poll tick until it completes or fails. */
  const track = useCallback(
    (job: MvJob, onDone: (job: MvJob) => void) => {
      cancelPoll.current?.();
      jobId.current = job.id;
      setGen(toGen(job));
      cancelPoll.current = pollJob(() => api.getMvJob(job.id), {
        onUpdate: (j) => setGen(toGen(j)),
        onDone,
        onError: () => {
          setGen((g) => ({ ...g, status: "failed" }));
          markFailed(job.id);
        },
      });
    },
    [markFailed],
  );

  const startStoryboard = useCallback(() => {
    setResultUrl(null);
    void api.createMvJob({ mode: "storyboard_first", compose }).then((job) => {
      upsertGenerating({
        id: job.id,
        kind: "mv",
        title: compose.song?.title ?? "Untitled MV",
        thumb: job.thumb,
      });
      track(job, (done) => {
        if (!done.storyboard) return;
        setStoryboard(done.storyboard);
        setSavedJson(JSON.stringify(done.storyboard));
      });
    });
  }, [compose, track, upsertGenerating]);

  const startRender = useCallback(() => {
    const start =
      jobId.current && storyboard
        ? api.renderMvJob(jobId.current, storyboard)
        : api.createMvJob({ mode: "direct", compose });
    void start.then((job) => {
      upsertGenerating({
        id: job.id,
        kind: "mv",
        title: compose.song?.title ?? "Untitled MV",
        thumb: job.thumb,
      });
      track(job, (done) => {
        if (!done.resultUrl) return;
        setResultUrl(done.resultUrl);
        markCompleted(done.id, done.resultUrl);
      });
    });
  }, [compose, storyboard, track, upsertGenerating, markCompleted]);

  const reset = useCallback(() => {
    cancelPoll.current?.();
    jobId.current = null;
    setCompose(DEFAULT_COMPOSE);
    setGen(IDLE_GEN);
    setStoryboard(null);
    setResultUrl(null);
  }, []);

  const storyboardDirty = storyboard != null && JSON.stringify(storyboard) !== savedJson;

  return (
    <Ctx.Provider
      value={{
        compose,
        setCompose,
        patchCompose,
        gen,
        storyboard,
        setStoryboard,
        saveStoryboard,
        storyboardDirty,
        resultUrl,
        startStoryboard,
        startRender,
        reset,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useMvFlow() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMvFlow must be used within MvFlowProvider");
  return v;
}
