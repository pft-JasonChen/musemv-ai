"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { TrendingMvsPanel } from "@/components/community/TrendingMvsPanel";
import { ChooseSongModal } from "./ChooseSongModal";
import { TrimAudioModal } from "./TrimAudioModal";
import { FacePickerModal } from "./FacePickerModal";
import { SettingsModal } from "./SettingsModal";
import { ModeModal } from "./ModeModal";
import { useMvFlow } from "./MvFlowProvider";
import { MV_TYPES, SAMPLE_FACES, TEMPLATES, IDEAS, formatDuration } from "@/lib/mv/mock";
import {
  DESCRIPTION_MAX,
  isComposeReady,
  type CharacterPhoto,
  type MvMode,
  type MvType,
  type Song,
} from "@/lib/mv/types";

export function MvRoom() {
  const router = useRouter();
  const { compose, setCompose, patchCompose } = useMvFlow();
  const [songOpen, setSongOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [pendingSong, setPendingSong] = useState<Song | null>(null);
  const [trimOpen, setTrimOpen] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [faceOpen, setFaceOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const ready = isComposeReady(compose);

  function pickSong(song: Song) {
    setPendingSong(song);
    setTrimOpen(true);
  }
  function addPhotoFromFile(file: File) {
    setPendingPhoto(URL.createObjectURL(file));
    setFaceOpen(true);
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
    setModeOpen(false);
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
              <button
                onClick={() => setSongOpen(true)}
                className="flex h-[68px] w-full items-center justify-center gap-2 rounded-xl border text-[14px] font-semibold"
                style={{ background: "var(--card)", borderColor: "var(--border-2)" }}
              >
                + Add a song
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-xl p-3" style={{ background: "var(--card-2)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={compose.song.art} alt="" className="h-11 w-11 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold">{compose.song.title}</div>
                  <div className="text-[12px]" style={{ color: "var(--text-2)" }}>{formatDuration(compose.song.durationSec)}</div>
                </div>
                <button onClick={() => setSongOpen(true)} className="text-[13px] font-semibold" style={{ color: "var(--accent)" }}>Change</button>
                <button aria-label="Remove song" onClick={() => patchCompose({ song: null })} className="grid h-7 w-7 place-items-center rounded-full" style={{ background: "var(--card-3)" }}>×</button>
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
                <div className="flex gap-2">
                  <button onClick={() => setTemplatesOpen(true)} className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>Templates</button>
                  <button onClick={() => patchCompose({ description: IDEAS[Math.floor(Math.random() * IDEAS.length)] })} className="rounded-md px-2 py-1 text-[11px] font-semibold" style={{ background: "var(--card-2)", color: "var(--text-2)" }}>Ideas</button>
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
