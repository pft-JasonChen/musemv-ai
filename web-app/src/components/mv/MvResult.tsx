"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { SeekBar } from "@/components/ui/SeekBar";
import { useRouter, useSearchParams } from "next/navigation";
import { DetailNavbar } from "@/components/shell/DetailNavbar";
import { DpIcon } from "@/components/ui/DpIcon";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { ShareDialog } from "@/components/ui/ShareDialog";
import { PublishConfirmDialog } from "@/components/ui/PublishConfirmDialog";
import { useAuth } from "@/components/providers/AuthProvider";
import { useMvFlow } from "@/components/providers/MvFlowProvider";
import { useHistory } from "@/components/providers/HistoryProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localePath } from "@/lib/i18n/config";
import { buildShareUrl } from "@/lib/share";
import { downloadFile } from "@/lib/download";
import { MV_TYPES, mockStoryboard } from "@/lib/mv/mock";
import { MOCK_USER } from "@/lib/user";
import { useDemoState } from "@/components/demo/useDemo";
import {
  publishRejectLabel,
  PUBLISH_REVIEW_DELAY_MS,
  type PublishRejectCode,
} from "@/lib/publishReview";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * ── MIGRATED TO THE DESIGNER UI (plan Phase 3, slice 3i) ────────────────────
 *
 * DP source: `MVResultPage` (Figma "MV Result_L" — portrait node 1614:75834 /
 * landscape 1605:73247, one frame with the aspect setting switched, which is
 * how `--portrait` / `--landscape` works here too). Classes from
 * `src/styles/designer/MVResultPage.css`, verbatim.
 *
 * **`@needs-figma-recheck`** — carried forward from the plan's route table.
 * And per the product owner (2026-08-06): **A10's 20x20 controls stay as DP
 * drew them.** `.mv-result__control-icon` and `.mv-result__reaction-icon` are
 * both 20x20, under WCAG 2.5.8's 24x24; the reaction icons sit inside a 36x36
 * `.mv-result__icon-btn` so only the two player controls are genuinely small.
 * Not fixed here — a size change is a design decision, and DESIGNER-TODO A10
 * is where it is tracked.
 *
 * ── WHY THIS STOPPED USING `MvDetail` ───────────────────────────────────────
 *
 * `MvDetail` is shared with `CreationDialog`, which is History's row dialog and
 * is NOT in this slice. Restyling it would have silently redesigned a screen
 * nobody looked at, so this route gets DP's markup directly and `MvDetail`
 * keeps its Tailwind for its other consumer.
 *
 * ── WHAT DP DOES NOT HAVE, AND IS KEPT ──────────────────────────────────────
 *
 * · MV-12: publishing asks "Ready to Go Public?" first; unpublishing is
 *   immediate. DP has its own `PublishDialog` for this; WA's existing confirm
 *   is reused because History and `/creator` already share it, and a second
 *   confirm dialog with different copy is how two rules start to drift.
 * · GL-02: publishing is gated on sign-in at the action (`requireLogin`).
 * · MV-13: while published or in review the MV must be UNPUBLISHED before it
 *   can be edited. DP's Edit MV is an unconditional link. Here the fourth
 *   quick action becomes "Unpublish to edit" while published — the control
 *   stays in the same slot rather than disappearing, which is the failure mode
 *   G7 has now caught three times.
 * · Real data everywhere. DP reads its `mvDraft` out of session storage (which
 *   C5 and `guard-greps.sh` both forbid here) and hardcodes the date as
 *   "2026-06-06"; this reads the
 *   live flow state, and the DETAIL list gains the three rows WA had and DP
 *   dropped — Character, Music and Scenes — as more `.mv-result__detail-row`s.
 * · The real share URL, from the History entry, not `window.location`.
 *
 * ── ICONS: THIS SCREEN MIXES BOTH KINDS, ONE LINE APART ─────────────────────
 *
 * `.mv-result__action img` sets width/height only ⇒ the four quick-action
 * icons are real `<img>`. `.mv-result__control-icon`, `__reaction-icon` and
 * `__publish-icon` all set `background-color` + `mask-*` ⇒ `DpIcon`. Getting
 * either wrong paints nothing and throws nothing.
 */
export function MvResult() {
  const router = useRouter();
  const idParam = useSearchParams().get("id");
  const { locale } = useLocale();
  const { requireLogin } = useAuth();
  const { resultUrl, compose, storyboard, setStoryboard, saveStoryboard } = useMvFlow();
  const { history } = useHistory();

  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  // G7 finding 3i-1. The pre-migration screen was a `<video controls>`, so the
  // native bar carried volume; DP's is a hand-built bar with no volume control
  // and a hardcoded `muted`, which left the audio of a COST_RENDER-priced
  // render unreachable. `MvEditor` already solves this the same way on the
  // sibling screen, so the treatment is DP's own, not an invention.
  const [muted, setMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  // Product owner, 2026-08-28: submitting doesn't flip the toggle on straight
  // away — it sits "off" showing "In Review" for `PUBLISH_REVIEW_DELAY_MS`,
  // then either turns on ("On") or comes back rejected. `published` is now
  // ONLY the live/approved state; `pending` is the in-between one, and the
  // toggle's `checked` reads `published`, not `published || pending`.
  const [published, setPublished] = useState(false);
  const [pending, setPending] = useState(false);
  const [pubConfirm, setPubConfirm] = useState(false);
  // Same shape as History/CreatorProfile's own reject state — a rejection
  // reverts to unpublished (rule 2) rather than adding a fourth persistent
  // status, so the reason is separate state that clears the moment a resubmit
  // is accepted.
  const [rejectReason, setRejectReason] = useState<PublishRejectCode | null>(null);
  const demo = useDemoState();

  const entry = history.find((h) => h.kind === "mv" && h.resultUrl === resultUrl);
  // Opened from a `/history` row the id is in the URL and there is no live
  // History job to match on (seed rows are fixtures, not jobs) — without it
  // Share would build `/share?id=`, which resolves to the expired state.
  // `resolveShare` handles both live jobs and seed ids.
  const shareId = idParam ?? entry?.id ?? "";
  // DP has a separate `resultVideo.cover`; WA's equivalent is the job thumb that
  // the History entry already carries. It matters twice: as the video POSTER
  // (the frame shown before the first decoded frame) and as the blurred backdrop
  // DP puts behind a portrait video. Passing the .mp4 URL to an `<img>` there
  // would render a broken image behind a pillarboxed video.
  const poster = entry?.thumb ?? storyboard?.characterImage;

  useEffect(() => {
    if (!resultUrl) router.replace(localePath(locale, "/mv/room"));
  }, [resultUrl, router, locale]);

  if (!resultUrl) return null;

  const typeName = MV_TYPES.find((t) => t.id === compose.mvType)?.name ?? "Singing";
  const songTitle = compose.song?.title ?? "Untitled";
  const title = (compose.settings.title.on && compose.settings.title.text) || songTitle;
  const author = (compose.settings.author.on && compose.settings.author.text) || MOCK_USER.name;
  const isPortrait = compose.settings.ratio === "9:16";

  function editMv() {
    // Carry this video into the editor; ensure a storyboard exists (direct-mode
    // renders have none).
    if (!storyboard) {
      const sb = mockStoryboard();
      setStoryboard(sb);
      saveStoryboard(sb);
    }
    router.push(localePath(locale, "/mv/edit"));
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    // The rejection has to be caught: with no user activation a cold-load
    // play() rejects with NotAllowedError, and an unhandled rejection prints to
    // the console, which the R-2 specs assert is empty.
    if (video.paused) void video.play().catch(() => {});
    else video.pause();
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

  // MV-12 + GL-02.
  function togglePublish(next: boolean) {
    if (!next) {
      setPublished(false);
      setPending(false);
      setRejectReason(null);
      return;
    }
    requireLogin(() => setPubConfirm(true));
  }

  return (
    <>
      {/*
        Back's FALLBACK is `/history`, not `/mv/room` (2026-08-06, product
        owner). `/history` is now a real entry point to this screen, and a
        finished MV is in History whichever way you got here — so the "nowhere to
        go back to" case should land on the list of creations, not on the empty
        compose form.

        **Be clear about how little this fallback does.** Q6's `router.back()`
        wins whenever `hasInAppHistory()` is true, and this screen is only
        reachable with flow state, which only exists after an in-app navigation
        — so the fallback is very nearly unreachable and the change is closer to
        documentation than to behaviour. What actually fixed "Back does nothing
        here" is `GenerationView` switching its forward from `push` to `replace`;
        read that note before assuming this line is doing the work.
      */}
      <DetailNavbar title="Result" fallbackPath="/history" />

      <div className="mv-result">
        <div className="mv-result__panel">
          <div
            ref={stageRef}
            className={`mv-result__player mv-result__player--${isPortrait ? "portrait" : "landscape"}`}
          >
            {isPortrait && poster && (
              <>
                <img src={poster} alt="" className="mv-result__bg" aria-hidden="true" />
                <div className="mv-result__bg-overlay" aria-hidden="true" />
              </>
            )}

            <video
              ref={videoRef}
              className="mv-result__video"
              src={resultUrl}
              poster={poster}
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

            <div className="mv-result__controls">
              <button
                type="button"
                className="mv-result__control-btn"
                onClick={togglePlay}
                aria-label={playing ? "Pause" : "Play"}
              >
                <DpIcon
                  name={playing ? "ic_pause" : "ic_play"}
                  className="mv-result__control-icon"
                />
              </button>
              <span className="mv-result__time">{formatTime(currentTime)}</span>
              <SeekBar
                value={currentTime}
                max={duration}
                onSeek={seek}
                label="Seek within the music video"
                className="mv-result__progress"
                trackClassName="mv-result__progress-track"
                fillClassName="mv-result__progress-fill"
                thumbClassName="mv-result__progress-thumb"
              />
              <span className="mv-result__time">{formatTime(duration)}</span>
              <button
                type="button"
                className="mv-result__control-btn"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? "Unmute" : "Mute"}
              >
                <DpIcon
                  name={muted ? "ic_speaker_off" : "ic_speaker_on"}
                  className="mv-result__control-icon"
                />
              </button>
              <button
                type="button"
                className="mv-result__control-btn"
                onClick={() => stageRef.current?.requestFullscreen?.().catch(() => {})}
                aria-label="Fullscreen"
              >
                <DpIcon name="ic_expand" className="mv-result__control-icon" />
              </button>
            </div>
          </div>
        </div>

        <div className="mv-result__side">
          <div className="mv-result__title-row">
            <div className="mv-result__title-group">
              <p className="mv-result__title">{title}</p>
              <p className="mv-result__date">just now</p>
            </div>
            <div className="mv-result__reactions">
              <button
                type="button"
                className={`mv-result__icon-btn${vote === "up" ? " mv-result__icon-btn--selected" : ""}`}
                onClick={() => setVote((v) => (v === "up" ? null : "up"))}
                aria-label={vote === "up" ? "Unlike" : "Like"}
                aria-pressed={vote === "up"}
              >
                <DpIcon
                  name={vote === "up" ? "ic_like_on" : "ic_like_off"}
                  className="mv-result__reaction-icon"
                />
              </button>
              <button
                type="button"
                className={`mv-result__icon-btn${vote === "down" ? " mv-result__icon-btn--selected" : ""}`}
                onClick={() => setVote((v) => (v === "down" ? null : "down"))}
                aria-label={vote === "down" ? "Remove dislike" : "Dislike"}
                aria-pressed={vote === "down"}
              >
                <DpIcon
                  name={vote === "down" ? "ic_dislike_on" : "ic_dislike_off"}
                  className="mv-result__reaction-icon"
                />
              </button>
            </div>
          </div>

          <div className="mv-result__section">
            <p className="mv-result__label">QUICK ACTIONS</p>
            <div className="mv-result__actions">
              <div className="mv-result__actions-row">
                {/* A <button>, not DP's download anchor — `guard-greps.sh` bans a
                    literal internal href, and this is a real action anyway. */}
                <button
                  type="button"
                  className="mv-result__action"
                  onClick={() => downloadFile(resultUrl, `${title}.mp4`)}
                >
                  <img src="/assets/icons/ui/ic_download.svg" alt="" />
                  Download
                </button>
                <button
                  type="button"
                  className="mv-result__action"
                  onClick={() => setShareOpen(true)}
                >
                  <img src="/assets/icons/ui/ic_share.svg" alt="" />
                  Share
                </button>
              </div>
              <div
                className={`mv-result__actions-row${
                  published || pending ? " mv-result__actions-row--recreate-only" : ""
                }`}
              >
                {/* Product owner, 2026-08-28: MV-13 still applies (can't edit
                    while under review or live) — but the control now
                    disappears instead of becoming "Unpublish to edit". The
                    ONLY way back to editable is the Publish toggle itself. */}
                {!published && !pending && (
                  <button type="button" className="mv-result__action" onClick={editMv}>
                    <img src="/assets/icons/ui/ic_edit.svg" alt="" />
                    Edit MV
                  </button>
                )}
                <button
                  type="button"
                  className="mv-result__action"
                  onClick={() => router.push(localePath(locale, "/mv/room"))}
                >
                  <img src="/assets/icons/ui/ic_video_ai.svg" alt="" />
                  Recreate
                </button>
              </div>
            </div>

            <div className="mv-result__publish">
              <DpIcon name="ic_publish" className="mv-result__publish-icon" />
              <div className="mv-result__publish-text">
                <p className="mv-result__publish-title">
                  Publish
                  {/* Product owner, 2026-08-28, Figma "MV Result_Rejected_L"
                      (node 3213:71460): a red "(Rejected)" suffix on the
                      title, reason in place of the state line below. The
                      "In Review" line ("MV Result_Review_L", node
                      2695:118282) is the pending phase — the toggle stays
                      OFF through it and only turns on once approved. */}
                  {rejectReason && <span className="mv-result__publish-rejected"> (Rejected)</span>}
                </p>
                <p className="mv-result__publish-state">
                  {rejectReason
                    ? publishRejectLabel(rejectReason)
                    : pending
                      ? "In Review"
                      : published
                        ? "On"
                        : "Off"}
                </p>
              </div>
              <ToggleSwitch
                checked={published}
                ariaLabel="Publish to community"
                onChange={togglePublish}
              />
            </div>
          </div>

          <div className="mv-result__section">
            <p className="mv-result__label">DETAIL</p>
            {/* DP's six rows plus the three WA had that DP dropped (Character,
                Music, Scenes) — same box, so nothing new was invented. */}
            {(
              [
                ["Author", author],
                ["MV Type", typeName],
                ["Music", songTitle],
                ["Aspect Ratio", compose.settings.ratio],
                ["Quality", compose.settings.resolution],
                ["Scenes", storyboard ? String(storyboard.scenes.length) : "—"],
                ["Character", compose.photos.length ? String(compose.photos.length) : "—"],
                ["Subtitle", compose.settings.showSubtitle ? "On" : "Off"],
                ["Watermark", compose.settings.watermark ? "On" : "Off"],
              ] as const
            ).map(([key, value]) => (
              <div key={key}>
                <div className="mv-result__divider" />
                <div className="mv-result__detail-row">
                  <span className="mv-result__detail-key">{key}</span>
                  <span className="mv-result__detail-value">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title={title}
        url={buildShareUrl(shareId)}
      />

      {/* MV-12: the same "Ready to Go Public?" confirm History and /creator use.
          2.5: the `?demo=1` panel's `publishRejected` flag + reason decide what
          this submission comes back as, same as `HistoryView.confirmPublishMv` —
          captured now, applied after `PUBLISH_REVIEW_DELAY_MS`, so the pending
          phase is genuinely visible rather than skipped straight to the result. */}
      <PublishConfirmDialog
        open={pubConfirm}
        onCancel={() => setPubConfirm(false)}
        onConfirm={() => {
          setPending(true);
          setRejectReason(null);
          setPubConfirm(false);
          const rejected = demo.flags.publishRejected;
          const reason = demo.rejectReason;
          window.setTimeout(() => {
            setPending(false);
            if (rejected) {
              setPublished(false);
              setRejectReason(reason);
            } else {
              setPublished(true);
            }
          }, PUBLISH_REVIEW_DELAY_MS);
        }}
      />
    </>
  );
}
