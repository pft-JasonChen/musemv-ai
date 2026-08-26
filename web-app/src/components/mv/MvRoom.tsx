"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DpIcon } from "@/components/ui/DpIcon";
import { FloatingCTA } from "@/components/ui/FloatingCTA";
import { ListItem } from "@/components/ui/ListItem";
import { RoomNavbar } from "@/components/shell/RoomNavbar";
import { ChooseSongModal } from "./ChooseSongModal";
import { TrimAudioModal } from "./TrimAudioModal";
import { FacePickerModal } from "./FacePickerModal";
import { FaceConsentDialog } from "./FaceConsentDialog";
import { SettingsModal } from "./SettingsModal";
import { ModeModal } from "./ModeModal";
import { TemplateSheet } from "./TemplateSheet";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useHistory } from "@/components/providers/HistoryProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { creationHref, useOpenCreation } from "@/components/history/useOpenCreation";
import { MOCK_USER } from "@/lib/user";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { useAudioPlayer } from "@/components/audio/useAudioPlayer";
import { MV_TYPES, SAMPLE_FACES, TEMPLATES, formatDuration, type TemplateOption } from "@/lib/mv/mock";
import { NEW_MVS } from "@/lib/mv/community";
import { grantFaceConsent, hasFaceConsent } from "@/lib/mv/faceConsent";
import {
  createMvCost,
  resolutionOf,
  scriptCost,
  DESCRIPTION_MAX,
  effectiveDurationSec,
  isComposeReady,
  type CharacterPhoto,
  type MvMode,
  type MvType,
  type Song,
} from "@/lib/mv/types";

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3g) ────────────────────
 *
 * DP source: `MVCreatePage` — the largest screen in the drop (1,441 lines of
 * TSX over 2,354 lines of CSS). Classes from
 * `src/styles/designer/MVCreatePage.css`, verbatim, plus FloatingCTA/ListItem.
 *
 * ── SCOPE: 3g WAS THE PAGE BODY; 3g-2 ADDED THE OVERLAYS ────────────────────
 *
 * The plan recommended splitting this screen. 3g migrated everything inside
 * `.mv-create`; 3g-2 migrated the overlays it opens — Choose Song, Trim Audio,
 * Face Picker, Settings, Mode, and the Templates sheet 3g had left as an inline
 * Tailwind `Modal` here. They share `MvSheet`, which carries DP's `.mv-sheet`
 * shell; the face picker has its own DP block and does not use it. Each sheet's
 * own header records what DP does not have and what could not be ported.
 *
 * ── WHAT DP DOES NOT HAVE, AND MUST NOT BE LOST HERE ────────────────────────
 *
 * This screen is where most of G5-d's behaviour regression list lives. DP has
 * none of it — its create button opens a sheet and nothing is ever charged:
 *
 * · S2's 30-second trim floor (`MIN_TRIM_SEC`, enforced in `TrimAudioModal`).
 *   DP's `TrimAudioSheet` has only `TRIM_MIN_GAP = 0.08` — a fraction of the
 *   track, not an absolute duration, so on a 60s track it permits a 4.8s clip.
 * · GL-01 credit gating: below cost, route to IAP instead of starting a job.
 * · `resetForNewMv()` before a new generation, so a previous storyboard or
 *   result cannot leak into the next one.
 * · MV-02 import validation (format allow-list + 50MB ceiling).
 * · (Two controls that WERE on this box are gone, and BOTH are deviations FROM
 *   DP, so a future drop will reintroduce them and both removals have to be
 *   re-applied: `Ideas` since 2026-08-06 — V1 ships no canned-sample fillers —
 *   and `Enhance` since 2026-08-25, because the engine has no refine mode for
 *   an MV description, so the button promised what the backend cannot do.)
 *
 * ── AND ONE THING DP HAS THAT WA DID NOT ────────────────────────────────────
 *
 * Per-photo NAMES — an editable label on each filled photo slot. Ported, and
 * held the way DP holds it: as PAGE-LOCAL state (`photoNames`), not as a field
 * on the photo.
 *
 * That is not a shortcut, it is the only correct place for it here.
 * `CharacterPhoto` is `CharacterPhotoSchema` in `src/lib/api/schemas.ts`, which
 * is contract surface C2 and frozen by G4 — adding a field there is an
 * RD-facing wire change requiring a declared contract update and a
 * CHANGELOG-RD entry, for something no request or response currently carries.
 * DP keeps it local for its own reasons and the two happen to agree.
 */
export function MvRoom() {
  const router = useRouter();
  const { compose, setCompose, patchCompose, resetForNewMv } = useMvFlow();
  const { loggedIn, requireLogin } = useAuth();
  const { history } = useHistory();
  const openCreation = useOpenCreation();
  const { credits } = useCredits();
  const { locale } = useLocale();

  const myMvs = history.filter((h) => h.kind === "mv" && h.status === "completed");
  // Designer decision, 2026-08-07 (revised same day): back to items 4/5's
  // original `loggedIn && myMvs.length > 0` — a freshly signed-in guest with
  // zero finished MVs sees Trending, same as before signing in. The brief
  // `loggedIn` alone + empty-state attempt (matching DP's `isSignedIn`
  // exactly) was tried and reverted: seeing "My Creations" over a blank card
  // right after signing in read as broken, not empty.
  const showMine = loggedIn && myMvs.length > 0;
  const [songOpen, setSongOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  // Product owner request, 2026-08-13 (Figma node 1344:25723) — the
  // Templates button shows the applied template's own cover + name once
  // one's been picked, instead of always reading "Templates". Local to
  // this component: `TemplateSheet` only ever hands back the FULL template
  // (see its own onApply type), never persists a choice itself.
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption | null>(null);
  const [modeOpen, setModeOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<number | null>(null);
  /** Per-slot character names — page-local, exactly as DP holds them. */
  const [photoNames, setPhotoNames] = useState<string[]>(["", ""]);

  function showToast(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2600);
  }
  const [pendingSong, setPendingSong] = useState<Song | null>(null);
  const [trimOpen, setTrimOpen] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [faceOpen, setFaceOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);

  const ready = isComposeReady(compose);

  // Spec 11 §3.2/§3.3 — both prices depend on the song's TRIMMED length, so they
  // change when the user re-trims or swaps the track. Zero-length (no song yet)
  // is fine: the CTA that opens this dialog is disabled until a song is chosen.
  const mvSeconds = compose.song ? effectiveDurationSec(compose.song) : 0;
  const storyboardCost = scriptCost(mvSeconds);
  const directCost = createMvCost(compose.mvType, resolutionOf(compose.settings), mvSeconds);

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
  /**
   * The only way the character-photo picker opens. On the first upload of the
   * session the biometric consent notice comes first (`FaceConsentDialog`);
   * after that this is a straight passthrough to the hidden file input.
   */
  function openPhotoPicker() {
    if (!hasFaceConsent()) {
      setConsentOpen(true);
      return;
    }
    fileRef.current?.click();
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
    if (!okExt && !okType) {
      showToast("Unsupported format. Use MP3, AAC, WAV, or M4A.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      showToast("File too large. Maximum size is 50MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    const title = file.name.replace(/\.[^/.]+$/, "").trim() || "Imported audio";
    const open = (durationSec: number) =>
      pickSong({
        id: crypto.randomUUID(),
        source: "import",
        title,
        durationSec,
        art: "/assets/images/album-art/album_01.jpg",
        url,
      });
    const probe = new Audio();
    probe.preload = "metadata";
    probe.src = url;
    probe.addEventListener(
      "loadedmetadata",
      () => open(Number.isFinite(probe.duration) ? Math.round(probe.duration) : 0),
      { once: true },
    );
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
  function setPhotoName(index: number, name: string) {
    setPhotoNames((names) => names.map((n, i) => (i === index ? name : n)));
  }
  function selectMode(mode: MvMode) {
    // GL-01: block generation when the balance can't cover the mode's cost and
    // route to IAP (buy credits) instead of starting a job that would go negative.
    const cost = mode === "storyboard_first" ? storyboardCost : directCost;
    setModeOpen(false);
    if (credits < cost) {
      setBuyOpen(true);
      return;
    }
    resetForNewMv(); // discard any storyboard/result from a previous MV before starting fresh
    router.push(localePath(locale, mode === "storyboard_first" ? "/mv/thinking" : "/mv/creating"));
  }

  const settingsChips: [string, boolean][] = [
    [compose.settings.ratio, true],
    [compose.settings.resolution, true],
    ["Title", compose.settings.title.on],
    ["Author", compose.settings.author.on],
    ["Subtitle", compose.settings.showSubtitle],
    ["Watermark", compose.settings.watermark],
  ];

  return (
    <>
      <RoomNavbar title="AI Music Video" mobileBackHref="/" />

      <div className="mv-create">
        <div className="mv-create__panel">
          <div className="mv-create__section">
            <p className="mv-create__label">SELECT MV TYPE</p>
            <div className="mv-create__styles">
              {MV_TYPES.map((t) => {
                const active = compose.mvType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`mv-create__style-card${active ? " mv-create__style-card--active" : ""}`}
                    onClick={() => patchCompose({ mvType: t.id as MvType })}
                    aria-pressed={active}
                  >
                    {/* DP plays these on hover only. WA autoplays, as it did
                        before the migration — three muted looping previews are
                        the point of the row, and a hover-only preview is
                        unreachable on a phone, which is most of the traffic. */}
                    <video
                      className="mv-create__style-video"
                      src={t.video}
                      muted
                      loop
                      playsInline
                      autoPlay
                      aria-hidden="true"
                    />
                    <div className="mv-create__style-scrim" aria-hidden="true" />
                    <p className="mv-create__style-name">{t.name}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mv-create__section">
            <p className="mv-create__label">
              CHOOSE A SONG <span className="mv-create__label-optional">(Required)</span>
            </p>

            {!compose.song ? (
              <div className="mv-create__song-options">
                <button
                  type="button"
                  className="mv-create__song-option"
                  // Designer decision, 2026-08-07: gate this like "Create Music
                  // Video" — "My Songs" is a signed-in user's real library, so a
                  // guest has to sign in before it means anything.
                  onClick={() => requireLogin(() => setSongOpen(true))}
                >
                  <img
                    src="/assets/icons/ui/ic_song_list.svg"
                    alt=""
                    className="mv-create__song-option-icon"
                  />
                  <span>Song Library</span>
                </button>
                <button
                  type="button"
                  className="mv-create__song-option"
                  onClick={() => audioFileRef.current?.click()}
                >
                  <img
                    src="/assets/icons/ui/ic_upload.svg"
                    alt=""
                    className="mv-create__song-option-icon"
                  />
                  <span>Import Audio</span>
                </button>
              </div>
            ) : (
              <div className="mv-create__song-added">
                <div className="mv-create__song-added-header">
                  <button
                    type="button"
                    className="mv-create__song-added-label"
                    onClick={() => {
                      songPlayer.pause();
                      requireLogin(() => setSongOpen(true));
                    }}
                  >
                    {compose.song.source === "import" ? "Imported Audio" : "Song Library"}
                  </button>
                  <button
                    type="button"
                    className="mv-create__song-clear"
                    onClick={() => {
                      songPlayer.pause();
                      patchCompose({ song: null });
                    }}
                    aria-label="Remove song"
                  >
                    <DpIcon name="ic_close" className="mv-create__song-clear-icon" />
                  </button>
                </div>
                <div className="mv-create__song-divider" />
                <div className="mv-create__song-row">
                  <button
                    type="button"
                    className="mv-create__song-art"
                    onClick={songPlayer.toggle}
                    disabled={!compose.song.url}
                    aria-label={songPlayer.playing ? "Pause song" : "Play song"}
                  >
                    {compose.song.art && <img src={compose.song.art} alt="" />}
                    <span className="mv-create__song-art-scrim" aria-hidden="true" />
                    <DpIcon
                      name={songPlayer.playing ? "ic_pause" : "ic_play"}
                      className="mv-create__song-art-icon"
                    />
                  </button>
                  <div className="mv-create__song-info">
                    <p className="mv-create__song-title">{compose.song.title}</p>
                    <p className="mv-create__song-duration">
                      {formatDuration(effectiveDurationSec(compose.song))}
                      {compose.song.trim && (
                        <span>
                          {" "}
                          · {formatDuration(compose.song.trim.start)}–
                          {formatDuration(compose.song.trim.end)}
                        </span>
                      )}
                    </p>
                  </div>
                  {/* DP has one Change control here. WA has TWO distinct
                      actions — Edit re-opens the trim on the SAME song, Change
                      picks a different one — and the trim editor is the only
                      way to reach S2's 30s floor after the fact. Collapsing
                      them into DP's single button would silently delete the
                      trim entry point, so both stay. */}
                  <button
                    type="button"
                    className="mv-create__song-edit"
                    onClick={editTrim}
                    aria-label="Edit trim"
                  >
                    <DpIcon name="ic_edit" className="mv-create__song-edit-icon" />
                  </button>
                </div>
              </div>
            )}
            <input
              ref={audioFileRef}
              type="file"
              accept="audio/*"
              className="mv-create__file-input"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importAudio(f);
                e.target.value = "";
              }}
            />
          </div>

          <div className="mv-create__section">
            <p className="mv-create__label">
              DESCRIBE YOUR VIDEO IDEA <span className="mv-create__label-optional">(Required)</span>
            </p>
            <div className="mv-create__input-box">
              <textarea
                className="mv-create__textarea"
                placeholder="Describe your video to help AI create a more compelling story."
                maxLength={DESCRIPTION_MAX}
                value={compose.description}
                onChange={(e) => patchCompose({ description: e.target.value })}
              />
              <div className="mv-create__input-footer">
                <div className="mv-create__input-actions">
                  {/* Product owner request, 2026-08-13 (Figma node 1762:38446
                      unselected / 1344:25723 selected) — circular thumbnail(s)
                      replace the old `ic_video` icon. Unselected: a stack of
                      3 (the first 3 catalog entries, standing in for "these
                      are templates" the same way Figma's own mockup uses 3
                      generic covers — not a specific selection). Selected:
                      just the applied template's own cover + its name. */}
                  <button
                    type="button"
                    className="mv-create__idea-btn"
                    onClick={() => setTemplatesOpen(true)}
                  >
                    <span className="mv-create__idea-thumbs">
                      {selectedTemplate ? (
                        <img src={selectedTemplate.cover} alt="" className="mv-create__idea-thumb" />
                      ) : (
                        TEMPLATES.slice(0, 3).map((t) => (
                          <img key={t.id} src={t.cover} alt="" className="mv-create__idea-thumb" />
                        ))
                      )}
                    </span>
                    {selectedTemplate ? selectedTemplate.name : "Templates"}
                  </button>
                  {/* The "Ideas" button was REMOVED 2026-08-06 — V1 ships no
                      canned-sample fillers (product owner). Note this is a
                      deliberate deviation FROM DP, not a fidelity fix: DP has
                      `.mv-create__idea-btn` on this box too
                      (`MVCreatePage.tsx:1182`), so the next drop will bring it
                      back and the removal has to be re-applied. Templates
                      stays — it opens `TemplateSheet`, a real feature, not a
                      mock-data filler. */}
                </div>
                <div className="mv-create__footer-right">
                  {/* Enhance was REMOVED here 2026-08-25 (product owner): the
                      engine has no refine mode for an MV description, so the
                      control promised something the backend cannot do. This is
                      a deviation FROM DP the same way `Ideas` is — DP ships an
                      enhance affordance on this box, so a future drop will bring
                      it back and the removal has to be re-applied. `AC-MV-14`
                      was narrowed to the three fields that DO have one.
                      Enhance still exists on `/song/create`, `/mv/storyboard`
                      and `/mv/edit`. */}
                  <span className="mv-create__char-count">
                    {compose.description.length}/{DESCRIPTION_MAX}
                  </span>
                  {compose.description.length > 0 && (
                    <button
                      type="button"
                      className="mv-create__clear-btn"
                      onClick={() => patchCompose({ description: "" })}
                      aria-label="Clear"
                    >
                      <DpIcon name="ic_close" className="mv-create__clear-icon" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mv-create__section">
            <p className="mv-create__label">UPLOAD CHARACTER PHOTO</p>
            <div className="mv-create__photos">
              {[0, 1].map((slot) => {
                const photo = compose.photos[slot];
                return (
                  <div key={slot} className="mv-create__photo-slot">
                    {photo ? (
                      <div className="mv-create__photo-filled">
                        <img src={photo.url} alt="" className="mv-create__photo-preview" />
                        <div className="mv-create__photo-top">
                          <button
                            type="button"
                            className="mv-create__photo-circle-btn"
                            onClick={() =>
                              setCompose((c) => ({
                                ...c,
                                photos: c.photos.filter((p) => p.id !== photo.id),
                              }))
                            }
                            aria-label="Remove photo"
                          >
                            <DpIcon name="ic_close" className="mv-create__photo-circle-icon" />
                          </button>
                        </div>
                        <div className="mv-create__photo-bottom">
                          {editingName === slot ? (
                            <input
                              type="text"
                              className="mv-create__photo-name-input"
                              placeholder="Name"
                              value={photoNames[slot] ?? ""}
                              autoFocus
                              onChange={(e) => setPhotoName(slot, e.target.value)}
                              onBlur={() => setEditingName(null)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") setEditingName(null);
                              }}
                            />
                          ) : (
                            <p className="mv-create__photo-name">{photoNames[slot] || "Name"}</p>
                          )}
                          <button
                            type="button"
                            className="mv-create__photo-circle-btn"
                            onClick={() => setEditingName(slot)}
                            aria-label="Edit name"
                          >
                            <DpIcon name="ic_edit" className="mv-create__photo-circle-icon" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={`mv-create__photo-add mv-create__photo-add--${slot === 0 ? "primary" : "tertiary"}`}
                        onClick={openPhotoPicker}
                      >
                        <span className="mv-create__photo-add-circle">
                          <DpIcon name="ic_add" className="mv-create__photo-add-icon" />
                        </span>
                        <span className="mv-create__photo-add-text">
                          {slot === 0 ? "1st face photo" : "2nd face photo"}
                          <br />
                          <span className="mv-create__photo-add-optional">(Optional)</span>
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="mv-create__file-input"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) addPhotoFromFile(f);
                e.target.value = "";
              }}
            />
            <p className="mv-create__sample-label">Sample Photos</p>
            <div className="mv-create__samples">
              {SAMPLE_FACES.map((src) => (
                <button
                  key={src}
                  type="button"
                  className="mv-create__sample"
                  onClick={() => addSampleFace(src)}
                  aria-label="Use sample photo"
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          </div>

          <div className="mv-create__section">
            <p className="mv-create__label">SETTINGS</p>
            <button
              type="button"
              className="mv-create__settings"
              onClick={() => setSettingsOpen(true)}
              // Its visible content is just the current setting tags, which makes a poor
              // accessible name; the label also gives e2e a stable handle (G5-d #7).
              aria-label="Open MV settings"
            >
              <div className="mv-create__settings-chips">
                {settingsChips.map(([label, on]) => (
                  <span
                    key={label}
                    className={`mv-create__settings-chip${on ? "" : " mv-create__settings-chip--dim"}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <DpIcon name="ic_chevron-right" className="mv-create__settings-chevron" />
            </button>
          </div>

          {/* Product owner request, 2026-08-14 — match AI Song's two-state CTA
              (float only when the page needs scrolling to reach it, otherwise
              render as the panel's own last row). This was one of the three
              callers FloatingCTA's own header comment names as intentionally
              still always-floating; `adaptive` already does everything else,
              it just wasn't opted into here. */}
          <FloatingCTA alignToParent adaptive>
            <button
              type="button"
              className={`mv-create__cta${ready ? " mv-create__cta--active" : ""}`}
              disabled={!ready}
              // `/mv/room` itself has no `AuthGuard` (2026-08-07, designer
              // request) so "Start for Free" can land a guest here to
              // compose — but generating still costs credits, so the gate
              // moves to the one action that actually starts a job.
              onClick={() => requireLogin(() => setModeOpen(true))}
            >
              <span>Create Music Video</span>
              <DpIcon name="ic_arrow_right" className="mv-create__cta-icon" />
            </button>
          </FloatingCTA>
        </div>

        {/*
          ── THE SIDE RAIL HAS TWO MODES, AND THE DATA SWITCHES WITH THE TITLE ──

          DP: `{isSignedIn ? 'My Creations' : 'Trending MVs'}`, with "See all"
          rendered only in the signed-out branch.

          G7 finding 3g-3 was that WA had the title switching and the DATA not:
          it said "My Creations" over `NEW_MVS`, community fixtures with other
          creators' names. That was fixed by pinning the title to "Trending MVs",
          which was honest but lost DP's signed-in state entirely. This restores
          it properly — the title, the rows and the "See all" all switch
          together (product owner, 2026-08-06).

          **The condition is `loggedIn` AND "has actually made something".** DP
          can say `isSignedIn` alone because its `MY_CREATIONS` is a fixture that
          is never empty; WA's comes from the real (session-local) History, so a
          user who has just signed in has none. Falling back to Trending there
          beats a "My Creations" heading over nothing — tried the empty-state
          card instead (designer request, 2026-08-07) and reverted the same day:
          seeing it right after signing in read as broken, not empty.
        */}
        <div className="mv-create__side">
          <div className="mv-create__side-header">
            <p className="mv-create__side-title">{showMine ? "My Creations" : "Trending MVs"}</p>
            {!showMine && (
              <Link href={localePath(locale, "/explore/mvs")} className="mv-create__side-see-all">
                See all
                <DpIcon name="ic_chevron-right" className="mv-create__side-see-all-icon" />
              </Link>
            )}
          </div>
          <div className="mv-create__side-list">
            {showMine
              ? myMvs.slice(0, 7).map((mv) => (
                  <Link
                    key={mv.id}
                    href={localePath(locale, creationHref({ id: mv.id, kind: "mv" }))}
                    className="mv-create__side-item"
                    onClick={(e) => {
                      // Seed-then-navigate, exactly as /history does — the
                      // result screen guards on flow state. Consequence, and it
                      // is the same one /history's "Edit MV" has always had:
                      // this replaces the compose draft being edited above.
                      e.preventDefault();
                      openCreation({
                        id: mv.id,
                        kind: "mv",
                        title: mv.title,
                        thumb: mv.thumb,
                        resultUrl: mv.resultUrl,
                      });
                    }}
                  >
                    {/* Figma node 1762:38446 (2311:58208, "My Creations") —
                        same community-style row as Trending MVs below.
                        `HistoryItem` has no plays/likes/shares (see
                        HistoryProvider.tsx), so these are genuinely 0 for a
                        just-created, unpublished MV — not a fabricated
                        stand-in for real data. */}
                    <ListItem
                      variant="community"
                      title={mv.title}
                      coverImage={mv.thumb}
                      username={MOCK_USER.name}
                      plays={0}
                      likes={0}
                      shares={0}
                    />
                  </Link>
                ))
              : NEW_MVS.slice(0, 7).map((mv) => (
                  <Link
                    key={mv.id}
                    href={localePath(locale, `/watch?id=${mv.id}`)}
                    className="mv-create__side-item"
                  >
                    <ListItem
                      variant="community"
                      title={mv.title}
                      coverImage={mv.thumb}
                      username={mv.creator}
                      plays={mv.plays}
                      likes={mv.likes}
                      shares={mv.shares}
                    />
                  </Link>
                ))}
          </div>
        </div>
      </div>

      <ChooseSongModal open={songOpen} onClose={() => setSongOpen(false)} onPick={pickSong} />
      <TrimAudioModal
        open={trimOpen}
        song={pendingSong}
        onClose={() => setTrimOpen(false)}
        onConfirm={(s) => {
          patchCompose({ song: s });
          setTrimOpen(false);
        }}
      />
      <FaceConsentDialog
        open={consentOpen}
        onClose={() => setConsentOpen(false)}
        onContinue={() => {
          grantFaceConsent();
          setConsentOpen(false);
          // The picker is a trusted-activation API, so it has to be called
          // from inside this click's own task — not after a state flush.
          fileRef.current?.click();
        }}
      />
      <FacePickerModal
        open={faceOpen}
        imageUrl={pendingPhoto}
        onClose={() => setFaceOpen(false)}
        onConfirm={addCroppedPhoto}
      />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={compose.settings}
        onChange={(settings) => patchCompose({ settings })}
      />
      <ModeModal
        open={modeOpen}
        onClose={() => setModeOpen(false)}
        onSelect={selectMode}
        storyboardCost={storyboardCost}
        directCost={directCost}
      />
      <BuyCreditsModal open={buyOpen} onClose={() => setBuyOpen(false)} />
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full px-4 py-2 text-[13px] font-semibold text-white shadow-lg"
          style={{ background: "rgba(20,20,24,.95)" }}
        >
          {toast}
        </div>
      )}
      <TemplateSheet
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onApply={(template) => {
          patchCompose({ description: template.prompt });
          setSelectedTemplate(template);
          setTemplatesOpen(false);
        }}
      />
    </>
  );
}
