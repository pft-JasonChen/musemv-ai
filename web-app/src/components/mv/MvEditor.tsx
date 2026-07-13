"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EnhanceButton } from "@/components/ui/EnhanceButton";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { MV_TYPES } from "@/lib/mv/mock";

const COST_REGEN = 20;
const COST_MERGE = 10;

interface Take { id: string; video: string; status: "ready" | "generating" }

function I({ d, size = 18 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>;
}
function Bolt() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M13 2 4 14h6l-1 8 9-12h-6z" /></svg>;
}
function Toggle({ on }: { on: boolean }) {
  return (
    <span className="relative inline-block h-5 w-9 rounded-full transition-colors" style={{ background: on ? "var(--accent)" : "var(--card-3)" }}>
      <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all" style={{ left: on ? "18px" : "2px" }} />
    </span>
  );
}

export function MvEditor() {
  const router = useRouter();
  const { storyboard, setStoryboard, saveStoryboard, storyboardDirty, compose, setCompose } = useMvFlow();
  const { addCredits } = useCredits();

  const typeIdx = Math.max(0, MV_TYPES.findIndex((t) => t.id === compose.mvType));
  const defaultPreview = MV_TYPES[typeIdx].video;
  const pool = MV_TYPES.map((t) => t.video);

  const [added, setAdded] = useState<Record<string, Take[]>>({});
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (storyboard) return;
    const t = setTimeout(() => router.replace("/mv/room"), 400);
    return () => clearTimeout(t);
  }, [storyboard, router]);

  if (!storyboard) return null;

  const origId = (sid: string) => `${sid}-o`;
  const takesFor = (sid: string): Take[] => [{ id: origId(sid), video: defaultPreview, status: "ready" }, ...(added[sid] ?? [])];
  const selectedFor = (sid: string) => selected[sid] ?? origId(sid);
  const activeId = active ?? storyboard.scenes[0]?.id;
  const activeScene = storyboard.scenes.find((s) => s.id === activeId) ?? storyboard.scenes[0];
  const activeTakes = takesFor(activeScene.id);
  const activeVideo = activeTakes.find((t) => t.id === selectedFor(activeScene.id))?.video ?? defaultPreview;
  const dirty = storyboard.scenes.some((s) => selectedFor(s.id) !== origId(s.id));

  const settings = compose.settings;
  const patchSettings = (p: Partial<typeof settings>) => setCompose((c) => ({ ...c, settings: { ...c.settings, ...p } }));

  function updateScene(id: string, text: string) {
    setStoryboard((sb) => (sb ? { ...sb, scenes: sb.scenes.map((s) => (s.id === id ? { ...s, text } : s)) } : sb));
  }

  function regenerate(sid: string) {
    const takeId = `${sid}-${Date.now()}`;
    const others = pool.filter((v) => v !== defaultPreview);
    const video = others[Math.floor(Math.random() * others.length)] ?? defaultPreview;
    setAdded((a) => ({ ...a, [sid]: [...(a[sid] ?? []), { id: takeId, video, status: "generating" }] }));
    addCredits(-COST_REGEN);
    setTimeout(() => {
      setAdded((a) => ({ ...a, [sid]: (a[sid] ?? []).map((t) => (t.id === takeId ? { ...t, status: "ready" } : t)) }));
    }, 2600);
  }

  function merge() {
    if (!dirty || !storyboard) return;
    addCredits(-COST_MERGE);
    saveStoryboard(storyboard);
    router.push("/mv/creating");
  }

  function save() {
    if (!storyboard) return;
    saveStoryboard(storyboard);
    setToast("Saved");
    setTimeout(() => setToast(null), 1800);
  }

  const mvName = (settings.title.on && settings.title.text) || compose.song?.title || "Untitled MV";

  return (
    <div className="mx-auto max-w-[1100px] px-4 pt-6 pb-24 sm:px-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button aria-label="Back" onClick={() => router.back()} className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: "var(--card-2)", color: "var(--text-2)" }}><I d="M15 18l-6-6 6-6" /></button>
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-extrabold tracking-tight">{mvName}</h1>
            <div className="text-[12px]" style={{ color: "var(--text-2)" }}>Edit MV · {storyboard.scenes.length} shots</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={save} disabled={!storyboardDirty} className="h-10 rounded-xl px-4 text-[14px] font-bold transition-opacity disabled:opacity-40" style={{ background: storyboardDirty ? "var(--card-2)" : "transparent", color: storyboardDirty ? "var(--text)" : "var(--text-2)", border: "1px solid var(--border-2)" }}>
            {storyboardDirty ? "Save" : "Saved"}
          </button>
          <Button onClick={merge} disabled={!dirty} className="!h-10 px-5 text-[14px]">
            <I d="M7 8 3 12l4 4M17 8l4 4-4 4M14 4l-4 16" size={16} /> Merge MV
            <span className="ml-1 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-bold" style={{ background: "rgba(255,255,255,.18)" }}><Bolt /> {COST_MERGE}</span>
          </Button>
        </div>
      </div>

      {/* Context chip bar (read-only) + Output settings */}
      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border p-2.5" style={{ borderColor: "var(--border-2)", background: "var(--card)" }}>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
          <I d="M15 10l4.5-2.5v9L15 14M3 7h12v10H3z" size={14} /> {MV_TYPES[typeIdx].name}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px]" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
          <I d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" size={14} />
          {compose.song?.title ?? "No song"}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px]" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>{settings.ratio}</span>
        <span className="text-[11px]" style={{ color: "var(--text-3)" }}>Style &amp; song are locked after creation</span>
        <button onClick={() => setSettingsOpen(true)} className="ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold" style={{ borderColor: "var(--border-2)", color: "var(--text)" }}>
          <I d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9.5A1.7 1.7 0 0 0 11 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9.5a1.7 1.7 0 0 0 1.6 1.5H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" size={14} /> Output settings
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Main: preview + scene strip */}
        <div className="flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: "16 / 9", background: "#0e0e12" }}>
            <video key={activeVideo} src={activeVideo} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full" style={{ objectFit: settings.ratio === "9:16" ? "contain" : "cover" }} />
            <span className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white" style={{ background: "rgba(0,0,0,.55)" }}>Scene {activeScene.index} · {activeScene.range}</span>
          </div>

          <div>
            <div className="mb-2 text-[12px]" style={{ color: "var(--text-2)" }}>Timeline · {storyboard.scenes.length} scenes</div>
            <div className="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
              {storyboard.scenes.map((s) => {
                const isActive = s.id === activeScene.id;
                const generating = (added[s.id] ?? []).some((t) => t.status === "generating");
                const vid = takesFor(s.id).find((t) => t.id === selectedFor(s.id))?.video ?? defaultPreview;
                return (
                  <button key={s.id} onClick={() => setActive(s.id)} className="shrink-0 text-left">
                    <div className="relative overflow-hidden rounded-lg" style={{ width: 104, aspectRatio: "16 / 10", border: isActive ? "2px solid var(--accent)" : "0.5px solid var(--border-2)" }}>
                      <video src={vid} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                      {generating && <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full text-white" style={{ background: "rgba(0,0,0,.6)" }}><span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" /></span>}
                    </div>
                    <div className="mt-1 text-center text-[10px]" style={{ color: isActive ? "var(--accent)" : "var(--text-3)" }}>Scene {s.index}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side: edit panel */}
        <div className="flex flex-col rounded-2xl border p-4" style={{ borderColor: "var(--border-2)", background: "var(--card)" }}>
          <div className="text-[12px]" style={{ color: "var(--text-2)" }}>Scene {activeScene.index} · {activeScene.range}</div>
          <div className="mt-2 mb-1 text-[11px]" style={{ color: "var(--text-3)" }}>Video generation prompt</div>
          <textarea
            value={activeScene.text}
            onChange={(e) => updateScene(activeScene.id, e.target.value)}
            maxLength={2500}
            className="min-h-[120px] w-full resize-none rounded-lg border bg-transparent p-2.5 text-[13px] outline-none no-scrollbar"
            style={{ background: "var(--card-2)", borderColor: "var(--border-2)", color: "var(--text)", lineHeight: 1.5 }}
          />
          <div className="mb-3 mt-1 flex items-center justify-between">
            <EnhanceButton value={activeScene.text} kind="scene" onEnhanced={(t) => updateScene(activeScene.id, t)} />
            <span className="text-[10px]" style={{ color: "var(--text-3)" }}>{activeScene.text.length} / 2500</span>
          </div>

          <button
            onClick={() => regenerate(activeScene.id)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[14px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: "var(--accent)" }}
          >
            <I d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" size={16} /> Regenerate scene
            <span className="ml-1 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px]" style={{ background: "rgba(255,255,255,.2)" }}><Bolt /> {COST_REGEN}</span>
          </button>

          {/* Takes tray */}
          <div className="mt-4 mb-2 text-[11px]" style={{ color: "var(--text-2)" }}>Pick which take to use</div>
          <div className="grid grid-cols-3 gap-2">
            {activeTakes.map((t, i) => {
              const inUse = selectedFor(activeScene.id) === t.id;
              const isOrig = t.id === origId(activeScene.id);
              return (
                <button key={t.id} onClick={() => t.status === "ready" && setSelected((s) => ({ ...s, [activeScene.id]: t.id }))} disabled={t.status !== "ready"} className="text-left">
                  <div className="relative overflow-hidden rounded-lg" style={{ aspectRatio: "1", border: inUse ? "2px solid var(--accent)" : "0.5px solid var(--border-2)", background: "var(--card-2)" }}>
                    {t.status === "generating" ? (
                      <span className="grid h-full w-full place-items-center"><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /></span>
                    ) : (
                      <video src={t.video} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                    )}
                    {inUse && <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full text-white" style={{ background: "var(--accent)" }}><I d="M20 6 9 17l-5-5" size={12} /></span>}
                  </div>
                  <div className="mt-1 text-[10px]" style={{ color: inUse ? "var(--accent)" : "var(--text-3)" }}>{t.status === "generating" ? "generating…" : isOrig ? "original" : `take ${i + 1}`}</div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed" style={{ color: "var(--text-3)" }}>
            Regenerate adds a new take ({COST_REGEN} credits). The old take stays — pick the one you want, then Merge MV ({COST_MERGE} credits) to commit.
          </p>
        </div>
      </div>

      {/* Output settings modal */}
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Output settings" maxWidth={440}>
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[13px] font-semibold">MV title</span>
              <button onClick={() => patchSettings({ title: { ...settings.title, on: !settings.title.on } })} aria-label="Toggle title"><Toggle on={settings.title.on} /></button>
            </div>
            <input value={settings.title.text} disabled={!settings.title.on} onChange={(e) => patchSettings({ title: { ...settings.title, text: e.target.value } })} placeholder="Enter MV title" className="w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] outline-none disabled:opacity-40" style={{ background: "var(--card-2)", borderColor: "var(--border-2)", color: "var(--text)" }} />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[13px] font-semibold">Author name</span>
              <button onClick={() => patchSettings({ author: { ...settings.author, on: !settings.author.on } })} aria-label="Toggle author"><Toggle on={settings.author.on} /></button>
            </div>
            <input value={settings.author.text} disabled={!settings.author.on} onChange={(e) => patchSettings({ author: { ...settings.author, text: e.target.value } })} placeholder="Enter author name" className="w-full rounded-xl border bg-transparent px-3 py-2 text-[13px] outline-none disabled:opacity-40" style={{ background: "var(--card-2)", borderColor: "var(--border-2)", color: "var(--text)" }} />
          </div>
          <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--border-3)" }}>
            <span className="text-[13px] font-semibold">Show subtitle</span>
            <button onClick={() => patchSettings({ showSubtitle: !settings.showSubtitle })} aria-label="Toggle subtitle"><Toggle on={settings.showSubtitle} /></button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold">Show watermark</span>
            <button onClick={() => patchSettings({ watermark: !settings.watermark })} aria-label="Toggle watermark"><Toggle on={settings.watermark} /></button>
          </div>
          <Button className="mt-1 w-full" onClick={() => setSettingsOpen(false)}>Done</Button>
        </div>
      </Modal>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full px-4 py-2 text-[13px] font-semibold text-white shadow-lg" style={{ background: "rgba(20,20,24,.95)" }}>{toast}</div>
      )}
    </div>
  );
}
