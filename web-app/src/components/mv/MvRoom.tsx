"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { EnhanceButton } from "@/components/ui/EnhanceButton";
import { TrendingMvsPanel } from "@/components/community/TrendingMvsPanel";
import { ChooseSongModal } from "./ChooseSongModal";
import { TrimAudioModal } from "./TrimAudioModal";
import { FacePickerModal } from "./FacePickerModal";
import { SettingsModal } from "./SettingsModal";
import { ModeModal } from "./ModeModal";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { useAudioPlayer } from "@/components/audio/useAudioPlayer";
import { MV_TYPES, SAMPLE_FACES, TEMPLATES, IDEAS, formatDuration } from "@/lib/mv/mock";
import {
  COST_RENDER,
  COST_STORYBOARD,
  DESCRIPTION_MAX,
  effectiveDurationSec,
  isComposeReady,
  type CharacterPhoto,
  type MvMode,
  type MvType,
  type Song,
} from "@/lib/mv/types";

export function MvRoom() {
  const router = useRouter();
  const { compose, setCompose, patchCompose, resetForNewMv } = useMvFlow();
  const { credits } = useCredits();
  const [songOpen, setSongOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) { setToast(msg); window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600); }
  const [pendingSong, setPendingSong] = useState<Song | null>(null);
  const [trimOpen, setTrimOpen] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [faceOpen, setFaceOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);

  const ready = isComposeReady(compose);

  const songPlayer = useAudioPlayer({
    src: compose.song?.url,
    range: compose.song?.trim ?? null,
  });

  function pickSong(song: Song) {
    songPlayer.pause();
    setPendingSong(song);
    setTrimOpen(true);
  }
  /** Re-open the trim dialog for the already-chosen song, seeded with its trim. */
  function editTrim() {
    if (!compose.song) return;
    songPlayer.pause();
    setPendingSong(compose.song);
    setTrimOpen(true);
  }
  function addPhotoFromFile(file: File) {
    setPendingPhoto(URL.createObjectURL(file));
    setFaceOpen(true);
  }
  /** Import a local audio file → derive duration from metadata → open the trim dialog. */
  function importAudio(file: File) {
    // MV-02: accept only MP3 / AAC / WAV / M4A up to 50MB; reject anything else.
    const name = file.name.toLowerCase();
    const okExt = [".mp3", ".aac", ".wav", ".m4a"].some((ext) => name.endsWith(ext));
    const okType = /audio\/(mpeg|mp3|aac|wav|x-wav|wave|mp4|x-m4a)/.test(file.type);
    if (!okExt && !okType) { showToast("Unsupported format. Use MP3, AAC, WAV, or M4A."); return; }
    if (file.size > 50 * 1024 * 1024) { showToast("File too large. Maximum size is 50MB."); return; }
    const url = URL.createObjectURL(file);
    const title = file.name.replace(/\.[^/.]+$/, "").trim() || "Imported audio";
    const open = (durationSec: number) =>
      pickSong({ id: crypto.randomUUID(), source: "import", title, durationSec, art: "/assets/images/album-art/album_01.jpg", url });
    const probe = new Audio();
    probe.preload = "metadata";
    probe.src = url;
    probe.addEventListener("loadedmetadata", () => open(Number.isFinite(probe.duration) ? Math.round(probe.duration) : 0), { once: true });
    probe.addEventListener("error", () => open(0), { once: true });
  }
  function addCroppedPhoto(url: string) {
    const photo: CharacterPhoto = { id: crypto.randomUUID(), url };
    setCompose((c) => ({ ...c, photos: [...c.photos, photo].slice(0, 2) }));
  }
  function addSampleFace(url: string) {
    const photo: CharacterPhoto = { id: crypto.randomUUID(), url, fromSample: true };
    setCompose((c) => ({ ...c, photos: [...c.photos, photo].slice(0, 2) }));
  }
  function selectMode(mode: MvMode) {
    // GL-01: block generation when the balance can't cover the mode's cost and
    // route to IAP (buy credits) instead of starting a job that would go negative.
    const cost = mode === "storyboard_first" ? COST_STORYBOARD : COST_RENDER;
    setModeOpen(false);
    if (credits < cost) { setBuyOpen(true); return; }
    resetForNewMv(); // discard any storyboard/result from a previous MV before starting fresh
    router.push(mode === "storyboard_first" ? "/mv/thinking" : "/mv/creating");
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 pt-6 pb-28 sm:px-6 sm:pb-8">
      <h1 className="mb-5 text-[26px] font-extrabold tracking-tight">AI Music Video</h1>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-7">
          <section>
            <SectionLabel>Select MV Type</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {MV_TYPES.map((t) => {
                const active = compose.mvType === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => patchCompose({ mvType: t.id as MvType })}
                    className="hover-lift relative aspect-[3/4] overflow-hidden rounded-xl"
                    style={{ border: `2px solid ${active ? "var(--accent)" : "transparent"}`, background: "#1a1a1a" }}
                    aria-pressed={active}
                  >
                    <video src={t.video} muted loop playsInline autoPlay className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.85))" }} />
                    <span className="absolute bottom-2 left-0 right-0 text-center text-[12px] font-bold text-white">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <SectionLabel required>Choose a Song</SectionLabel>
            {!compose.song ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSongOpen(true)}
                  className="flex h-[68px] w-full items-center justify-center gap-2 rounded-xl border text-[14px] font-semibold"
                  style={{ background: "var(--card)", borderColor: "var(--border-2)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /></svg>
                  Song Library
                </button>
                <button
                  onClick={() => audioFileRef.current?.click()}
                  className="flex h-[68px] w-full items-center justify-center gap-2 rounded-xl border text-[14px] font-semibold"
                  style={{ background: "var(--card)", borderColor: "var(--border-2)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 15V3m0 0L8 7m4-4 4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></svg>
                  Import audio
                </button>
                <input
                  ref={audioFileRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) importAudio(f); e.target.value = ""; }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--card-2)" }}>
                <button
                  onClick={songPlayer.toggle}
                  disabled={!compose.song.url}
                  aria-label={songPlayer.playing ? "Pause song" : "Play song"}
                  className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={compose.song.art} alt="" className="h-full w-full object-cover" />
                  {compose.song.url && (
                    <span
                      className="absolute inset-0 grid place-items-center text-white transition-all group-hover:brightness-110"
                      style={{ background: "rgba(0,0,0,.35)" }}
                    >
                      {songPlayer.playing ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20" /></svg>
                      )}
                    </span>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold">{compose.song.title}</div>
                  <div className="text-[12px]" style={{ color: "var(--text-2)" }}>
                    {formatDuration(effectiveDurationSec(compose.song))}
                    {compose.song.trim && (
                      <span> · {formatDuration(compose.song.trim.start)}–{formatDuration(compose.song.trim.end)}</span>
                    )}
                  </div>
                </div>
                <button onClick={editTrim} className="text-[13px] font-semibold" style={{ color: "var(--accent)" }}>Edit</button>
                <button onClick={() => { songPlayer.pause(); setSongOpen(true); }} className="text-[13px] font-semibold" style={{ color: "var(--accent)" }}>Change</button>
                <button aria-label="Remove song" onClick={() => { songPlayer.pause(); patchCompose({ song: null }); }} className="grid h-7 w-7 place-items-center rounded-full" style={{ background: "var(--card-3)" }}>×</button>
              </div>
            )}
          </section>

          <section>
            <SectionLabel required>Describe Your Video Idea</SectionLabel>
            <div className="rounded-xl border" style={{ background: "var(--card)", borderColor: "var(--border-2)" }}>
              <textarea
                value={compose.description}
                maxLength={DESCRIPTION_MAX}
                onChange={(e) => patchCompose({ description: e.target.value })}
                placeholder="Describe your video to help AI create a more compelling story."
                className="min-h-[104px] w-full resize-none bg-transparent p-3 text-[14px] outline-none no-scrollbar"
                style={{ color: "var(--text)", lineHeight: 1.55 }}
              />
              <div className="flex items-center justify-between px-3 pb-2.5">
                <div className="flex items-center gap-2">
                  <button onClick={() => setTemplatesOpen(true)} className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>Templates</button>
                  <button onClick={() => patchCompose({ description: IDEAS[Math.floor(Math.random() * IDEAS.length)] })} className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>Ideas</button>
                  <EnhanceButton value={compose.description} kind="mv" onEnhanced={(t) => patchCompose({ description: t })} />
                </div>
                <span className="text-[12px]" style={{ color: "var(--text-2)" }}>{compose.description.length}/{DESCRIPTION_MAX}</span>
              </div>
            </div>
          </section>

          <section>
            <SectionLabel>Upload Character Photo</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {[0, 1].map((i) => {
                const photo = compose.photos[i];
                return photo ? (
                  <div key={i} className="relative h-[150px] overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={`Character ${i + 1}`} className="h-full w-full object-cover" />
                    <button
                      aria-label="Remove photo"
                      onClick={() => setCompose((c) => ({ ...c, photos: c.photos.filter((p) => p.id !== photo.id) }))}
                      className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-white"
                      style={{ background: "rgba(0,0,0,.5)" }}
                    >×</button>
                  </div>
                ) : (
                  <button
                    key={i}
                    onClick={() => fileRef.current?.click()}
                    className="flex h-[150px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-[12px] font-semibold"
                    style={{ background: "var(--card)", borderColor: "var(--border-2)", color: i === 0 ? "var(--text)" : "var(--text-2)" }}
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full text-white" style={{ background: i === 0 ? "var(--accent)" : "var(--card-3)" }}>+</span>
                    {i === 0 ? "Add photo with single face" : "2nd face (optional)"}
                  </button>
                );
              })}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) addPhotoFromFile(f);
                e.target.value = "";
              }}
            />
            <div className="mb-2 mt-3 text-[12px]" style={{ color: "var(--text-2)" }}>Sample Photos</div>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {SAMPLE_FACES.map((src) => (
                <button key={src} onClick={() => addSampleFace(src)} className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="Sample face" className="h-11 w-11 rounded-full object-cover" />
                </button>
              ))}
            </div>
          </section>

          <section>
            <SectionLabel>Settings</SectionLabel>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex w-full items-center gap-2 rounded-xl border p-3"
              style={{ background: "var(--card)", borderColor: "var(--border-2)" }}
            >
              <div className="flex flex-1 flex-wrap gap-2">
                {[compose.settings.ratio, compose.settings.resolution, compose.settings.title.on && "Title", compose.settings.author.on && "Author", compose.settings.showSubtitle && "Subtitle", compose.settings.watermark && "Watermark"]
                  .filter(Boolean)
                  .map((tag) => (
                    <span key={String(tag)} className="rounded-md px-2.5 py-1 text-[12px] font-semibold" style={{ background: "var(--card-3)" }}>{tag}</span>
                  ))}
              </div>
              <span style={{ color: "var(--text-2)" }}>›</span>
            </button>
          </section>
        </div>

        <aside className="order-last lg:order-none lg:sticky lg:top-20 lg:self-start">
          <TrendingMvsPanel />
        </aside>
      </div>

      <div className="sticky bottom-[66px] sm:bottom-0 mt-8 -mx-4 border-t px-4 py-3 sm:-mx-6 sm:px-6" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
        <Button className="w-full" disabled={!ready} onClick={() => setModeOpen(true)}>
          Create Music Video
        </Button>
        {!ready && (
          <p className="mt-2 text-center text-[12px]" style={{ color: "var(--text-2)" }}>
            Add a song and a description to continue.
          </p>
        )}
      </div>

      <ChooseSongModal open={songOpen} onClose={() => setSongOpen(false)} onPick={pickSong} />
      <TrimAudioModal open={trimOpen} song={pendingSong} onClose={() => setTrimOpen(false)} onConfirm={(s) => { patchCompose({ song: s }); setTrimOpen(false); }} />
      <FacePickerModal open={faceOpen} imageUrl={pendingPhoto} onClose={() => setFaceOpen(false)} onConfirm={addCroppedPhoto} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} settings={compose.settings} onChange={(settings) => patchCompose({ settings })} />
      <ModeModal open={modeOpen} onClose={() => setModeOpen(false)} onSelect={selectMode} />
      <BuyCreditsModal open={buyOpen} onClose={() => setBuyOpen(false)} />
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full px-4 py-2 text-[13px] font-semibold text-white shadow-lg" style={{ background: "rgba(20,20,24,.95)" }}>
          {toast}
        </div>
      )}
      <Modal open={templatesOpen} onClose={() => setTemplatesOpen(false)} title="Select a Template" maxWidth={560}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                patchCompose({ description: t.prompt });
                setTemplatesOpen(false);
              }}
              className="overflow-hidden rounded-xl text-left"
              style={{ background: "var(--card-2)" }}
            >
              <div className="relative aspect-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.cover} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="p-2 text-[12px] font-semibold">{t.name}</div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
