"use client";
/* eslint-disable react-hooks/set-state-in-effect -- intentional one-time hydration of persisted storyboard from localStorage on mount */

// AI MV flow state: compose form, storyboard editing, generation progress and
// result. Generation goes through the MuseApi contract (@/lib/api) — this
// provider owns no fake timers; it polls jobs like a real client would.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { api, pollJob } from "@/lib/api";
import { StoryboardSchema } from "@/lib/api/schemas";
import { COST_RENDER, COST_STORYBOARD, DEFAULT_COMPOSE, type ComposeState, type MvJob, type Storyboard } from "@/lib/mv/types";
import { useHistory } from "./HistoryProvider";
import { useCredits } from "./CreditsProvider";
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
  /** Discard any prior storyboard/result before generating a brand-new MV (keeps the compose form). */
  resetForNewMv: () => void;
  /** Discard the prior rendered video before re-rendering the current storyboard. */
  resetForRerender: () => void;
}

const Ctx = createContext<MvFlowValue | null>(null);

const STORAGE_KEY = "mv-storyboard";

export function MvFlowProvider({ children }: { children: React.ReactNode }) {
  const { upsertGenerating, markCompleted, markFailed } = useHistory();
  const { addCredits } = useCredits();
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

  /** Track `job`, updating gen on every poll tick until it completes or fails.
   *  `onFail` runs on error so the caller can refund a credit charge (GL-01). */
  const track = useCallback(
    (job: MvJob, onDone: (job: MvJob) => void, onFail?: () => void) => {
      cancelPoll.current?.();
      jobId.current = job.id;
      setGen(toGen(job));
      cancelPoll.current = pollJob(() => api.getMvJob(job.id), {
        onUpdate: (j) => setGen(toGen(j)),
        onDone,
        onError: () => {
          setGen((g) => ({ ...g, status: "failed" }));
          markFailed(job.id);
          onFail?.();
        },
      });
    },
    [markFailed],
  );

  const startStoryboard = useCallback(() => {
    setResultUrl(null);
    // GL-01: charge on generation start; refund if the job fails so the "credits
    // were not charged" failure copy stays true.
    addCredits(-COST_STORYBOARD);
    const refund = () => addCredits(COST_STORYBOARD);
    void api
      .createMvJob({ mode: "storyboard_first", compose })
      .then((job) => {
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
        }, refund);
      })
      .catch(() => { refund(); setGen((g) => ({ ...g, status: "failed" })); });
  }, [compose, track, upsertGenerating, addCredits]);

  const startRender = useCallback(() => {
    // GL-01: rendering the MV charges the render cost; refund on failure.
    addCredits(-COST_RENDER);
    const refund = () => addCredits(COST_RENDER);
    const start =
      jobId.current && storyboard
        ? api.renderMvJob(jobId.current, storyboard)
        : api.createMvJob({ mode: "direct", compose });
    void start
      .then((job) => {
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
        }, refund);
      })
      .catch(() => { refund(); setGen((g) => ({ ...g, status: "failed" })); });
  }, [compose, storyboard, track, upsertGenerating, markCompleted, addCredits]);

  // A brand-new MV must discard any storyboard/result/job left over from a
  // previous flow, otherwise the generation screens' `alreadyDone` guard sees
  // stale state and skips generation (bouncing to the old result).
  const resetForNewMv = useCallback(() => {
    cancelPoll.current?.();
    jobId.current = null;
    setGen(IDLE_GEN);
    setStoryboard(null);
    setResultUrl(null);
  }, []);

  // Re-rendering keeps the current storyboard + job id but must clear the prior
  // rendered video so the render screen starts fresh instead of bouncing back.
  const resetForRerender = useCallback(() => {
    cancelPoll.current?.();
    setGen(IDLE_GEN);
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
        resetForNewMv,
        resetForRerender,
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
