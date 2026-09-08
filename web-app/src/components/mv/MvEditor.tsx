"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { SeekBar } from "@/components/ui/SeekBar";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { DetailNavbar } from "@/components/shell/DetailNavbar";
import { DpIcon } from "@/components/ui/DpIcon";
import { FloatingCTA } from "@/components/ui/FloatingCTA";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { EnhanceButton } from "@/components/ui/EnhanceButton";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useCredits } from "@/components/providers/CreditsProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { PHONE_QUERY, useMediaQuery } from "@/lib/ssr";
import { downloadFile } from "@/lib/download";
import {
  COST_COVER,
  COST_MERGE,
  recreateShotCost,
  resolutionOf,
  sceneDurationSec,
  shotKind,
  DESCRIPTION_MAX,
  type Scene,
} from "@/lib/mv/types";
import { MV_TYPES, randomCoverImage } from "@/lib/mv/mock";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Storyboard clip thumbnails, one per scene — WA's own asset set. */
const clipCover = (i: number) => `/assets/videos/storyboard-clips/clip_${(i % 19) + 1}.jpg`;

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3k — the last route) ───
 *
 * DP source: `MVEditPage` (Figma "Edit MV_L" node 1351:28314 desktop /
 * "Edit MV" node 49:53 mobile). Classes from
 * `src/styles/designer/MVEditPage.css`, verbatim.
 *
 * ── A12 IS CLOSED, AND IT WAS NEVER ABOUT THIS ROUTE ────────────────────────
 *
 * Four handoffs recorded "DP's `/mv-edit` is a white screen at every width, so
 * porting it would be blind". Run outside the repo with the route's own query
 * string, it turned out to be TWO missing-asset faults in the vendored drop,
 * neither of them specific to this page:
 *
 * 1. `src/assets/hero/*` (9 videos + 9 stills) is absent, and
 *    `HomePage/HeroBannerSection.tsx` imports them by name. One unresolved
 *    import fails the whole module graph, so EVERY route was white — not just
 *    this one. That is why the symptom looked page-specific and wasn't.
 * 2. `src/assets/storyboard-clips/` is absent too, and `data/storyboardClips.ts`
 *    reads it with Vite's eager glob helper. A glob that matches nothing is not an
 *    error — it yields `[]`, so `STORYBOARD_CLIPS[0]` is `undefined` and the
 *    page throws on `.video` at first render. Silent input, loud crash, one
 *    layer away from the cause.
 *
 * With both supplied in a scratch copy the page renders at all six widths, and
 * this port is against what it actually looks like. Recorded in DESIGNER-TODO
 * A12; the fix belongs upstream (ship the assets), not here.
 *
 * ── WHAT DP DOES NOT HAVE, AND IS KEPT ──────────────────────────────────────
 *
 * · **MV-08.** Edits are ephemeral and there is no Project mode: Recreate
 *   OVERWRITES (no take tray, no variant picker, no Save, no undo), and Merge
 *   MV is the re-render. The old `LEGACY_TAKE_TRAY_UI` flag and the tray it
 *   hid are gone — DP has no design for them, and a flag guarding dead markup
 *   inside a migrated screen is worse than the decision it recorded.
 * · **Merge is enabled only by a pending edit** (`dirty`). DP's Merge is always
 *   live, so porting it verbatim would let a user pay the full Merge price
 *   (`COST_MERGE`) to re-render an unchanged video.
 * · **GL-01** on Merge and on both Recreates: below the cost, route to IAP.
 *   DP charges nothing and only checks sign-in.
 * · `resetForRerender()` before `/mv/creating`, so the previous rendered video
 *   cannot survive into the merge.
 * · `EnhanceButton`'s real `api.enhancePrompt` round-trip (G5-d #10), DP-skinned
 *   via `bem="mv-edit"`. DP appends a canned sentence.
 * · The title/author ON-OFF switches. DP has the text inputs only, but
 *   `settings.title.on` / `settings.author.on` are `MvSettingsSchema` fields —
 *   contract surface C2 — and they decide whether the caption is burned in at
 *   all. Composed from DP's own `.mv-edit__toggle-row`, the box it already uses
 *   for Subtitle and Watermark.
 *
 * ── AND WHAT DP HAS THAT WA DID NOT ─────────────────────────────────────────
 *
 * The per-clip storyboard strip with an inline video preview and its own
 * transport, the scene-version history row, the cover lightbox, and — below
 * 768px — a full-screen `MobileSceneDetail` instead of an inline editor,
 * because DP's phone frame has no room for one. All ported.
 *
 * "Delete this Project" is DP's own control with a dead handler. Per the
 * `/creator` precedent (3e: port every action, wire every one), it confirms
 * with History's wording and then discards the in-memory flow and leaves —
 * which is what deleting an uncommitted project means in a flow whose state is
 * in memory. It does not invent a backend delete.
 *
 * Every `.mv-edit__*-icon` is a `background-color` + `mask-*` rule, so they are
 * all `DpIcon`. The only `<img>`-shaped rules on this screen are
 * `.mv-edit__merge-credits img` / `.mv-edit__regen-credits img` (the coins) and
 * the real `.mv-edit__clip img` / `.mv-edit__scene-version img` thumbnails.
 */
export function MvEditor() {
  const router = useRouter();
  const { locale } = useLocale();
  const {
    storyboard,
    setStoryboard,
    saveStoryboard,
    storyboardDirty,
    compose,
    setCompose,
    resetForRerender,
    resetForNewMv,
  } = useMvFlow();
  const { credits, addCredits } = useCredits();
  const isPhone = useMediaQuery(PHONE_QUERY);

  const typeIdx = Math.max(
    0,
    MV_TYPES.findIndex((t) => t.id === compose.mvType),
  );
  const defaultPreview = MV_TYPES[typeIdx].video;
  const pool = MV_TYPES.map((t) => t.video);

  const [selectedClip, setSelectedClip] = useState(0);
  const [sceneVideo, setSceneVideo] = useState<Record<string, string>>({});
  const [sceneVersions, setSceneVersions] = useState<Record<string, string[]>>({});
  const [regenBusy, setRegenBusy] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverLightbox, setCoverLightbox] = useState(false);
  const [mobileSceneOpen, setMobileSceneOpen] = useState(false);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);

  // Designer request, 2026-08-11: the per-scene Recreate button should start
  // disabled and only enable once the user has actually edited THIS scene's
  // prompt — recreating an untouched scene spends a full `recreateShotCost()`
  // for a result that (per MV-08 below) is random anyway, not driven by the edit.
  // State, not a ref: `react-hooks/refs` (this repo's lint config) forbids
  // reading/writing `.current` during render, only in effects/handlers — so
  // this uses React's own "adjust state during render" pattern instead (the
  // same one `SignInModal`'s `prevOpen` comparison already uses), setting
  // state directly in the render body, guarded so it only fires once per id.
  const [originalSceneText, setOriginalSceneText] = useState<Record<string, string>>({});

  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Tolerant redirect: wait briefly so a persisted storyboard can hydrate.
  useEffect(() => {
    if (storyboard) return;
    const t = setTimeout(() => router.replace(localePath(locale, "/mv/room")), 400);
    return () => clearTimeout(t);
  }, [storyboard, router, locale]);

  useEffect(() => {
    if (!coverLightbox) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setCoverLightbox(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [coverLightbox]);

  if (!storyboard) return null;

  const scenes = storyboard.scenes;
  const scene: Scene = scenes[selectedClip] ?? scenes[0];
  const activeVideo = sceneVideo[scene.id] ?? defaultPreview;
  const activeCover = coverImage ?? storyboard.coverImage;
  const versions = sceneVersions[scene.id] ?? [];
  if (originalSceneText[scene.id] === undefined) {
    setOriginalSceneText((m) => ({ ...m, [scene.id]: scene.text }));
  }
  const sceneTextEdited =
    originalSceneText[scene.id] !== undefined && scene.text !== originalSceneText[scene.id];

  // MV-08: Merge is enabled by ANY pending edit — a regenerated scene, a
  // recreated cover, an output-settings change, or an edited scene/cover prompt
  // (`storyboardDirty`), since there is no separate Save to commit text edits.
  const dirty =
    Object.keys(sceneVideo).length > 0 || coverImage != null || settingsDirty || storyboardDirty;

  const settings = compose.settings;
  function patchSettings(p: Partial<typeof settings>) {
    setCompose((c) => ({ ...c, settings: { ...c.settings, ...p } }));
    setSettingsDirty(true); // output settings change the rendered video → needs Merge
  }

  function updateScene(id: string, text: string) {
    setStoryboard((sb) =>
      sb ? { ...sb, scenes: sb.scenes.map((s) => (s.id === id ? { ...s, text } : s)) } : sb,
    );
  }

  // Spec 11 §3.5 — `recreate` 8 + per-second at the rate for THIS shot's kind
  // (sing 7 · story 2/4), not the MV's type: a Hybrid MV bills both. §5.4 says
  // each shot is charged on its own, never batched.
  const sceneCost = recreateShotCost(
    shotKind(scene, compose.mvType),
    resolutionOf(compose.settings),
    sceneDurationSec(scene.range),
  );

  function recreateScene() {
    if (regenBusy) return;
    if (credits < sceneCost) {
      setBuyOpen(true);
      return;
    }
    setRegenBusy(true);
    addCredits(-sceneCost);
    const others = pool.filter((v) => v !== activeVideo);
    const next = others[Math.floor(Math.random() * others.length)] ?? defaultPreview;
    window.setTimeout(() => {
      // MV-08: overwrite directly. The version strip is a RECORD of what was
      // generated, not a tray to pick a different outcome from.
      setSceneVideo((m) => ({ ...m, [scene.id]: next }));
      setSceneVersions((m) => ({ ...m, [scene.id]: [...(m[scene.id] ?? []), next] }));
      setRegenBusy(false);
    }, 2600);
  }

  function recreateCover() {
    if (coverBusy) return;
    if (credits < COST_COVER) {
      setBuyOpen(true);
      return;
    }
    setCoverBusy(true);
    addCredits(-COST_COVER);
    const next = randomCoverImage();
    window.setTimeout(() => {
      setCoverImage(next);
      setCoverBusy(false);
    }, 2200);
  }

  function merge() {
    if (!dirty) return;
    // GL-01: the render cost is charged on generation start in the provider.
    // Block and route to IAP when the balance cannot cover it.
    if (credits < COST_MERGE) {
      setBuyOpen(true);
      return;
    }
    const committed = { ...storyboard!, coverImage: activeCover };
    setStoryboard(committed);
    saveStoryboard(committed);
    // §3.6 — Merge is a FLAT 10 at any length, not a re-render price. Saying so
    // explicitly is what lets the provider tell it apart from Generate MV.
    resetForRerender("merge");
    router.push(localePath(locale, "/mv/creating"));
  }

  function deleteProject() {
    setDeleteConfirm(false);
    resetForNewMv();
    router.push(localePath(locale, "/history"));
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    // The rejection has to be caught: without user activation play() rejects
    // with NotAllowedError and the unhandled rejection prints to the console,
    // which the R-2 specs assert is empty.
    if (v.paused) void v.play().catch(() => {});
    else v.pause();
  }

  // TODO.md #5 / 7a: seeking goes through `ui/SeekBar`, which is keyboard-
  // operable. DP draws this bar as a bare div with only `onPointerDown`; that
  // is a Serious WCAG 2.1.1 failure, and `SeekBar` was built for `/watch` to
  // avoid copying it. Adopted here 2026-08-12 — pixel-neutral, same markup.
  function seek(next: number) {
    const media = videoRef.current;
    if (!media || !media.duration) return;
    media.currentTime = Math.min(media.duration, Math.max(0, next));
  }

  const sceneEditor = (
    <>
      <div className="mv-edit__scene-header">
        <p className="mv-edit__scene-title">SCENE {scene.index}</p>
        <p className="mv-edit__scene-time">{scene.range}</p>
      </div>
      <div className="mv-edit__input-box">
        <textarea
          className="mv-edit__textarea"
          maxLength={DESCRIPTION_MAX}
          value={scene.text}
          onChange={(e) => updateScene(scene.id, e.target.value)}
          aria-label={`Scene ${scene.index}`}
        />
        <div className="mv-edit__input-footer">
          <EnhanceButton
            value={scene.text}
            kind="storyboard"
            onEnhanced={(t) => updateScene(scene.id, t)}
            bem="mv-edit"
          />
          <span className="mv-edit__char-count">
            {scene.text.length}/{DESCRIPTION_MAX}
          </span>
          {scene.text.length > 0 && (
            <button
              type="button"
              className="mv-edit__clear-btn"
              onClick={() => updateScene(scene.id, "")}
              aria-label="Clear scene"
            >
              <DpIcon name="ic_close" className="mv-edit__clear-icon" />
            </button>
          )}
        </div>
        <div className="mv-edit__divider" />
        <div className="mv-edit__scene-history">
          {/* G7 a11y: a bare <div> has role `generic`, which does not permit
              aria-label — the name was silently dropped from the a11y tree
              (axe `aria-prohibited-attr`). `group` is the role that carries it. */}
          <div
            className="mv-edit__scene-versions"
            role="group"
            aria-label="Generated scene history"
          >
            {versions.map((v, i) => (
              <span key={`${v}-${i}`} className="mv-edit__scene-version">
                <img src={clipCover(selectedClip + i + 1)} alt="" />
              </span>
            ))}
          </div>
          {/* DP builds this one from the shared `Button` component
              (`variant="PrimaryPayg"`), NOT from `.mv-edit__regen-btn` — the
              cover's Recreate is the one with its own block. `.mv-edit__recreate-scene`
              alone is just `flex: 0 0 auto`, so dropping the `.button--*` classes
              leaves an unstyled row, and there is no refresh icon on this variant.
              The coin is a real `<img className="button__icon">`: `.button__icon`
              sizes, `.button__icon--mask` paints — and only the mask modifier
              turns it into a mask. */}
          <button
            type="button"
            className="button button--large button--primary-payg mv-edit__recreate-scene"
            onClick={recreateScene}
            disabled={regenBusy || !sceneTextEdited}
          >
            <span className="button__label">{regenBusy ? "Recreating…" : "Recreate"}</span>
            <span className="button__credits">
              <img className="button__icon" src="/assets/icons/ui/ic_credit.svg" alt="" />
              <span className="button__credits-count">{sceneCost}</span>
            </span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <DetailNavbar title="Edit Music Video" fallbackPath="/mv/result" />

      <div className="mv-edit">
        <div className="mv-edit__panel">
          <div className="mv-edit__section mv-edit__section--storyboard">
            <p className="mv-edit__label">STORYBOARD</p>
            <p className="mv-edit__sublabel">Select to edit storyboard</p>

            <div className="mv-edit__clips-shell">
              <div className="mv-edit__clips">
                {scenes.map((s, index) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`mv-edit__clip${index === selectedClip ? " mv-edit__clip--active" : ""}`}
                    onClick={() => {
                      setSelectedClip(index);
                      setCurrentTime(0);
                      // Desktop switches the inline preview; phones have no
                      // inline editor at all, so a tap opens the full-screen one.
                      if (isPhone) setMobileSceneOpen(true);
                    }}
                    aria-label={`Scene ${s.index}`}
                    aria-pressed={index === selectedClip}
                  >
                    <img src={clipCover(index)} alt="" />
                    <span className="mv-edit__clip-scrim" aria-hidden="true" />
                    <span className="mv-edit__clip-number">{index + 1}</span>
                  </button>
                ))}
              </div>
              <span className="mv-edit__clips-gradient" aria-hidden="true" />
            </div>

            <div ref={previewRef} className="mv-edit__preview">
              <video
                ref={videoRef}
                className="mv-edit__preview-video mv-edit__preview-video--portrait"
                src={activeVideo}
                poster={clipCover(selectedClip)}
                autoPlay
                loop
                muted={muted}
                playsInline
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onClick={togglePlay}
              />
              {/* A <button>, not DP's download anchor: `guard-greps.sh` bans a
                  literal internal href, and this is a real action anyway. */}
              <button
                type="button"
                className="mv-edit__media-action mv-edit__media-action--download"
                onClick={() => downloadFile(activeVideo, `scene-${scene.index}.mp4`)}
                aria-label="Download video"
              >
                <DpIcon name="ic_download" className="mv-edit__media-action-icon" />
              </button>
              <div className="mv-edit__preview-controls">
                <button
                  type="button"
                  className="mv-edit__control-btn"
                  onClick={togglePlay}
                  aria-label={playing ? "Pause" : "Play"}
                >
                  <DpIcon
                    name={playing ? "ic_pause" : "ic_play"}
                    className="mv-edit__control-icon"
                  />
                </button>
                <span className="mv-edit__time">{formatTime(currentTime)}</span>
                <SeekBar
                  value={currentTime}
                  max={duration}
                  onSeek={seek}
                  label="Seek within the preview"
                  className="mv-edit__progress"
                  trackClassName="mv-edit__progress-track"
                  fillClassName="mv-edit__progress-fill"
                  thumbClassName="mv-edit__progress-thumb"
                />
                <span className="mv-edit__time">{formatTime(duration)}</span>
                <button
                  type="button"
                  className="mv-edit__control-btn"
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  <DpIcon
                    name={muted ? "ic_speaker_off" : "ic_speaker_on"}
                    className="mv-edit__control-icon"
                  />
                </button>
                <button
                  type="button"
                  className="mv-edit__control-btn"
                  onClick={() => previewRef.current?.requestFullscreen?.().catch(() => {})}
                  aria-label="Fullscreen"
                >
                  <DpIcon name="ic_expand" className="mv-edit__control-icon" />
                </button>
              </div>
            </div>
          </div>

          {/* Its OWN section, not part of --storyboard: DP hides
              `.mv-edit__section--scene-editor` (and `.mv-edit__preview`) below
              768px, where `MobileSceneDetail` replaces both. Nesting these
              inside the storyboard section makes that rule match nothing and
              the desktop editor leaks onto phones. */}
          <div className="mv-edit__section mv-edit__section--scene-editor">{sceneEditor}</div>

          {/* G7 finding 3k-1: MV-08 is still enforced, but the migration lost
              the one sentence that EXPLAINED it — so Merge sat disabled with no
              stated reason and edits looked saved. `mv-edit__sublabel` is DP's
              own muted explanatory line, already used on this screen for
              "Select to edit storyboard"; no new class, no override. */}
          {/* TODO.md #9 (found 2026-08-28, deferred by the product owner until the
              S3 spec landed, fixed 2026-09-03). This sentence rendered
              "(26credits)" with no space, while the IDENTICAL construction around
              `COST_MERGE` eight words later rendered "(10 credits)" with one —
              even though the JSX source carried a literal space in both places.
              Reading the source can never explain that; the compiled bundle does.
              SWC emitted the children as

                ["Recreate (", sceneCost,
                 "credits) … saved — Merge MV (", COST_MERGE,
                 " credits) re-renders …"]

              The surviving space belongs to the text node whose second source line
              is whitespace-only (dropped, so the node is effectively single-line);
              the stripped one belongs to the node whose run spans two NON-empty
              source lines, where SWC trims the leading whitespace of the joined
              result. So the trigger is where Prettier happened to WRAP the line,
              not the expression before it — which means any future reflow of this
              paragraph can silently reintroduce it, in either half.

              Hence string literals rather than JSX text: a `{" "}` would fix
              today's wrap, but these leave no JSX text node for a formatter to
              re-wrap at all. Guarded by e2e "TODO#9", mutation-tested both ways.
              (The apostrophe is a plain ' inside a JS string, which is the same
              U+0027 `&apos;` produced — not a copy change.) */}
          <p className="mv-edit__sublabel">
            Recreate ({sceneCost}
            {" credits) replaces a scene directly. Edits aren't saved — Merge MV ("}
            {COST_MERGE}
            {" credits) re-renders the video with your changes."}
          </p>

          <div className="mv-edit__ctas">
            <button
              type="button"
              className="mv-edit__delete-btn"
              onClick={() => setDeleteConfirm(true)}
            >
              <DpIcon name="ic_delete" className="mv-edit__delete-icon" />
              Delete this Project
            </button>
          </div>

          <FloatingCTA alignToParent>
            <button type="button" className="mv-edit__merge-btn" onClick={merge} disabled={!dirty}>
              <span>Merge MV</span>
              <span className="mv-edit__merge-credits">
                <img src="/assets/icons/ui/ic_credit.svg" alt="" />
                {COST_MERGE}
              </span>
            </button>
          </FloatingCTA>
        </div>

        <div className="mv-edit__side">
          <div className="mv-edit__section mv-edit__section--cover">
            <p className="mv-edit__label">COVER IMAGE</p>
            <div
              className={`mv-edit__cover-image${coverBusy ? " mv-edit__cover-image--processing" : ""}`}
            >
              <img
                src={activeCover}
                alt=""
                className="mv-edit__cover-media mv-edit__cover-media--portrait"
              />
              {/* Always mounted; the modifier above toggles opacity/pointer-events. */}
              <div className="mv-edit__cover-processing" aria-hidden="true">
                <DpIcon name="ic_refresh" className="mv-edit__cover-processing-icon" />
              </div>
              <button
                type="button"
                className="mv-edit__media-action mv-edit__media-action--download"
                onClick={() => downloadFile(activeCover, "cover.jpg")}
                aria-label="Download cover image"
              >
                <DpIcon name="ic_download" className="mv-edit__media-action-icon" />
              </button>
              <button
                type="button"
                className="mv-edit__media-action mv-edit__media-action--expand"
                onClick={() => setCoverLightbox(true)}
                aria-label="Expand cover image"
              >
                <DpIcon name="ic_expand" className="mv-edit__media-action-icon" />
              </button>
            </div>

            {/* Mobile-only label — desktop's single COVER IMAGE heading covers
                both boxes, phones split them into two labelled cards. */}
            <p className="mv-edit__label mv-edit__label--cover-description">COVER DESCRIPTION</p>
            <div className="mv-edit__input-box">
              <textarea
                className="mv-edit__textarea"
                maxLength={DESCRIPTION_MAX}
                value={storyboard.coverDescription}
                onChange={(e) =>
                  setStoryboard((sb) => (sb ? { ...sb, coverDescription: e.target.value } : sb))
                }
                aria-label="Cover description"
              />
              <div className="mv-edit__input-footer">
                <EnhanceButton
                  value={storyboard.coverDescription}
                  kind="storyboard"
                  onEnhanced={(t) =>
                    setStoryboard((sb) => (sb ? { ...sb, coverDescription: t } : sb))
                  }
                  bem="mv-edit"
                />
                <span className="mv-edit__char-count">
                  {storyboard.coverDescription.length}/{DESCRIPTION_MAX}
                </span>
                {storyboard.coverDescription.length > 0 && (
                  <button
                    type="button"
                    className="mv-edit__clear-btn"
                    onClick={() =>
                      setStoryboard((sb) => (sb ? { ...sb, coverDescription: "" } : sb))
                    }
                    aria-label="Clear cover prompt"
                  >
                    <DpIcon name="ic_close" className="mv-edit__clear-icon" />
                  </button>
                )}
              </div>
              <div className="mv-edit__divider" />
              <button
                type="button"
                className="mv-edit__regen-btn"
                onClick={recreateCover}
                disabled={coverBusy}
              >
                <DpIcon
                  name="ic_refresh"
                  className={`mv-edit__regen-icon${coverBusy ? " mv-edit__enhance-icon--spinning" : ""}`}
                />
                <span>Recreate</span>
                <span className="mv-edit__regen-credits">
                  <img src="/assets/icons/ui/ic_credit.svg" alt="" />
                  {COST_COVER}
                </span>
              </button>
            </div>
          </div>

          <div className="mv-edit__section mv-edit__section--title">
            <p className="mv-edit__label">MV TITLE</p>
            {/* The ON/OFF switch is WA-only — `settings.title.on` is a contract
                field and decides whether the caption is burned in at all. */}
            <div className="mv-edit__toggle-row">
              <div className="mv-edit__toggle-text">
                <p className="mv-edit__toggle-title">Show MV title</p>
                <p className="mv-edit__toggle-state">{settings.title.on ? "On" : "Off"}</p>
              </div>
              <ToggleSwitch
                checked={settings.title.on}
                ariaLabel="Show MV title"
                onChange={(on) => patchSettings({ title: { ...settings.title, on } })}
              />
            </div>
            <div className="mv-edit__field-box">
              <input
                type="text"
                className="mv-edit__field-input"
                value={settings.title.text}
                disabled={!settings.title.on}
                onChange={(e) =>
                  patchSettings({ title: { ...settings.title, text: e.target.value } })
                }
                aria-label="MV title"
              />
              {settings.title.text.length > 0 && (
                <button
                  type="button"
                  className="mv-edit__clear-btn"
                  onClick={() => patchSettings({ title: { ...settings.title, text: "" } })}
                  aria-label="Clear MV title"
                >
                  <DpIcon name="ic_close" className="mv-edit__clear-icon" />
                </button>
              )}
            </div>
          </div>

          <div className="mv-edit__section mv-edit__section--author">
            <p className="mv-edit__label">AUTHOR NAME</p>
            <div className="mv-edit__toggle-row">
              <div className="mv-edit__toggle-text">
                <p className="mv-edit__toggle-title">Show author name</p>
                <p className="mv-edit__toggle-state">{settings.author.on ? "On" : "Off"}</p>
              </div>
              <ToggleSwitch
                checked={settings.author.on}
                ariaLabel="Show author name"
                onChange={(on) => patchSettings({ author: { ...settings.author, on } })}
              />
            </div>
            <div className="mv-edit__field-box">
              <input
                type="text"
                className="mv-edit__field-input"
                value={settings.author.text}
                disabled={!settings.author.on}
                onChange={(e) =>
                  patchSettings({ author: { ...settings.author, text: e.target.value } })
                }
                aria-label="Author name"
              />
              {settings.author.text.length > 0 && (
                <button
                  type="button"
                  className="mv-edit__clear-btn"
                  onClick={() => patchSettings({ author: { ...settings.author, text: "" } })}
                  aria-label="Clear author name"
                >
                  <DpIcon name="ic_close" className="mv-edit__clear-icon" />
                </button>
              )}
            </div>
          </div>

          <div className="mv-edit__toggle-row mv-edit__toggle-row--subtitle">
            <div className="mv-edit__toggle-text">
              <p className="mv-edit__toggle-title">Show Subtitle</p>
              <p className="mv-edit__toggle-state">{settings.showSubtitle ? "On" : "Off"}</p>
            </div>
            <ToggleSwitch
              checked={settings.showSubtitle}
              ariaLabel="Show Subtitle"
              onChange={(showSubtitle) => patchSettings({ showSubtitle })}
            />
          </div>

          <div className="mv-edit__toggle-row mv-edit__toggle-row--watermark">
            <div className="mv-edit__toggle-text">
              <p className="mv-edit__toggle-title">Show Watermark</p>
              <p className="mv-edit__toggle-state">{settings.watermark ? "On" : "Off"}</p>
            </div>
            <ToggleSwitch
              checked={settings.watermark}
              ariaLabel="Show Watermark"
              onChange={(watermark) => patchSettings({ watermark })}
            />
          </div>
        </div>
      </div>

      {/* Phone-only full-screen scene editor. Rendered only when the phone query
          matches, so its duplicate controls are never in the desktop tab order. */}
      {isPhone &&
        mobileSceneOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="mv-edit-mobile-scene"
            role="dialog"
            aria-modal="true"
            aria-label={`Scene ${scene.index}`}
          >
            <div className="mv-edit-mobile-scene__header">
              <button
                type="button"
                className="mv-edit-mobile-scene__back"
                onClick={() => setMobileSceneOpen(false)}
                aria-label="Back"
              >
                <DpIcon name="ic_arrow_left" className="mv-edit-mobile-scene__back-icon" />
              </button>
              <p className="mv-edit-mobile-scene__header-title">SCENE {scene.index}</p>
              <span className="mv-edit-mobile-scene__header-spacer" aria-hidden="true" />
            </div>

            <div className="mv-edit-mobile-scene__body">
              <div className="mv-edit-mobile-scene__preview">
                <video
                  className="mv-edit-mobile-scene__preview-video"
                  src={activeVideo}
                  poster={clipCover(selectedClip)}
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
              {sceneEditor}
            </div>
          </div>,
          document.body,
        )}

      {coverLightbox &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="mv-edit__lightbox-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Cover image preview"
            onClick={() => setCoverLightbox(false)}
          >
            <button
              type="button"
              className="mv-edit__lightbox-close"
              onClick={() => setCoverLightbox(false)}
              aria-label="Close"
            >
              <DpIcon name="ic_close" className="mv-edit__lightbox-close-icon" />
            </button>
            <img
              src={activeCover}
              alt=""
              className="mv-edit__lightbox-image"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body,
        )}

      <Modal
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        title="Delete"
        maxWidth={380}
      >
        <p className="mb-5 text-[14px]" style={{ color: "var(--text-2)" }}>
          Are you sure you want to delete this project? This action cannot be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={deleteProject}>
            Delete
          </Button>
        </div>
      </Modal>

      <BuyCreditsModal open={buyOpen} onClose={() => setBuyOpen(false)} />
    </>
  );
}
