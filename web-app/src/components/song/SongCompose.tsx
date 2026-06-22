"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CreditPill } from "@/components/ui/CreditPill";
import { useMvFlow } from "@/components/mv/MvFlowProvider";
import { GENRES, MOODS, VOCALS, SONG_IDEAS } from "@/lib/mv/mock";
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
  const { songCompose: s, patchSongCompose: patch } = useMvFlow();
  const ready = isSongReady(s);

  return (
    <div className="mx-auto max-w-[640px] px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[26px] font-extrabold tracking-tight">AI Song</h1>
        <CreditPill credits={390} />
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
              <button onClick={() => patch({ describe: SONG_IDEAS[Math.floor(Math.random() * SONG_IDEAS.length)] })} className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>Ideas</button>
              <span className="text-[12px]" style={{ color: "var(--text-2)" }}>{s.describe.length}/{DESCRIPTION_MAX}</span>
            </div>
          </div>
        </section>
      ) : (
        <div className="flex flex-col gap-6">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-[0.06em]">Lyrics</span>
              <Toggle on={s.instrumental} onToggle={() => patch({ instrumental: !s.instrumental })} label="Instrumental" />
            </div>
            {s.instrumental ? (
              <div className="rounded-xl border p-3 text-[13px]" style={{ background: "var(--card)", borderColor: "var(--border-2)", color: "var(--text-2)" }}>No lyrics needed — your song will be a pure instrumental track.</div>
            ) : (
              <textarea value={s.lyrics} maxLength={DESCRIPTION_MAX} onChange={(e) => patch({ lyrics: e.target.value })} placeholder="Write your lyrics here… or leave blank and AI will generate them." className="min-h-[120px] w-full resize-none rounded-xl border bg-transparent p-3 text-[14px] outline-none no-scrollbar" style={{ background: "var(--card)", borderColor: "var(--border-2)", color: "var(--text)", lineHeight: 1.6 }} />
            )}
          </section>
          <section>
            <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.06em]">Genre</div>
            <Chips options={GENRES} value={s.genre} onPick={(v) => patch({ genre: v })} />
          </section>
          <section>
            <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.06em]">Mood</div>
            <Chips options={MOODS} value={s.mood} onPick={(v) => patch({ mood: v })} />
          </section>
          <section>
            <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.06em]">Vocal <span className="font-medium normal-case" style={{ color: "var(--text-3)" }}>(optional)</span></div>
            <Chips options={VOCALS} value={s.vocal} onPick={(v) => patch({ vocal: v || null })} clearable />
          </section>
          <section>
            <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.06em]">Song Title <span className="font-medium normal-case" style={{ color: "var(--text-3)" }}>(optional)</span></div>
            <input value={s.title} onChange={(e) => patch({ title: e.target.value })} placeholder="e.g. Midnight Drive, Golden Hour…" className="w-full rounded-xl border bg-transparent p-3 text-[14px] outline-none" style={{ background: "var(--card)", borderColor: "var(--border-2)", color: "var(--text)" }} />
          </section>
        </div>
      )}

      <div className="sticky bottom-[66px] mt-8 -mx-4 border-t px-4 py-3 sm:bottom-0 sm:-mx-6 sm:px-6" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
        <Button className="w-full" disabled={!ready} onClick={() => router.push("/song/creating")}>
          Generate Song
          <span className="ml-1 inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[14px] font-bold" style={{ background: "rgba(255,255,255,.18)" }}>{COST_SONG}</span>
        </Button>
        {!ready && <p className="mt-2 text-center text-[12px]" style={{ color: "var(--text-2)" }}>Describe your song to continue.</p>}
      </div>
    </div>
  );
}
