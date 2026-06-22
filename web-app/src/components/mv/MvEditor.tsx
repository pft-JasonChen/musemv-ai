"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useMvFlow } from "./MvFlowProvider";
import { MV_TYPES } from "@/lib/mv/mock";

interface Regen { running: boolean; progress: number }

export function MvEditor() {
  const router = useRouter();
  const { storyboard, setStoryboard, saveStoryboard, compose } = useMvFlow();
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [regen, setRegen] = useState<Record<string, Regen>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (storyboard) return;
    const t = setTimeout(() => router.replace("/mv/room"), 400);
    return () => clearTimeout(t);
  }, [storyboard, router]);

  if (!storyboard) return null;

  const typeIdx = Math.max(0, MV_TYPES.findIndex((t) => t.id === compose.mvType));
  const typeName = MV_TYPES[typeIdx].name;
  const defaultPreview = MV_TYPES[typeIdx].video;
  const portrait = compose.settings.ratio === "9:16";

  function updateScene(id: string, text: string) {
    setStoryboard((sb) => (sb ? { ...sb, scenes: sb.scenes.map((s) => (s.id === id ? { ...s, text } : s)) } : sb));
    setDirty(true);
  }

  function regenerate(id: string) {
    setRegen((r) => ({ ...r, [id]: { running: true, progress: 0 } }));
    const start = Date.now();
    const dur = 2600;
    const iv = setInterval(() => {
      const p = Math.min(100, Math.round(((Date.now() - start) / dur) * 100));
      setRegen((r) => ({ ...r, [id]: { running: p < 100, progress: p } }));
      if (p >= 100) {
        clearInterval(iv);
        setPreviews((pv) => {
          const cur = pv[id] ?? defaultPreview;
          const others = MV_TYPES.map((t) => t.video).filter((v) => v !== cur);
          return { ...pv, [id]: others[Math.floor(Math.random() * others.length)] };
        });
        setDirty(true);
      }
    }, 120);
  }

  function merge() {
    if (!dirty || !storyboard) return;
    saveStoryboard(storyboard);
    router.push("/mv/creating");
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 pt-6 pb-28 sm:px-6">
      {/* Top bar */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button aria-label="Back" onClick={() => router.back()} className="grid h-8 w-8 place-items-center rounded-full" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <h1 className="text-[22px] font-extrabold tracking-tight">Edit MV</h1>
          <span className="text-[12px]" style={{ color: "var(--text-2)" }}>{storyboard.scenes.length} shots · {compose.settings.ratio} · {typeName}</span>
        </div>
      </div>

      {/* Scene rows */}
      <div className="flex flex-col gap-3">
        {storyboard.scenes.map((s) => {
          const r = regen[s.id];
          const src = previews[s.id] ?? defaultPreview;
          return (
            <div key={s.id} className="flex flex-col gap-3 rounded-2xl border p-3 sm:flex-row" style={{ background: "var(--card)", borderColor: r?.running ? "var(--accent)" : "var(--border-2)" }}>
              {/* 4:3 preview stage */}
              <div className="relative w-full shrink-0 overflow-hidden rounded-xl sm:w-[240px]" style={{ aspectRatio: "4 / 3", background: "#0e0e12" }}>
                <video
                  key={src}
                  src={src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 h-full w-full"
                  style={{ objectFit: portrait ? "contain" : "cover" }}
                />
                {r?.running && (
                  <div className="absolute inset-0 grid place-items-center" style={{ background: "rgba(0,0,0,.55)" }}>
                    <div className="text-center">
                      <div className="mx-auto mb-1 h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <div className="text-[12px] font-bold text-white">{r.progress}%</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Script + regenerate */}
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-[14px] font-bold" style={{ color: "var(--accent)" }}>Scene {s.index}</span>
                  <span className="text-[12px]" style={{ color: "var(--text-3)" }}>{s.range}</span>
                </div>
                <textarea
                  value={s.text}
                  onChange={(e) => updateScene(s.id, e.target.value)}
                  className="mb-2.5 min-h-[72px] flex-1 resize-none rounded-lg p-2.5 text-[13px] outline-none no-scrollbar"
                  style={{ background: "var(--card-2)", color: "var(--text)", lineHeight: 1.5 }}
                />
                <div>
                  <button
                    onClick={() => regenerate(s.id)}
                    disabled={r?.running}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[13px] font-semibold transition-opacity disabled:opacity-60"
                    style={{ background: r?.running ? "var(--card-3)" : "var(--card-2)", color: "var(--text)", border: "0.5px solid var(--border-2)" }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" /></svg>
                    {r?.running ? `Regenerating… ${r.progress}%` : "Regenerate scene"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed bottom Merge bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur" style={{ borderColor: "var(--border-2)", background: "color-mix(in srgb, var(--bg) 88%, transparent)" }}>
        <div className="mx-auto flex max-w-[900px] items-center gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <span className="hidden flex-1 text-[12px] sm:block" style={{ color: "var(--text-2)" }}>
            {dirty ? "Changes ready — merge them into a new MV." : "Regenerate or edit a scene to enable merging."}
          </span>
          <Button onClick={merge} disabled={!dirty} className="w-full sm:w-auto sm:px-8">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 8 3 12l4 4M17 8l4 4-4 4M14 4l-4 16" /></svg>
            Merge MV
          </Button>
        </div>
      </div>
    </div>
  );
}
