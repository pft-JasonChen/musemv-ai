"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { EnhanceButton } from "@/components/ui/EnhanceButton";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { useAudioPlayer } from "@/components/audio/useAudioPlayer";
import { COST_RENDER } from "@/lib/mv/types";
import { formatDuration, SAMPLE_AUDIO } from "@/lib/mv/mock";
import { buildTimedLines } from "@/lib/mv/lyrics";

const fmtTs = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function StoryboardEditor() {
  const router = useRouter();
  const { storyboard, setStoryboard, compose, resetForRerender } = useMvFlow();
  const { credits } = useCredits();
  const [buyOpen, setBuyOpen] = useState(false);
  // The MV song is play-only here — the song is locked after creation, so this
  // section only previews it (no editing). Fall back to the demo track so the
  // control is functional for library/sample songs that carry no local URL.
  const songPlayer = useAudioPlayer({ src: compose.song?.url ?? SAMPLE_AUDIO });

  function generateMv() {
    // GL-01: block the render when the balance can't cover it; route to IAP.
    if (credits < COST_RENDER) { setBuyOpen(true); return; }
    songPlayer.pause();
    resetForRerender();
    router.push("/mv/creating");
  }

  // Tolerant redirect: wait briefly so a persisted storyboard can hydrate.
  useEffect(() => {
    if (storyboard) return;
    const t = setTimeout(() => router.replace("/mv/room"), 400);
    return () => clearTimeout(t);
  }, [storyboard, router]);

  if (!storyboard) return null;

  const updateScene = (id: string, text: string) =>
    setStoryboard((sb) => (sb ? { ...sb, scenes: sb.scenes.map((s) => (s.id === id ? { ...s, text } : s)) } : sb));

  return (
    <div className="mx-auto max-w-[1000px] px-4 pt-6 pb-28 sm:px-6 sm:pb-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button aria-label="Back" onClick={() => router.back()} className="grid h-9 w-9 place-items-center rounded-full" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <h1 className="text-[24px] font-extrabold tracking-tight">Edit Storyboard</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        {/* Character image */}
        <div>
          <SectionLabel>Character Image</SectionLabel>
          <div className="overflow-hidden rounded-xl" style={{ aspectRatio: "9 / 16", background: "var(--card-2)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={storyboard.characterImage} alt="Character" className="h-full w-full object-cover" />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* MV song */}
          <div>
            <SectionLabel>MV Song</SectionLabel>
            <div className="flex items-center gap-3 rounded-xl border p-2.5" style={{ background: "var(--card)", borderColor: "var(--border-2)" }}>
              <button
                onClick={songPlayer.toggle}
                aria-label={songPlayer.playing ? "Pause song" : "Play song"}
                className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-md"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={compose.song?.art ?? "/assets/images/album-art/album_05.jpg"} alt="" className="h-full w-full object-cover" />
                <span className="absolute inset-0 grid place-items-center text-white transition-all group-hover:brightness-110" style={{ background: "rgba(0,0,0,.35)" }}>
                  {songPlayer.playing ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20" /></svg>
                  )}
                </span>
              </button>
              <div className="min-w-0">
                <div className="truncate text-[14px] font-semibold">{compose.song?.title ?? "Down the Memory Lane"}</div>
                <div className="text-[12px]" style={{ color: "var(--text-2)" }}>{formatDuration(compose.song?.durationSec ?? 145)}</div>
              </div>
            </div>
          </div>

          {/* Visual style */}
          <div>
            <SectionLabel>Visual Style</SectionLabel>
            <textarea
              value={storyboard.visualStyle}
              onChange={(e) => setStoryboard((sb) => (sb ? { ...sb, visualStyle: e.target.value } : sb))}
              className="w-full resize-none rounded-xl border bg-transparent p-3 text-[13px] outline-none no-scrollbar"
              style={{ background: "var(--card)", borderColor: "var(--border-2)", color: "var(--text)", minHeight: 72, lineHeight: 1.5 }}
            />
            <div className="mt-2 flex justify-end">
              <EnhanceButton value={storyboard.visualStyle} kind="storyboard" onEnhanced={(t) => setStoryboard((sb) => (sb ? { ...sb, visualStyle: t } : sb))} />
            </div>
          </div>

          {/* Story — read-only narrative summary from the original MV description */}
          <div>
            <SectionLabel>Story</SectionLabel>
            <div className="rounded-xl p-3 text-[13px]" style={{ background: "var(--card-2)", color: "var(--text-2)", lineHeight: 1.5 }}>{storyboard.story}</div>
          </div>

          {/* Synopsis — vertical waterfall (easy to read & edit across many scenes) */}
          <div>
            <SectionLabel>Synopsis</SectionLabel>
            <div className="flex flex-col gap-3">
              {storyboard.scenes.map((s) => (
                <div key={s.id} className="flex gap-3 rounded-xl border p-3" style={{ background: "var(--card)", borderColor: "var(--border-2)" }}>
                  <div className="flex w-[68px] shrink-0 flex-col">
                    <span className="text-[13px] font-bold" style={{ color: "var(--accent)" }}>Scene {s.index}</span>
                    <span className="mt-0.5 text-[11px]" style={{ color: "var(--text-2)" }}>{s.range}</span>
                  </div>
                  <textarea
                    value={s.text}
                    onChange={(e) => updateScene(s.id, e.target.value)}
                    rows={3}
                    className="min-h-[64px] w-full flex-1 resize-y rounded-lg bg-transparent p-2.5 text-[13px] outline-none no-scrollbar"
                    style={{ background: "var(--card-2)", color: "var(--text)", lineHeight: 1.5 }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Lyrics — read-only, timestamped passthrough from the song */}
          <div>
            <SectionLabel>Lyrics</SectionLabel>
            <div className="no-scrollbar max-h-[220px] overflow-y-auto rounded-xl p-3" style={{ background: "var(--card-2)" }}>
              <div className="flex flex-col gap-1.5">
                {buildTimedLines(storyboard.lyrics, compose.song?.durationSec ?? 0).map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="shrink-0 text-[11px] tabular-nums" style={{ color: "var(--text-3)" }}>[{fmtTs(l.t)}]</span>
                    <span className="text-[13px]" style={{ color: "var(--text-2)", lineHeight: 1.6 }}>{l.line}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-[66px] sm:bottom-0 mt-8 -mx-4 border-t px-4 py-3 sm:-mx-6 sm:px-6" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
        <Button className="w-full" onClick={generateMv}>
          Generate MV
          <span className="ml-1 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[14px] font-bold" style={{ background: "rgba(255,255,255,.18)" }}>
            {COST_RENDER}
          </span>
        </Button>
      </div>
      <BuyCreditsModal open={buyOpen} onClose={() => setBuyOpen(false)} />
    </div>
  );
}