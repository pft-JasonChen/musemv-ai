"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CreditPill } from "@/components/ui/CreditPill";
import { EnhanceButton } from "@/components/ui/EnhanceButton";
import { useSongFlow } from "@/components/providers/SongFlowProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";
import { GENRES, MOODS, VOCALS, SONG_IDEAS, ENHANCE_SAMPLES } from "@/lib/mv/mock";
import { COST_SONG, DESCRIPTION_MAX, isSongReady, type SongMode } from "@/lib/mv/types";

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px]" style={{ color: "var(--text-2)" }}>{label}</span>
      <button role="switch" aria-checked={on} aria-label={label} onClick={onToggle} className="relative h-5 w-9 rounded-full" style={{ background: on ? "var(--accent)" : "var(--card-3)" }}>
        <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all" style={{ left: on ? 18 : 2 }} />
      </button>
    </div>
  );
}

function Chips({ options, value, onPick, clearable }: { options: string[]; value: string | null; onPick: (v: string) => void; clearable?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const sel = value === o;
        return (
          <button key={o} onClick={() => onPick(clearable && sel ? "" : o)} className="rounded-full px-3 py-1.5 text-[12px] font-semibold" style={{ background: sel ? "var(--accent)" : "var(--card-2)", color: sel ? "#fff" : "var(--text-2)" }}>{o}</button>
        );
      })}
    </div>
  );
}

export function SongCompose() {
  const router = useRouter();
  const { songCompose: s, patchSongCompose: patch, resetForNewSong } = useSongFlow();
  const { credits } = useCredits();
  const ready = isSongReady(s);
  const [langOpen, setLangOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);

  function generate() {
    // GL-01: insufficient balance routes to IAP instead of starting generation.
    if (credits < COST_SONG) { setBuyOpen(true); return; }
    resetForNewSong();
    router.push("/song/creating");
  }

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[26px] font-extrabold tracking-tight">AI Song</h1>
        <CreditPill credits={credits} />
      </div>

      {/* mode tabs */}
      <div className="mb-5 flex gap-2">
        {(["simple", "custom"] as SongMode[]).map((m) => (
          <button key={m} onClick={() => patch({ mode: m })} className="rounded-full px-3.5 py-1.5 text-[13px] font-semibold capitalize" style={{ background: s.mode === m ? "var(--accent)" : "var(--card-2)", color: s.mode === m ? "#fff" : "var(--text-2)" }}>{m}</button>
        ))}
      </div>

      {s.mode === "simple" ? (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-bold uppercase tracking-[0.06em]">Describe your song</span>
            <Toggle on={s.instrumental} onToggle={() => patch({ instrumental: !s.instrumental })} label="Instrumental" />
          </div>
          <div className="rounded-xl border" style={{ background: "var(--card)", borderColor: "var(--border-2)" }}>
            <textarea value={s.describe} maxLength={DESCRIPTION_MAX} onChange={(e) => patch({ describe: e.target.value })} placeholder="e.g. A bittersweet love song about leaving a city you called home, melancholic yet hopeful…" className="min-h-[120px] w-full resize-none bg-transparent p-3 text-[14px] outline-none no-scrollbar" style={{ color: "var(--text)", lineHeight: 1.6 }} />
            <div className="flex items-center justify-between px-3 pb-2.5">
              <div className="flex items-center gap-2">
                <button onClick={() => patch({ describe: SONG_IDEAS[Math.floor(Math.random() * SONG_IDEAS.length)] })} className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>Ideas</button>
                <EnhanceButton value={s.describe} kind="song" onEnhanced={(t) => patch({ describe: t })} />
              </div>
              <span className="text-[12px]" style={{ color: "var(--text-2)" }}>{s.describe.length}/{DESCRIPTION_MAX}</span>
            </div>
          </div>
        </section>
      ) : (
        <div className="flex flex-col gap-6">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-bold uppercase tracking-[0.06em]">Lyrics / Idea</span>
                <div className="relative">
                  <button
                    type="button"
                    aria-label="Supported languages"
                    onClick={() => setLangOpen((o) => !o)}
                    onBlur={() => setTimeout(() => setLangOpen(false), 150)}
                    className="grid h-4 w-4 place-items-center rounded-full"
                    style={{ color: "var(--text-3)" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                  </button>
                  {langOpen && (
                    <div className="absolute left-0 top-6 z-30 w-60 rounded-xl border p-3 shadow-xl" style={{ background: "var(--card-3)", borderColor: "var(--border-2)" }}>
                      <div className="mb-1 text-[11px] font-bold">Supported Languages</div>
                      <div className="text-[11px] leading-relaxed" style={{ color: "var(--text-3)" }}>English, Japanese, German, Portuguese, Italian, French, Spanish, Turkish, Chinese, Korean, and Hindi</div>
                    </div>
                  )}
                </div>
              </div>
              <Toggle on={s.instrumental} onToggle={() => patch({ instrumental: !s.instrumental })} label="Instrumental" />
            </div>
            {s.instrumental ? (
              <div className="rounded-xl border p-3 text-[13px]" style={{ background: "var(--card)", borderColor: "var(--border-2)", color: "var(--text-2)" }}>No lyrics needed — your song will be a pure instrumental track.</div>
            ) : (
              <div className="rounded-xl border" style={{ background: "var(--card)", borderColor: "var(--border-2)" }}>
                <textarea value={s.lyrics} maxLength={DESCRIPTION_MAX} onChange={(e) => patch({ lyrics: e.target.value })} placeholder="Write your lyrics or song idea here…" className="min-h-[110px] w-full resize-none bg-transparent p-3 text-[14px] outline-none no-scrollbar" style={{ color: "var(--text)", lineHeight: 1.6 }} />
                <div className="flex items-center justify-between gap-2 px-3 pb-2.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => patch({ lyrics: SONG_IDEAS[Math.floor(Math.random() * SONG_IDEAS.length)] })} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0 0 12 3z" /></svg>
                      Idea
                    </button>
                    <button onClick={() => patch({ lyrics: ENHANCE_SAMPLES.lyrics[Math.floor(Math.random() * ENHANCE_SAMPLES.lyrics.length)] })} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v3" /></svg>
                      Lyrics
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <EnhanceButton
                      value={s.lyrics}
                      kind="lyrics"
                      onEnhanced={(t) => patch({ lyrics: t })}
                      directions={[
                        { kind: "song", label: "Refine Idea", sub: "Sharpen the mood, tone, and detail" },
                        { kind: "lyrics", label: "Refine Lyrics", sub: "Polish wording, rhythm, and flow" },
                      ]}
                    />
                    <span className="text-[12px]" style={{ color: "var(--text-2)" }}>{s.lyrics.length}/{DESCRIPTION_MAX}</span>
                    {s.lyrics && (
                      <button aria-label="Clear lyrics" onClick={() => patch({ lyrics: "" })} className="grid h-5 w-5 place-items-center rounded-full" style={{ background: "var(--card-3)", color: "var(--text-2)" }}>
                        <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M1 1l12 12M13 1L1 13" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 text-[12px] font-bold uppercase tracking-[0.06em]">Style</div>
            <div className="flex flex-col gap-5">
              <div>
                <div className="mb-2 text-[12px] font-semibold" style={{ color: "var(--text-2)" }}>Genre</div>
                <Chips options={GENRES} value={s.genre} onPick={(v) => patch({ genre: v })} />
              </div>
              <div>
                <div className="mb-2 text-[12px] font-semibold" style={{ color: "var(--text-2)" }}>Mood</div>
                <Chips options={MOODS} value={s.mood} onPick={(v) => patch({ mood: v })} />
              </div>
              <div>
                <div className="mb-2 text-[12px] font-semibold" style={{ color: "var(--text-2)" }}>Vocal <span className="font-medium" style={{ color: "var(--text-3)" }}>(optional)</span></div>
                <Chips options={VOCALS} value={s.vocal} onPick={(v) => patch({ vocal: v || null })} clearable />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.06em]">Song Title <span className="font-medium normal-case" style={{ color: "var(--text-3)" }}>(optional)</span></div>
            <input value={s.title} onChange={(e) => patch({ title: e.target.value })} placeholder="e.g. Midnight Drive, Golden Hour…" className="w-full rounded-xl border bg-transparent p-3 text-[14px] outline-none" style={{ background: "var(--card)", borderColor: "var(--border-2)", color: "var(--text)" }} />
            <p className="mt-2 text-[11px] leading-relaxed" style={{ color: "var(--text-3)" }}>Leave blank — AI will suggest a title based on your lyrics and style.</p>
          </section>
        </div>
      )}

      <div className="sticky bottom-[66px] mt-8 -mx-4 border-t px-4 py-3 sm:bottom-0 sm:-mx-6 sm:px-6" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
        <Button className="w-full" disabled={!ready} onClick={generate}>
          Generate Song
          <span className="ml-1 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[14px] font-bold" style={{ background: "rgba(255,255,255,.18)" }}>{COST_SONG}</span>
        </Button>
        {!ready && <p className="mt-2 text-center text-[12px]" style={{ color: "var(--text-2)" }}>Describe your song to continue.</p>}
      </div>

      <BuyCreditsModal open={buyOpen} onClose={() => setBuyOpen(false)} />
    </div>
  );
}
