"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToastTimer } from "@/components/ui/useToastTimer";
import { EnhanceButton } from "@/components/ui/EnhanceButton";
import { DpIcon } from "@/components/ui/DpIcon";
import { FloatingCTA } from "@/components/ui/FloatingCTA";
import { ListItem } from "@/components/ui/ListItem";
import { RoomNavbar } from "@/components/shell/RoomNavbar";
import { ChooseSongModal } from "./ChooseSongModal";
import { TrimAudioModal } from "./TrimAudioModal";
import { importAudioFile } from "./importAudio";
import { FacePickerModal } from "./FacePickerModal";
import { FaceConsentDialog } from "./FaceConsentDialog";
import { SettingsModal } from "./SettingsModal";
import { useEdgeFade } from "@/components/agent/useEdgeFade";
import { revealInRow } from "@/lib/revealInRow";
import { ModeModal } from "./ModeModal";
import { TemplateListSheet } from "./TemplateListSheet";
import { CharacterListSheet } from "./CharacterListSheet";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { creationHref, useOpenCreation } from "@/components/history/useOpenCreation";
import { useMyCreations } from "@/components/history/useMyCreations";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { useAudioPlayer } from "@/components/audio/useAudioPlayer";
import {
  MV_TYPES,
  SAMPLE_CHARACTERS,
  TEMPLATES,
  formatDuration,
  type TemplateOption,
} from "@/lib/mv/mock";
import { NEW_MVS } from "@/lib/mv/community";
import { grantFaceConsent, hasFaceConsent } from "@/lib/mv/faceConsent";
import {
  createMvCost,
  resolutionOf,
  scriptCost,
  DESCRIPTION_MAX,
  effectiveDurationSec,
  isComposeReady,
  MV_AUTHOR_MAX,
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
 * · `EnhanceButton`, which goes through `api.enhancePrompt` (G5-d #10). DP
 *   picks a random string from a local `ENHANCED_SUGGESTIONS` array. Was
 *   HIDDEN 2026-08-25 to 2026-08-27 (`3bdff87`) for having no supported
 *   backend API; RESTORED 2026-08-27 once RD confirmed one exists.
 * · (The Ideas button was here until 2026-08-06. It is GONE now — V1 ships no
 *   canned-sample fillers — and that is a deviation FROM DP, which has one.)
 *
 * ── AND ONE THING DP HAS THAT WA DID NOT ────────────────────────────────────
 *
 * Per-photo NAMES — an editable label on each filled photo slot. Ported, but
 * NOT held page-local the way DP holds it: `useMvFlow().characterNames`
 * (`MvFlowProvider.tsx`), because `/mv/result`'s Character row and the History
 * row both need it, and both are reached only after this page has unmounted
 * (`YMW260911P0007` — showing a name, not a count, requires the name to still
 * exist at that point).
 *
 * Still NOT a field on `CharacterPhoto` — `CharacterPhotoSchema` in
 * `src/lib/api/schemas.ts` is contract surface C2 and frozen by G4, and
 * adding a field there would be an RD-facing wire change requiring a declared
 * contract update, for something no request or response currently carries.
 * Lifting it to the provider (rather than the photo) keeps it out of C2 while
 * still surviving the navigation DP's page-local approach could not.
 */
export function MvRoom() {
  const router = useRouter();
  const { compose, setCompose, patchCompose, resetForNewMv, characterNames, setCharacterNames } =
    useMvFlow();
  const { loggedIn, profile, requireLogin } = useAuth();
  const openCreation = useOpenCreation();
  const { credits } = useCredits();
  const { locale } = useLocale();

  // Live session jobs MERGED WITH THE SAME SEEDED CREATIONS `/history` SHOWS
  // (YMW260902P0013, 2026-09-09) — see `useMyCreations` for why the rails
  // reading only the empty session provider was the bug. `loggedIn` is folded
  // into the hook.
  const myMvs = useMyCreations("mv");
  // Designer decision, 2026-08-07 (revised same day): keep items 4/5's
  // original `loggedIn && myMvs.length > 0` — a visitor with zero finished MVs
  // sees Trending, same as before signing in. The brief `loggedIn` alone +
  // empty-state attempt (matching DP's `isSignedIn` exactly) was tried and
  // reverted: seeing "My Creations" over a blank card read as broken, not
  // empty. The guard stays for the signed-OUT case; the signed-in branch is
  // simply no longer empty by default.
  const showMine = myMvs.length > 0;
  const [songOpen, setSongOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // The applied template is DERIVED from the description: a template is "on"
  // exactly while the box still holds its prompt. That is the rule Home's MV
  // input already uses to carry a template into this room, and it means picking,
  // un-picking and hand-editing all stay consistent without a second state.
  const selectedTemplate = TEMPLATES.find((t) => t.prompt === compose.description) ?? null;
  // Both thumbnail rows fade at whichever edge has more to scroll to (product owner,
  // 2026-11-27) — the same `.edge-fade` mask the Home Explore row uses.
  const tplFadeRef = useEdgeFade<HTMLDivElement>();
  const sampleFadeRef = useEdgeFade<HTMLDivElement>();
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [charsOpen, setCharsOpen] = useState(false);
  /** Apply a template, or unselect it when it is the one already applied. */
  function pickTemplate(t: TemplateOption) {
    const unselecting = selectedTemplate?.id === t.id;
    patchCompose({ description: unselecting ? "" : t.prompt });
    if (!unselecting) showTemplateArea();
  }
  // Applying a template scrolls the page so the template row, the Characters section
  // and the prompt box it just filled are all in view (product owner, 2026-11-27) —
  // only on a pick the user makes, never on mount (a template carried in from Home).
  const tplSectionRef = useRef<HTMLDivElement>(null);
  function showTemplateArea() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    tplSectionRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
  // However a template gets picked (the row, or the See all sheet), the row scrolls
  // so its tile is fully in view, clear of the faded edge (product owner, 2026-11-27).
  const selectedTemplateId = selectedTemplate?.id ?? null;
  useEffect(() => {
    if (!selectedTemplateId) return;
    const tile = tplFadeRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (tile) revealInRow(tile);
  }, [selectedTemplateId, tplFadeRef]);
  const [modeOpen, setModeOpen] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  const { toast, show: showToast, hold: toastHold } = useToastTimer(2600);
  const [editingName, setEditingName] = useState<number | null>(null);
  // Product owner, 2026-09-22: "Create MV Directly" gets a 3s preparing
  // transition (blurred glass + the app's one 3-dot loading animation)
  // before `/mv/creating`; "Create Storyboard First" does not — it goes
  // straight to `/mv/thinking` exactly as before. This is a same-screen
  // overlay, NOT a route-level `loading.tsx`/Suspense fallback — that path
  // is spec'd shut (`AC-MV-22`) after it broke e2e for every route in the
  // app (see `docs/BUGS-TO-FIX-2026-09-21.md`, YMW260911P0004).
  const [preparing, setPreparing] = useState(false);
  const preparingTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(preparingTimeoutRef.current);
  }, []);
  const [pendingSong, setPendingSong] = useState<Song | null>(null);
  const [trimOpen, setTrimOpen] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [faceOpen, setFaceOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  // Apply the signed-in profile name only once. A later edit—including an
  // intentionally empty value—belongs to the user and must not be overwritten
  // every time the Settings sheet opens.
  const authorDefaultApplied = useRef(false);

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
  // YMW260916P0001: no browser can decode TIFF (or most other non-web formats)
  // into an `<img>`, so an unsupported upload used to silently render as a
  // broken/blank photo. Same reject-with-toast shape `importAudio` already
  // uses below, message text set by the product owner (2026-09-17).
  function addPhotoFromFile(file: File) {
    const name = file.name.toLowerCase();
    const okExt = [".jpg", ".jpeg", ".png"].some((ext) => name.endsWith(ext));
    const okType = /image\/(jpeg|png)/.test(file.type);
    if (!okExt && !okType) {
      showToast("This image format isn't supported. Please use JPG or PNG.");
      return;
    }
    setPendingPhoto(URL.createObjectURL(file));
    setFaceOpen(true);
  }
  /** Import a local audio file → derive duration from metadata → open the trim
   *  dialog. The rules (MV-02 formats / size, S2's 30s floor) live in
   *  `importAudio.ts`, shared with Home's MV input since 2026-10-30. */
  function importAudio(file: File) {
    importAudioFile(file, pickSong, showToast);
  }
  function addCroppedPhoto(url: string) {
    const photo: CharacterPhoto = { id: crypto.randomUUID(), url };
    setCompose((c) => ({ ...c, photos: [...c.photos, photo].slice(0, 2) }));
  }
  /** Sample Characters fill the next free slots, in order, AND carry their names into
   *  those slots' Name labels (product owner, 2026-11-27); the user can still edit them. */
  function addSampleFaces(picks: { url: string; name: string }[]) {
    const start = compose.photos.length;
    const room = picks.slice(0, Math.max(0, 2 - start));
    if (room.length === 0) return;
    const photos: CharacterPhoto[] = room.map((p) => ({
      id: crypto.randomUUID(),
      url: p.url,
      fromSample: true,
    }));
    setCompose((c) => ({ ...c, photos: [...c.photos, ...photos].slice(0, 2) }));
    setCharacterNames((names) => names.map((n, i) => (room[i - start] ? room[i - start].name : n)));
  }
  function setPhotoName(index: number, name: string) {
    setCharacterNames((names) => names.map((n, i) => (i === index ? name : n)));
  }
  function openSettings() {
    if (loggedIn && !authorDefaultApplied.current) {
      authorDefaultApplied.current = true;
      if (!compose.settings.author.text.trim()) {
        patchCompose({
          settings: {
            ...compose.settings,
            author: { ...compose.settings.author, text: profile.name.slice(0, MV_AUTHOR_MAX) },
          },
        });
      }
    }
    setSettingsOpen(true);
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
    if (mode === "storyboard_first") {
      router.push(localePath(locale, "/mv/thinking"));
      return;
    }
    // Product owner, 2026-09-22: "Create MV Directly" only — the 3s
    // preparing overlay below runs, then this navigates on its own.
    setPreparing(true);
    preparingTimeoutRef.current = window.setTimeout(() => {
      router.push(localePath(locale, "/mv/creating"));
    }, 3000);
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
      <RoomNavbar title="AI Music Video" mobileBackHref="/" className="room-navbar__top--tight" />

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

          <div ref={tplSectionRef} className="mv-create__section mv-create__section--template">
            <div className="mv-create__label-row">
              <p className="mv-create__label">
                START FROM A TEMPLATE <span className="mv-create__label-optional">(Optional)</span>
              </p>
              <button
                type="button"
                className="section-header__see-all mv-create__see-all"
                onClick={() => setTemplatesOpen(true)}
              >
                See all
                <DpIcon name="ic_chevron-right" className="section-header__see-all-icon" />
              </button>
            </div>
            {/* Tap to apply, tap again to unselect (product owner, 2026-11-27: no
                preview popup). Nothing is preselected. "Applied" is derived from
                the description itself — the rule Home's MV input uses — so editing
                the text by hand also deselects, with no second state to drift. */}
            <div ref={tplFadeRef} className="mv-create__tpl-row edge-fade">
              {TEMPLATES.map((t) => {
                const on = selectedTemplate?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`mv-create__tpl${on ? " mv-create__tpl--active mv-create__tpl--checked" : ""}`}
                    aria-pressed={on}
                    onClick={() => pickTemplate(t)}
                  >
                    <img src={t.cover} alt="" className="mv-create__tpl-thumb" />
                    <span className="mv-create__tpl-check" aria-hidden="true" />
                    <span className="mv-create__tpl-name">{t.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mv-create__section">
            <p className="mv-create__label">CHARACTERS</p>
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
                            onClick={() => {
                              setCompose((c) => ({
                                ...c,
                                photos: c.photos.filter((p) => p.id !== photo.id),
                              }));
                              // Names are held by slot index, so they shift up with the
                              // photos; otherwise a removed sample's name would stay and
                              // land on the next photo added to that slot.
                              setCharacterNames((names) => [
                                ...names.filter((_, i) => i !== slot),
                                "",
                              ]);
                            }}
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
                              value={characterNames[slot] ?? ""}
                              autoFocus
                              onChange={(e) => setPhotoName(slot, e.target.value)}
                              onBlur={() => setEditingName(null)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") setEditingName(null);
                              }}
                            />
                          ) : (
                            <p className="mv-create__photo-name">
                              {characterNames[slot] || "Name"}
                            </p>
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
                          Character {slot + 1}
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
              accept="image/jpeg,image/png"
              className="mv-create__file-input"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) addPhotoFromFile(f);
                e.target.value = "";
              }}
            />
            <div className="mv-create__label-row">
              <p className="mv-create__sample-label">Sample Characters</p>
              <button
                type="button"
                className="section-header__see-all mv-create__see-all"
                disabled={compose.photos.length >= 2}
                onClick={() => setCharsOpen(true)}
              >
                See all
                <DpIcon name="ic_chevron-right" className="section-header__see-all-icon" />
              </button>
            </div>
            <div ref={sampleFadeRef} className="mv-create__face-row edge-fade">
              {SAMPLE_CHARACTERS.map((c) => (
                <button
                  key={c.url}
                  type="button"
                  className="mv-create__face"
                  onClick={(e) => {
                    revealInRow(e.currentTarget);
                    addSampleFaces([c]);
                  }}
                  aria-label={`Use ${c.name}`}
                >
                  <img src={c.url} alt="" className="mv-create__face-thumb" />
                  <span className="mv-create__face-name">{c.name}</span>
                </button>
              ))}
            </div>
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
                  {/* The applied template, as the Templates button DP's box carries
                      (product owner, 2026-11-27): its cover and name, and a ✕ — one
                      tap removes it and empties the prompt it filled. Shown only while
                      a template is applied, and the group stays when it is not: the
                      footer is `justify-content: space-between`, so without a left
                      child the Enhance / count group slides to the left. */}
                  {selectedTemplate && (
                    <button
                      type="button"
                      className="mv-create__idea-btn"
                      aria-label={`Remove template ${selectedTemplate.name}`}
                      onClick={() => patchCompose({ description: "" })}
                    >
                      <span className="mv-create__idea-thumbs">
                        <img
                          src={selectedTemplate.cover}
                          alt=""
                          className="mv-create__idea-thumb"
                        />
                      </span>
                      {selectedTemplate.name}
                      <DpIcon name="ic_close" className="mv-create__idea-remove" />
                    </button>
                  )}
                </div>
                <div className="mv-create__footer-right">
                  {/* RESTORED 2026-08-27 (product owner) — RD confirmed the
                      backend now supports this call. Was HIDDEN 2026-08-25
                      to 2026-08-27 (`3bdff87`) for having no supported API;
                      that blocker is gone, so the removal is not re-applied
                      here on the next drop. G5-d #10: this goes through
                      `api.enhancePrompt`. DP's equivalent picks a random
                      local string. */}
                  <EnhanceButton
                    value={compose.description}
                    kind="mv"
                    onEnhanced={(t) => patchCompose({ description: t })}
                    bem="mv-create"
                  />
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
            <p className="mv-create__label">SETTINGS</p>
            <button
              type="button"
              className="mv-create__settings"
              onClick={openSettings}
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
              <span className="mv-create__settings-chevron-badge">
                <DpIcon name="ic_chevron-right" className="mv-create__settings-chevron" />
              </span>
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
          is never empty. WA's used to come from the session-local History ALONE,
          so a user who had just signed in had none — and since 2026-09-09
          (YMW260902P0013) it comes from `useMyCreations`, which merges that with
          the same seeded creations `/history` shows. So the signed-in branch is
          no longer empty by default, and this screen no longer disagrees with
          `/song/create` purely because of which flow the user happened to run.

          The guard itself stays, for the signed-OUT case and because the
          alternative was tried: an empty-state card (designer request,
          2026-08-07) was reverted the same day — seeing it right after signing
          in read as broken, not empty.
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
                        date: mv.date,
                      });
                    }}
                  >
                    {/* Figma node 1762:38446 (2311:58208, "My Creations") —
                        same community-style row as Trending MVs below.
                        Stats come from `useMyCreations`: real numbers for a
                        seeded creation, and genuinely 0 for a just-created
                        unpublished one (`HistoryItem` carries no stats, see
                        HistoryProvider.tsx) — not a fabricated stand-in. */}
                    <ListItem
                      variant="community"
                      title={mv.title}
                      coverImage={mv.thumb}
                      // My own creations: no username (it is always me) and
                      // the date it was made instead (Figma 1367:34073, product
                      // owner 2026-11-26). A just-made one has no stored date —
                      // `/mv/result` calls it "just now" and so does this.
                      date={mv.date ?? "Just now"}
                      plays={mv.plays}
                      likes={mv.likes}
                      shares={mv.shares}
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
        <div role="alert" {...toastHold} className="popup-toast popup-toast--error">
          {toast}
        </div>
      )}
      <TemplateListSheet
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        selectedId={selectedTemplateId}
        onApply={(t) => {
          patchCompose({ description: t.prompt });
          setTemplatesOpen(false);
          showTemplateArea();
        }}
      />
      <CharacterListSheet
        open={charsOpen}
        onClose={() => setCharsOpen(false)}
        usedUrls={compose.photos.filter((p) => p.fromSample).map((p) => p.url)}
        maxPick={Math.max(0, 2 - compose.photos.length)}
        onApply={(picks) => {
          addSampleFaces(picks);
          setCharsOpen(false);
        }}
      />
      {preparing && (
        <div className="mv-create__preparing-overlay" role="status" aria-label="Preparing">
          {/* Same 3-dot markup/classes as `HistoryView`'s `HistoryLoadingDots` —
              product owner, 2026-09-14: one loading UI app-wide, not a new one
              per screen. */}
          <div className="history-page__loading-dots">
            <span className="history-page__loading-dot history-page__loading-dot--1" />
            <span className="history-page__loading-dot history-page__loading-dot--2" />
            <span className="history-page__loading-dot history-page__loading-dot--3" />
          </div>
        </div>
      )}
    </>
  );
}
