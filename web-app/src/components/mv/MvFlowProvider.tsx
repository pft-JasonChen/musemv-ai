"use client";
/* eslint-disable react-hooks/set-state-in-effect -- intentional one-time hydration of persisted storyboard from localStorage on mount */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { mockStoryboard, mockSongResult, SAMPLE_RESULT_VIDEO } from "@/lib/mv/mock";
import { DEFAULT_CREDITS } from "@/lib/user";
import {
  DEFAULT_COMPOSE,
  DEFAULT_SONG_COMPOSE,
  type SongCompose,
  type SongResult,
  type ComposeState,
  type MvMode,
  type Storyboard,
} from "@/lib/mv/types";

export type GenStatus = "idle" | "processing" | "done";

export interface HistoryItem {
  id: string;
  kind: "mv" | "song";
  title: string;
  thumb: string;
  status: "generating" | "completed";
  resultUrl?: string;
}

interface Gen {
  status: GenStatus;
  progress: number;
  step: string;
}

interface FlowValue {
  compose: ComposeState;
  setCompose: React.Dispatch<React.SetStateAction<ComposeState>>;
  patchCompose: (p: Partial<ComposeState>) => void;
  mode: MvMode | null;
  gen: Gen;
  storyboard: Storyboard | null;
  setStoryboard: React.Dispatch<React.SetStateAction<Storyboard | null>>;
  saveStoryboard: (sb: Storyboard) => void;
  storyboardDirty: boolean;
  resultUrl: string | null;
  history: HistoryItem[];
  credits: number;
  addCredits: (n: number) => void;
  songCompose: SongCompose;
  patchSongCompose: (p: Partial<SongCompose>) => void;
  songResult: SongResult | null;
  startSong: () => void;
  startStoryboard: () => void;
  startRender: () => void;
  reset: () => void;
}

const Ctx = createContext<FlowValue | null>(null);

const STORYBOARD_MS = 7000;
const RENDER_MS = 11000;
const STORYBOARD_STEPS = ["Analyzing audio...", "Designing scenes...", "Composing storyboard...", "Finalizing..."];
const RENDER_STEPS = ["Preparing...", "Rendering frames...", "Syncing to music...", "Encoding video..."];
const SONG_MS = 8000;
const SONG_STEPS = ["Setting the tempo...", "Writing the melody...", "Adding vocals...", "Mixing the track..."];

export function MvFlowProvider({ children }: { children: React.ReactNode }) {
  const [compose, setCompose] = useState<ComposeState>(DEFAULT_COMPOSE);
  const [mode, setMode] = useState<MvMode | null>(null);
  const [gen, setGen] = useState<Gen>({ status: "idle", progress: 0, step: "" });
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [credits, setCredits] = useState(DEFAULT_CREDITS);
  const [savedJson, setSavedJson] = useState<string | null>(null);
  const [songCompose, setSongCompose] = useState<SongCompose>(DEFAULT_SONG_COMPOSE);
  const [songResult, setSongResult] = useState<SongResult | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const histId = useRef<string | null>(null);

  const patchCompose = useCallback((p: Partial<ComposeState>) => setCompose((c) => ({ ...c, ...p })), []);
  const addCredits = useCallback((n: number) => setCredits((c) => c + n), []);
  const patchSongCompose = useCallback((p: Partial<SongCompose>) => setSongCompose((c) => ({ ...c, ...p })), []);
  const saveStoryboard = useCallback((sb: Storyboard) => {
    const j = JSON.stringify(sb);
    try { localStorage.setItem("mv-storyboard", j); } catch {}
    setSavedJson(j);
  }, []);
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem("mv-storyboard"); } catch { saved = null; }
    if (!saved) return;
    setStoryboard((cur) => cur ?? (JSON.parse(saved!) as Storyboard));
    setSavedJson(saved);
  }, []);

  const run = useCallback(
    (durationMs: number, steps: string[], onDone: () => void, hist: Omit<HistoryItem, "status">) => {
      if (timer.current) clearInterval(timer.current);
      histId.current = hist.id;
      setHistory((h) => [{ ...hist, status: "generating" }, ...h.filter((x) => x.id !== hist.id)]);
      setGen({ status: "processing", progress: 0, step: steps[0] });
      const started = Date.now();
      timer.current = setInterval(() => {
        const elapsed = Date.now() - started;
        const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
        const step = steps[Math.min(steps.length - 1, Math.floor((pct / 100) * steps.length))];
        setGen({ status: pct >= 100 ? "done" : "processing", progress: pct, step });
        if (pct >= 100) {
          if (timer.current) clearInterval(timer.current);
          onDone();
        }
      }, 120);
    },
    [],
  );

  const startStoryboard = useCallback(() => {
    setMode("storyboard_first");
    setResultUrl(null);
    run(
      STORYBOARD_MS,
      STORYBOARD_STEPS,
      () => { const sb = mockStoryboard(); setStoryboard(sb); setSavedJson(JSON.stringify(sb)); },
      { id: crypto.randomUUID(), kind: "mv", title: compose.song?.title ?? "Untitled MV", thumb: mockStoryboard().characterImage },
    );
  }, [run, compose.song]);

  const startRender = useCallback(() => {
    run(
      RENDER_MS,
      RENDER_STEPS,
      () => {
        setResultUrl(SAMPLE_RESULT_VIDEO);
        const id = histId.current;
        setHistory((h) => h.map((x) => (x.id === id ? { ...x, status: "completed", resultUrl: SAMPLE_RESULT_VIDEO } : x)));
      },
      histId.current
        ? { id: histId.current, kind: "mv", title: compose.song?.title ?? "Untitled MV", thumb: storyboard?.characterImage ?? SAMPLE_RESULT_VIDEO }
        : { id: crypto.randomUUID(), kind: "mv", title: compose.song?.title ?? "Untitled MV", thumb: SAMPLE_RESULT_VIDEO },
    );
  }, [run, compose.song, storyboard]);

  const startSong = useCallback(() => {
    const res = mockSongResult(songCompose);
    setSongResult(null);
    run(
      SONG_MS,
      SONG_STEPS,
      () => {
        setSongResult(res);
        const id = histId.current;
        setHistory((h) => h.map((x) => (x.id === id ? { ...x, status: "completed", resultUrl: res.audioUrl } : x)));
      },
      { id: crypto.randomUUID(), kind: "song", title: res.title, thumb: res.cover },
    );
  }, [run, songCompose]);

  const reset = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    setCompose(DEFAULT_COMPOSE);
    setMode(null);
    setGen({ status: "idle", progress: 0, step: "" });
    setStoryboard(null);
    setResultUrl(null);
  }, []);

  const storyboardDirty = storyboard != null && JSON.stringify(storyboard) !== savedJson;

  return (
    <Ctx.Provider
      value={{ compose, setCompose, patchCompose, mode, gen, storyboard, setStoryboard, saveStoryboard, storyboardDirty, resultUrl, history, credits, addCredits, songCompose, patchSongCompose, songResult, startSong, startStoryboard, startRender, reset }}
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
